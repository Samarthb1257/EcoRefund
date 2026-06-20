using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Features.Organizations.Commands.RegisterOrganization;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.API.Controllers;

public class OrganizationsController : BaseController
{
    private readonly ISender _mediator;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public OrganizationsController(ISender mediator, IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
    }

    /// <summary>Register a new organization (public - SaaS registration)</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterOrganizationCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Get all organizations (SuperAdmin only)</summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var query = _context.Organizations
            .OrderByDescending(o => o.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(o => o.OrganizationName.Contains(search) ||
                                     o.OrganizationCode.Contains(search) ||
                                     o.Email.Contains(search));

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.OrganizationCode,
                o.OrganizationName,
                o.OrganizationType,
                o.Email,
                o.Phone,
                o.IsActive,
                o.IsLoginEnabled,
                o.SubscriptionPlan,
                o.SubscriptionExpiresAt,
                o.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { success = true, data = items, total, page, pageSize });
    }

    /// <summary>Get organization details</summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        // OrgAdmin can only see their own org
        if (_currentUser.IsOrgAdmin && _currentUser.OrganizationId != id)
            return Forbid();

        var org = await _context.Organizations
            .Where(o => o.Id == id)
            .Select(o => new
            {
                o.Id,
                o.OrganizationCode,
                o.OrganizationName,
                o.OrganizationType,
                o.Address,
                o.City,
                o.State,
                o.PinCode,
                o.Email,
                o.Phone,
                o.GstNumber,
                o.IsActive,
                o.IsLoginEnabled,
                o.SubscriptionPlan,
                o.SubscriptionExpiresAt,
                o.MaxLocations,
                o.MaxUsers,
                o.MaxQrPerDay,
                o.CreatedAt,
                UserCount = o.Users.Count(u => !u.IsDeleted),
                LocationCount = o.Locations.Count(l => !l.IsDeleted),
                ActiveItemCount = o.Items.Count(i => i.Status == ItemStatus.Active)
            })
            .FirstOrDefaultAsync(ct);

        if (org == null) return NotFound(new { success = false, message = "Organization not found." });
        return Ok(new { success = true, data = org });
    }

    /// <summary>Toggle organization login access (SuperAdmin only)</summary>
    [HttpPatch("{id}/toggle-login")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ToggleLogin(Guid id, [FromBody] ToggleLoginDto dto, CancellationToken ct)
    {
        var org = await _context.Organizations.FindAsync(new object[] { id }, ct);
        if (org == null) return NotFound(new { success = false, message = "Organization not found." });

        org.IsLoginEnabled = dto.IsLoginEnabled;
        await _context.SaveChangesAsync(ct);

        var action = dto.IsLoginEnabled ? "enabled" : "disabled";
        return Ok(new { success = true, message = $"Organization login access {action}." });
    }

    /// <summary>Toggle organization active status (SuperAdmin only)</summary>
    [HttpPatch("{id}/toggle-active")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ToggleActive(Guid id, [FromBody] ToggleActiveDto dto, CancellationToken ct)
    {
        var org = await _context.Organizations.FindAsync(new object[] { id }, ct);
        if (org == null) return NotFound(new { success = false, message = "Organization not found." });

        org.IsActive = dto.IsActive;
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, message = $"Organization {(dto.IsActive ? "activated" : "suspended")} successfully." });
    }

    /// <summary>Get organization dashboard stats (OrgAdmin)</summary>
    [HttpGet("{id}/dashboard")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager")]
    public async Task<IActionResult> GetDashboard(Guid id, CancellationToken ct)
    {
        if (_currentUser.IsOrgAdmin && _currentUser.OrganizationId != id)
            return Forbid();

        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-6);
        var thisMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        // Fetch weekly raw data in memory for grouping
        var weeklyDepositDates = await _context.Deposits
            .Where(d => d.OrganizationId == id && d.CollectedAt >= weekStart)
            .Select(d => new { d.CollectedAt, d.Amount })
            .ToListAsync(ct);

        var weeklyRefundDates = await _context.Refunds
            .Where(r => r.OrganizationId == id && r.ProcessedAt >= weekStart)
            .Select(r => new { r.ProcessedAt, r.Amount })
            .ToListAsync(ct);

        var weeklyData = Enumerable.Range(0, 7).Select(i =>
        {
            var day = weekStart.AddDays(i);
            return new
            {
                Day = day.ToString("ddd"),
                Date = day.ToString("dd/MM"),
                Deposits = weeklyDepositDates.Count(d => d.CollectedAt.Date == day),
                Refunds  = weeklyRefundDates.Count(r => r.ProcessedAt.Date == day),
                DepositAmount = weeklyDepositDates.Where(d => d.CollectedAt.Date == day).Sum(d => d.Amount),
                RefundAmount  = weeklyRefundDates.Where(r => r.ProcessedAt.Date == day).Sum(r => r.Amount),
            };
        }).ToList();

        // Refund method breakdown
        var refundMethods = await _context.Refunds
            .Where(r => r.OrganizationId == id)
            .GroupBy(r => r.RefundMethod)
            .Select(g => new { Method = g.Key.ToString(), Count = g.Count(), Amount = g.Sum(r => r.Amount) })
            .ToListAsync(ct);

        var stats = new
        {
            ActiveItems = await _context.Items
                .CountAsync(i => i.OrganizationId == id && i.Status == ItemStatus.Active, ct),
            TodayItems = await _context.Items
                .CountAsync(i => i.OrganizationId == id && i.RegisteredAt.Date == today, ct),
            TotalRefunds = await _context.Refunds
                .CountAsync(r => r.OrganizationId == id, ct),
            TodayRefunds = await _context.Refunds
                .CountAsync(r => r.OrganizationId == id && r.ProcessedAt.Date == today, ct),
            TotalDepositsCollected = await _context.Deposits
                .Where(d => d.OrganizationId == id)
                .SumAsync(d => (decimal?)d.Amount, ct) ?? 0,
            TotalRefundsProcessed = await _context.Refunds
                .Where(r => r.OrganizationId == id)
                .SumAsync(r => (decimal?)r.Amount, ct) ?? 0,
            MonthlyDeposits = await _context.Deposits
                .Where(d => d.OrganizationId == id && d.CollectedAt >= thisMonth)
                .SumAsync(d => (decimal?)d.Amount, ct) ?? 0,
            MonthlyRefunds = await _context.Refunds
                .Where(r => r.OrganizationId == id && r.ProcessedAt >= thisMonth)
                .SumAsync(r => (decimal?)r.Amount, ct) ?? 0,
            FraudAttempts = await _context.ScanAttempts
                .CountAsync(s => s.OrganizationId == id &&
                                 s.Result != Domain.Enums.ScanResult.Success, ct),
            ActiveStaff = await _context.Users
                .CountAsync(u => u.OrganizationId == id &&
                                 u.IsActive && u.IsLoginEnabled && !u.IsDeleted, ct),
            WeeklyData    = weeklyData,
            RefundMethods = refundMethods,
        };

        return Ok(new { success = true, data = stats });
    }

    /// <summary>Platform-wide stats for SuperAdmin dashboard</summary>
    [HttpGet("platform-stats")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetPlatformStats(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-6);
        var thisMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        var weeklyDepositDates = await _context.Deposits
            .Where(d => d.CollectedAt >= weekStart)
            .Select(d => d.CollectedAt)
            .ToListAsync(ct);

        var weeklyRefundDates = await _context.Refunds
            .Where(r => r.ProcessedAt >= weekStart)
            .Select(r => r.ProcessedAt)
            .ToListAsync(ct);

        var weeklyData = Enumerable.Range(0, 7).Select(i =>
        {
            var day = weekStart.AddDays(i);
            return new
            {
                Day      = day.ToString("ddd"),
                Date     = day.ToString("dd/MM"),
                Deposits = weeklyDepositDates.Count(d => d.Date == day),
                Refunds  = weeklyRefundDates.Count(r => r.Date == day),
            };
        }).ToList();

        // Top 5 orgs by refund volume this month
        var topOrgs = await (
            from r in _context.Refunds
            where r.ProcessedAt >= thisMonth
            join o in _context.Organizations on r.OrganizationId equals o.Id
            group r by o.OrganizationName into g
            select new { OrgName = g.Key, Amount = g.Sum(r => r.Amount), Count = g.Count() }
        ).OrderByDescending(g => g.Amount).Take(5).ToListAsync(ct);

        var platformStats = new
        {
            TotalOrgs    = await _context.Organizations.CountAsync(ct),
            ActiveOrgs   = await _context.Organizations.CountAsync(o => o.IsActive, ct),
            TotalUsers   = await _context.Users.CountAsync(ct),
            ActiveUsers  = await _context.Users.CountAsync(u => u.IsActive && u.IsLoginEnabled, ct),
            TotalQrCodes = await _context.QrCodes.CountAsync(ct),
            TotalRefunds = await _context.Refunds.CountAsync(ct),
            TodayItems   = await _context.Items.CountAsync(i => i.RegisteredAt.Date == today, ct),
            TodayRefunds = await _context.Refunds.CountAsync(r => r.ProcessedAt.Date == today, ct),
            TotalDepositsCollected = await _context.Deposits.SumAsync(d => (decimal?)d.Amount, ct) ?? 0,
            TotalRefundsProcessed  = await _context.Refunds.SumAsync(r => (decimal?)r.Amount, ct) ?? 0,
            MonthlyDeposits = await _context.Deposits
                .Where(d => d.CollectedAt >= thisMonth).SumAsync(d => (decimal?)d.Amount, ct) ?? 0,
            MonthlyRefunds = await _context.Refunds
                .Where(r => r.ProcessedAt >= thisMonth).SumAsync(r => (decimal?)r.Amount, ct) ?? 0,
            WeeklyData = weeklyData,
            TopOrgs    = topOrgs,
        };

        return Ok(new { success = true, data = platformStats });
    }

    /// <summary>Update organization details (SuperAdmin only)</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOrganizationDto dto, CancellationToken ct)
    {
        var org = await _context.Organizations.FindAsync(new object[] { id }, ct);
        if (org == null) return NotFound(new { success = false, message = "Organization not found." });

        if (!string.IsNullOrWhiteSpace(dto.OrganizationName)) org.OrganizationName = dto.OrganizationName;
        if (!string.IsNullOrWhiteSpace(dto.Email))            org.Email            = dto.Email;
        if (!string.IsNullOrWhiteSpace(dto.Phone))            org.Phone            = dto.Phone;
        if (!string.IsNullOrWhiteSpace(dto.Address))          org.Address          = dto.Address;
        if (!string.IsNullOrWhiteSpace(dto.City))             org.City             = dto.City;
        if (!string.IsNullOrWhiteSpace(dto.State))            org.State            = dto.State;
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return Ok(new { success = true, message = "Organization updated successfully." });
    }

    /// <summary>Soft-delete an organization (SuperAdmin only)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var org = await _context.Organizations.FindAsync(new object[] { id }, ct);
        if (org == null) return NotFound(new { success = false, message = "Organization not found." });

        org.IsDeleted   = true;
        org.DeletedAt   = DateTime.UtcNow;
        org.IsActive    = false;
        org.IsLoginEnabled = false;
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, message = "Organization deleted successfully." });
    }
}

public class ToggleLoginDto { public bool IsLoginEnabled { get; set; } }
public class ToggleActiveDto { public bool IsActive { get; set; } }
public class UpdateOrganizationDto
{
    public string? OrganizationName { get; set; }
    public string? Email            { get; set; }
    public string? Phone            { get; set; }
    public string? Address          { get; set; }
    public string? City             { get; set; }
    public string? State            { get; set; }
}
