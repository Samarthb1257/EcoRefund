using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Entities;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Features.QrCodes.Commands.GenerateQr;

public class GenerateQrCommandHandler : IRequestHandler<GenerateQrCommand, Result<GenerateQrResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IQrService _qrService;
    private readonly IAuditService _auditService;

    public GenerateQrCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IQrService qrService,
        IAuditService auditService)
    {
        _context = context;
        _currentUser = currentUser;
        _qrService = qrService;
        _auditService = auditService;
    }

    public async Task<Result<GenerateQrResponse>> Handle(GenerateQrCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.OrganizationId == null)
            return Result<GenerateQrResponse>.Fail("Authentication required.");

        var orgId = _currentUser.OrganizationId.Value;

        // Verify the role is Entry Staff, Manager, or OrgAdmin
        if (_currentUser.Role is not (UserRole.EntryStaff or UserRole.Manager or UserRole.OrgAdmin or UserRole.SuperAdmin))
            return Result<GenerateQrResponse>.Fail("Only Entry Staff, Manager, or Admin can generate QR codes.");

        // Check organization limits
        var org = await _context.Organizations.FindAsync(new object[] { orgId }, cancellationToken);
        if (org == null || !org.IsActive)
            return Result<GenerateQrResponse>.Fail("Organization not found or inactive.");

        // Check daily QR limit
        var todayCount = await _context.QrCodes
            .CountAsync(q => q.OrganizationId == orgId &&
                             q.GeneratedAt.Date == DateTime.UtcNow.Date, cancellationToken);

        if (todayCount >= org.MaxQrPerDay)
            return Result<GenerateQrResponse>.Fail($"Daily QR limit reached ({org.MaxQrPerDay}). Upgrade your subscription.");

        // Validate ItemType belongs to this org
        var itemType = await _context.ItemTypes
            .FirstOrDefaultAsync(it => it.Id == request.ItemTypeId &&
                                       it.OrganizationId == orgId &&
                                       it.IsActive, cancellationToken);
        if (itemType == null)
            return Result<GenerateQrResponse>.Fail("Invalid item type.");

        // Validate Location belongs to this org
        var location = await _context.Locations
            .FirstOrDefaultAsync(l => l.Id == request.LocationId &&
                                      l.OrganizationId == orgId &&
                                      l.IsActive, cancellationToken);
        if (location == null)
            return Result<GenerateQrResponse>.Fail("Invalid location.");

        // Generate QR number sequence
        var qrCount = await _context.QrCodes.CountAsync(q => q.OrganizationId == orgId, cancellationToken);
        var qrNumber = _qrService.GenerateQrNumber(qrCount + 1);

        // Create QR Code entity first to get the ID
        var qrCode = new QrCode
        {
            OrganizationId = orgId,
            QrCodeNumber = qrNumber,
            QrCodeData = string.Empty,
            Status = QrStatus.Active,
            GeneratedByUserId = _currentUser.UserId!.Value,
            GeneratedAt = DateTime.UtcNow,
            ActivatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(request.ValidityDays)
        };

        _context.QrCodes.Add(qrCode);

        // Generate QR data with the ID
        var qrData = _qrService.GenerateQrCodeData(orgId, qrCode.Id, qrNumber);
        qrCode.QrCodeData = qrData;
        qrCode.QrImageBase64 = _qrService.GenerateQrCodeImageBase64(qrData);

        // Generate item number
        var itemCount = await _context.Items.CountAsync(i => i.OrganizationId == orgId, cancellationToken);
        var itemNumber = $"ITEM-{orgId.ToString()[..4].ToUpper()}-{(itemCount + 1):D6}";

        // Create Item
        var item = new Item
        {
            OrganizationId = orgId,
            ItemTypeId = request.ItemTypeId,
            LocationId = request.LocationId,
            QrCodeId = qrCode.Id,
            RegisteredByUserId = _currentUser.UserId!.Value,
            ItemNumber = itemNumber,
            Description = request.Description,
            DepositAmount = request.DepositAmount > 0 ? request.DepositAmount : itemType.DefaultDepositAmount,
            Status = ItemStatus.Active,
            RegisteredAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(request.ValidityDays)
        };

        _context.Items.Add(item);

        // Create Deposit record
        var deposit = new Deposit
        {
            OrganizationId = orgId,
            ItemId = item.Id,
            QrCodeId = qrCode.Id,
            CollectedByUserId = _currentUser.UserId!.Value,
            Amount = item.DepositAmount,
            PaymentMethod = "Cash",
            CollectedAt = DateTime.UtcNow
        };

        _context.Deposits.Add(deposit);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("QR_GENERATED", "QrCode", qrCode.Id.ToString(),
            description: $"QR {qrNumber} generated for {itemType.TypeName}, deposit ₹{item.DepositAmount}");

        // Generate print label
        var qrImageBytes = _qrService.GenerateQrCodeImage(qrData);
        var printLabel = _qrService.GeneratePrintLabel(
            qrNumber, itemType.TypeName, item.DepositAmount, org.OrganizationName, qrImageBytes);

        return Result<GenerateQrResponse>.Ok(new GenerateQrResponse
        {
            QrCodeId = qrCode.Id,
            QrCodeNumber = qrNumber,
            QrImageBase64 = qrCode.QrImageBase64!,
            ItemId = item.Id,
            ItemNumber = itemNumber,
            ItemTypeName = itemType.TypeName,
            DepositAmount = item.DepositAmount,
            ExpiresAt = qrCode.ExpiresAt!.Value,
            PrintLabelBytes = printLabel
        }, $"QR Code {qrNumber} generated successfully.");
    }
}
