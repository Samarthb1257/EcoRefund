using EcoRefund.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.API.Controllers;

public class DepositsController : BaseController
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DepositsController(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

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

        var query = _context.Deposits
            .Include(d => d.Item).ThenInclude(i => i!.ItemType)
            .Include(d => d.Item).ThenInclude(i => i!.Location)
            .Include(d => d.QrCode)
            .Include(d => d.CollectedBy)
            .Where(d => orgId == null || d.OrganizationId == orgId)
            .AsQueryable();

        if (from.HasValue) query = query.Where(d => d.CollectedAt >= from.Value);
        if (to.HasValue)   query = query.Where(d => d.CollectedAt <= to.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(d => d.CollectedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                d.Id,
                QrCodeNumber    = d.QrCode != null ? d.QrCode.QrCodeNumber : null,
                ItemTypeName    = d.Item != null && d.Item.ItemType != null ? d.Item.ItemType.TypeName : null,
                LocationName    = d.Item != null && d.Item.Location != null ? d.Item.Location.LocationName : null,
                d.Amount,
                d.PaymentMethod,
                d.TransactionReference,
                CollectedByEmail = d.CollectedBy != null ? d.CollectedBy.Email : null,
                d.CollectedAt,
                d.Notes
            })
            .ToListAsync(ct);

        return Ok(new { success = true, data = items, total, page, pageSize });
    }

    [HttpGet("summary")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,Auditor")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate   = to   ?? DateTime.UtcNow;

        var deposits = _context.Deposits
            .Where(d => (orgId == null || d.OrganizationId == orgId) &&
                        d.CollectedAt >= fromDate && d.CollectedAt <= toDate);

        var summary = new
        {
            TotalDeposits = await deposits.CountAsync(ct),
            TotalAmount   = await deposits.SumAsync(d => (decimal?)d.Amount, ct) ?? 0
        };

        return Ok(new { success = true, data = summary });
    }
}
