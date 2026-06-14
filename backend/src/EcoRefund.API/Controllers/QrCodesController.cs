using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Features.QrCodes.Commands.GenerateQr;
using EcoRefund.Application.Features.QrCodes.Commands.ScanQr;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.API.Controllers;

public class QrCodesController : BaseController
{
    private readonly ISender _mediator;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public QrCodesController(ISender mediator, IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
    }

    /// <summary>Generate QR code for a new item (Entry Staff)</summary>
    [HttpPost("generate")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,EntryStaff")]
    public async Task<IActionResult> Generate([FromBody] GenerateQrCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        if (result.Success && result.Data != null)
        {
            return Ok(new
            {
                success = true,
                data = new
                {
                    result.Data.QrCodeId,
                    result.Data.QrCodeNumber,
                    result.Data.QrImageBase64,
                    result.Data.ItemId,
                    result.Data.ItemNumber,
                    result.Data.ItemTypeName,
                    result.Data.DepositAmount,
                    result.Data.ExpiresAt,
                    PrintLabelBase64 = result.Data.PrintLabelBytes != null
                        ? Convert.ToBase64String(result.Data.PrintLabelBytes)
                        : null
                },
                message = result.Message
            });
        }
        return HandleResult(result);
    }

    /// <summary>Scan QR code (Exit Staff) - validates and returns item info</summary>
    [HttpPost("scan")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,ExitStaff")]
    public async Task<IActionResult> Scan([FromBody] ScanQrRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new ScanQrCommand(request.QrCodeData, request.DeviceInfo), ct);
        return HandleResult(result);
    }

    /// <summary>Download QR print label as PDF</summary>
    [HttpGet("{id}/print")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,EntryStaff")]
    public async Task<IActionResult> PrintLabel(Guid id, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        var qr = await _context.QrCodes
            .Include(q => q.Item).ThenInclude(i => i!.ItemType)
            .Include(q => q.Organization)
            .FirstOrDefaultAsync(q => q.Id == id &&
                                      (orgId == null || q.OrganizationId == orgId), ct);

        if (qr == null) return NotFound(new { success = false, message = "QR Code not found." });

        var qrService = HttpContext.RequestServices.GetRequiredService<Application.Common.Interfaces.IQrService>();
        var imageBytes = qrService.GenerateQrCodeImage(qr.QrCodeData);
        var label = qrService.GeneratePrintLabel(
            qr.QrCodeNumber,
            qr.Item?.ItemType?.TypeName ?? "Item",
            qr.Item?.DepositAmount ?? 0,
            qr.Organization?.OrganizationName ?? string.Empty,
            imageBytes);

        return File(label, "application/pdf", $"qr-label-{qr.QrCodeNumber}.pdf");
    }

    /// <summary>Get QR code list (OrgAdmin, Auditor)</summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,Auditor")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] QrStatus? status = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;

        var query = _context.QrCodes
            .Include(q => q.Item).ThenInclude(i => i!.ItemType)
            .Include(q => q.GeneratedBy)
            .Where(q => orgId == null || q.OrganizationId == orgId)
            .AsQueryable();

        if (status.HasValue) query = query.Where(q => q.Status == status.Value);
        if (!string.IsNullOrEmpty(search)) query = query.Where(q => q.QrCodeNumber.Contains(search));
        if (from.HasValue) query = query.Where(q => q.GeneratedAt >= from.Value);
        if (to.HasValue) query = query.Where(q => q.GeneratedAt <= to.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(q => q.GeneratedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new
            {
                q.Id,
                q.QrCodeNumber,
                q.Status,
                StatusName = q.Status.ToString(),
                ItemTypeName = q.Item != null && q.Item.ItemType != null ? q.Item.ItemType.TypeName : null,
                DepositAmount = q.Item != null ? q.Item.DepositAmount : (decimal?)null,
                GeneratedBy = q.GeneratedBy != null ? q.GeneratedBy.Email : null,
                q.GeneratedAt,
                q.ExpiresAt,
                q.RedeemedAt,
                q.ScanAttemptCount
            })
            .ToListAsync(ct);

        return Ok(new { success = true, data = items, total, page, pageSize });
    }

    /// <summary>Get QR code details</summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,Auditor,ExitStaff")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;
        var qr = await _context.QrCodes
            .Include(q => q.Item).ThenInclude(i => i!.ItemType)
            .Include(q => q.Item).ThenInclude(i => i!.Location)
            .Include(q => q.GeneratedBy)
            .Include(q => q.ScanAttempts)
            .FirstOrDefaultAsync(q => q.Id == id && (orgId == null || q.OrganizationId == orgId), ct);

        if (qr == null) return NotFound(new { success = false, message = "QR Code not found." });

        return Ok(new { success = true, data = qr });
    }
}

public class ScanQrRequest
{
    public string QrCodeData { get; set; } = string.Empty;
    public string? DeviceInfo { get; set; }
}
