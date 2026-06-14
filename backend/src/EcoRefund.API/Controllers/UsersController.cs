using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Features.Users.Commands.CreateUser;
using EcoRefund.Application.Features.Users.Commands.ToggleUserAccess;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.API.Controllers;

public class UsersController : BaseController
{
    private readonly ISender _mediator;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UsersController(ISender mediator, IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
    }

    /// <summary>Create a new user (OrgAdmin creates staff, SuperAdmin creates anyone)</summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateUserCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Get all users in the organization</summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] UserRole? role = null,
        CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin
            ? (Guid?)null
            : _currentUser.OrganizationId;

        var query = _context.Users
            .Include(u => u.AssignedLocation)
            .Where(u => orgId == null || u.OrganizationId == orgId)
            .OrderBy(u => u.FirstName)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.FirstName.Contains(search) ||
                                     u.LastName.Contains(search) ||
                                     u.Email.Contains(search));

        if (role.HasValue)
            query = query.Where(u => u.Role == role.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Phone,
                u.Role,
                RoleName = u.Role.ToString(),
                u.IsActive,
                u.IsLoginEnabled,
                u.LastLoginAt,
                u.AssignedLocationId,
                AssignedLocationName = u.AssignedLocation != null ? u.AssignedLocation.LocationName : null,
                u.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { success = true, data = items, total, page, pageSize });
    }

    /// <summary>Get single user details</summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;

        var user = await _context.Users
            .Where(u => u.Id == id && (orgId == null || u.OrganizationId == orgId))
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Phone,
                u.Role,
                RoleName = u.Role.ToString(),
                u.IsActive,
                u.IsLoginEnabled,
                u.LastLoginAt,
                u.AssignedLocationId,
                u.CreatedAt
            })
            .FirstOrDefaultAsync(ct);

        if (user == null) return NotFound(new { success = false, message = "User not found." });
        return Ok(new { success = true, data = user });
    }

    /// <summary>
    /// CORE FEATURE: Toggle staff login access.
    /// OrgAdmin can enable/disable ANY staff in their org.
    /// SuperAdmin can enable/disable ANY user.
    /// </summary>
    [HttpPatch("{id}/toggle-login")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> ToggleLogin(Guid id, [FromBody] ToggleLoginAccessDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new ToggleUserAccessCommand(id, dto.IsLoginEnabled, dto.Reason), ct);
        return HandleResult(result);
    }

    /// <summary>Toggle user active status</summary>
    [HttpPatch("{id}/toggle-active")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> ToggleActive(Guid id, [FromBody] ToggleActiveUserDto dto, CancellationToken ct)
    {
        var orgId = _currentUser.IsOrgAdmin ? _currentUser.OrganizationId : null;

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id &&
                                      (orgId == null || u.OrganizationId == orgId), ct);

        if (user == null) return NotFound(new { success = false, message = "User not found." });

        if (_currentUser.IsOrgAdmin && user.Role is UserRole.SuperAdmin or UserRole.OrgAdmin)
            return BadRequest(new { success = false, message = "Cannot change active status for Admin accounts." });

        user.IsActive = dto.IsActive;
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, message = $"User {(dto.IsActive ? "activated" : "deactivated")} successfully." });
    }

    /// <summary>Reset user password (OrgAdmin/SuperAdmin)</summary>
    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordDto dto, CancellationToken ct)
    {
        var orgId = _currentUser.IsOrgAdmin ? _currentUser.OrganizationId : null;
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && (orgId == null || u.OrganizationId == orgId), ct);

        if (user == null) return NotFound(new { success = false, message = "User not found." });

        var passwordService = HttpContext.RequestServices
            .GetRequiredService<EcoRefund.Application.Common.Interfaces.IPasswordService>();

        user.PasswordHash = passwordService.HashPassword(dto.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, message = "Password reset successfully. User must login again." });
    }

    /// <summary>Get staff login status overview (OrgAdmin dashboard feature)</summary>
    [HttpGet("login-status")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> GetLoginStatus(CancellationToken ct)
    {
        var orgId = _currentUser.IsOrgAdmin ? _currentUser.OrganizationId : null;

        var users = await _context.Users
            .Where(u => (orgId == null || u.OrganizationId == orgId) &&
                        u.Role != UserRole.SuperAdmin)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                RoleName = u.Role.ToString(),
                u.IsActive,
                u.IsLoginEnabled,
                u.LastLoginAt
            })
            .OrderBy(u => u.Role)
            .ToListAsync(ct);

        return Ok(new { success = true, data = users });
    }
}

public class ToggleLoginAccessDto
{
    public bool IsLoginEnabled { get; set; }
    public string? Reason { get; set; }
}

public class ToggleActiveUserDto { public bool IsActive { get; set; } }
public class ResetPasswordDto { public string NewPassword { get; set; } = string.Empty; }
