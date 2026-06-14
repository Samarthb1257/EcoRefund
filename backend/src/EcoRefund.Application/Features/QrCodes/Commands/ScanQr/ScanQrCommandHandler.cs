using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Entities;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EcoRefund.Application.Features.QrCodes.Commands.ScanQr;

public class ScanQrCommandHandler : IRequestHandler<ScanQrCommand, Result<ScanQrResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _auditService;

    public ScanQrCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditService auditService)
    {
        _context = context;
        _currentUser = currentUser;
        _auditService = auditService;
    }

    public async Task<Result<ScanQrResponse>> Handle(ScanQrCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.OrganizationId == null)
            return Result<ScanQrResponse>.Fail("Authentication required.");

        // Parse QR data
        QrPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<QrPayload>(request.QrCodeData);
        }
        catch
        {
            await LogScanAttempt(null, ScanResult.InvalidQr, request.DeviceInfo, "Invalid QR format", cancellationToken);
            return Result<ScanQrResponse>.Ok(new ScanQrResponse
            {
                Result = ScanResult.InvalidQr,
                Message = "Invalid QR code. This QR code cannot be recognized.",
                CanRefund = false
            });
        }

        if (payload == null || payload.QrId == Guid.Empty)
        {
            await LogScanAttempt(null, ScanResult.InvalidQr, request.DeviceInfo, "Malformed QR payload", cancellationToken);
            return Result<ScanQrResponse>.Ok(new ScanQrResponse
            {
                Result = ScanResult.InvalidQr,
                Message = "Invalid QR code format.",
                CanRefund = false
            });
        }

        // Find the QR code
        var qrCode = await _context.QrCodes
            .Include(q => q.Item)
                .ThenInclude(i => i!.ItemType)
            .Include(q => q.Item)
                .ThenInclude(i => i!.Location)
            .Include(q => q.Organization)
            .FirstOrDefaultAsync(q => q.Id == payload.QrId, cancellationToken);

        if (qrCode == null)
        {
            await LogScanAttempt(payload.QrId, ScanResult.NotFound, request.DeviceInfo, "QR not in database", cancellationToken);
            return Result<ScanQrResponse>.Ok(new ScanQrResponse
            {
                Result = ScanResult.NotFound,
                Message = "QR code not found in the system.",
                CanRefund = false
            });
        }

        // CRITICAL: Check organization isolation - tenant security
        if (qrCode.OrganizationId != _currentUser.OrganizationId)
        {
            await LogScanAttempt(qrCode.Id, ScanResult.WrongOrganization, request.DeviceInfo,
                "Cross-tenant scan attempt blocked", cancellationToken);
            return Result<ScanQrResponse>.Ok(new ScanQrResponse
            {
                Result = ScanResult.WrongOrganization,
                Message = "This QR code belongs to a different organization.",
                CanRefund = false
            });
        }

        // Check if already refunded / invalid
        if (qrCode.Status is QrStatus.Refunded or QrStatus.Invalid)
        {
            qrCode.ScanAttemptCount++;
            await _context.SaveChangesAsync(cancellationToken);
            await LogScanAttempt(qrCode.Id, ScanResult.AlreadyRedeemed, request.DeviceInfo,
                "Already redeemed scan attempt", cancellationToken);

            return Result<ScanQrResponse>.Ok(new ScanQrResponse
            {
                Result = ScanResult.AlreadyRedeemed,
                Message = "QR ALREADY REDEEMED. This deposit has already been refunded.",
                CanRefund = false,
                QrCodeNumber = qrCode.QrCodeNumber
            });
        }

        // Check expiry
        if (qrCode.ExpiresAt.HasValue && qrCode.ExpiresAt.Value < DateTime.UtcNow)
        {
            qrCode.Status = QrStatus.Expired;
            await _context.SaveChangesAsync(cancellationToken);
            await LogScanAttempt(qrCode.Id, ScanResult.Expired, request.DeviceInfo, "QR expired", cancellationToken);

            return Result<ScanQrResponse>.Ok(new ScanQrResponse
            {
                Result = ScanResult.Expired,
                Message = "This QR code has expired and can no longer be redeemed.",
                CanRefund = false,
                QrCodeNumber = qrCode.QrCodeNumber
            });
        }

        // Valid scan
        qrCode.ScanAttemptCount++;
        await _context.SaveChangesAsync(cancellationToken);
        await LogScanAttempt(qrCode.Id, ScanResult.Success, request.DeviceInfo, "Valid scan", cancellationToken);

        return Result<ScanQrResponse>.Ok(new ScanQrResponse
        {
            Result = ScanResult.Success,
            Message = "QR code is valid. Ready to process refund.",
            CanRefund = true,
            QrCodeId = qrCode.Id,
            QrCodeNumber = qrCode.QrCodeNumber,
            ItemId = qrCode.Item?.Id,
            ItemNumber = qrCode.Item?.ItemNumber,
            ItemTypeName = qrCode.Item?.ItemType?.TypeName,
            DepositAmount = qrCode.Item?.DepositAmount,
            OrganizationName = qrCode.Organization?.OrganizationName,
            RegisteredAt = qrCode.Item?.RegisteredAt,
            LocationName = qrCode.Item?.Location?.LocationName
        });
    }

    private async Task LogScanAttempt(Guid? qrCodeId, ScanResult result, string? deviceInfo,
        string? notes, CancellationToken cancellationToken)
    {
        if (qrCodeId.HasValue && _currentUser.OrganizationId.HasValue)
        {
            var attempt = new ScanAttempt
            {
                OrganizationId = _currentUser.OrganizationId.Value,
                QrCodeId = qrCodeId.Value,
                ScannedByUserId = _currentUser.UserId,
                Result = result,
                DeviceInfo = deviceInfo,
                Notes = notes,
                ScannedAt = DateTime.UtcNow
            };
            _context.ScanAttempts.Add(attempt);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

internal class QrPayload
{
    public Guid QrId { get; set; }
    public Guid OrgId { get; set; }
    public string QrNum { get; set; } = string.Empty;
}
