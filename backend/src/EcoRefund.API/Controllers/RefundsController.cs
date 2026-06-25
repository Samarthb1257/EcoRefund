using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Features.Refunds.Commands.ProcessRefund;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.API.Controllers;

public class RefundsController : BaseController
{
    private readonly ISender _mediator;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RefundsController(ISender mediator, IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
    }

    /// <summary>Process a refund after QR scan validation (Exit Staff)</summary>
    [HttpPost("process")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,ExitStaff")]
    public async Task<IActionResult> Process([FromBody] ProcessRefundCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Get refund history</summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,Auditor")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;

        var query = _context.Refunds
            .Include(r => r.Item).ThenInclude(i => i!.ItemType)
            .Include(r => r.QrCode)
            .Include(r => r.ProcessedBy)
            .Where(r => orgId == null || r.OrganizationId == orgId)
            .AsQueryable();

        if (from.HasValue) query = query.Where(r => r.ProcessedAt >= from.Value.Date);
        if (to.HasValue)   query = query.Where(r => r.ProcessedAt < to.Value.Date.AddDays(1));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(r => r.ProcessedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                QrCodeNumber = r.QrCode != null ? r.QrCode.QrCodeNumber : null,
                ItemTypeName = r.Item != null && r.Item.ItemType != null ? r.Item.ItemType.TypeName : null,
                r.Amount,
                r.RefundMethod,
                RefundMethodName = r.RefundMethod.ToString(),
                r.TransactionReference,
                ProcessedByEmail = r.ProcessedBy != null ? r.ProcessedBy.Email : null,
                r.ProcessedAt,
                r.Notes
            })
            .ToListAsync(ct);

        return Ok(new { success = true, data = items, total, page, pageSize });
    }

    /// <summary>Get refund summary/statistics</summary>
    [HttpGet("summary")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,Auditor")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;
        var fromDate = (from ?? DateTime.UtcNow.AddDays(-30)).Date;
        var toDate   = (to   ?? DateTime.UtcNow).Date.AddDays(1);

        var refunds = _context.Refunds
            .Where(r => (orgId == null || r.OrganizationId == orgId) &&
                        r.ProcessedAt >= fromDate && r.ProcessedAt < toDate);

        var summary = new
        {
            TotalRefunds = await refunds.CountAsync(ct),
            TotalAmount = await refunds.SumAsync(r => (decimal?)r.Amount, ct) ?? 0,
            ByMethod = await refunds
                .GroupBy(r => r.RefundMethod)
                .Select(g => new { Method = g.Key.ToString(), Count = g.Count(), Total = g.Sum(r => r.Amount) })
                .ToListAsync(ct)
        };

        return Ok(new { success = true, data = summary });
    }
}
