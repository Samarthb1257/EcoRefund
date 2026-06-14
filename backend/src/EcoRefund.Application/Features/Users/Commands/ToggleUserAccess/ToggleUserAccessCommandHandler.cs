using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Features.Users.Commands.ToggleUserAccess;

public class ToggleUserAccessCommandHandler
    : IRequestHandler<ToggleUserAccessCommand, Result<ToggleAccessResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _auditService;

    public ToggleUserAccessCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditService auditService)
    {
        _context = context;
        _currentUser = currentUser;
        _auditService = auditService;
    }

    public async Task<Result<ToggleAccessResponse>> Handle(
        ToggleUserAccessCommand request,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, cancellationToken);

        if (user == null)
            return Result<ToggleAccessResponse>.Fail("User not found.");

        // SuperAdmin can toggle anyone
        // OrgAdmin can only toggle staff within their organization
        if (_currentUser.IsSuperAdmin)
        {
            // SuperAdmin can toggle any user except another SuperAdmin
            if (user.Role == UserRole.SuperAdmin && user.Id == _currentUser.UserId)
                return Result<ToggleAccessResponse>.Fail("Cannot disable your own super admin access.");
        }
        else if (_currentUser.IsOrgAdmin)
        {
            // OrgAdmin can only toggle users in their org
            if (user.OrganizationId != _currentUser.OrganizationId)
                return Result<ToggleAccessResponse>.Fail("You can only manage users within your organization.");

            // OrgAdmin cannot disable another OrgAdmin or SuperAdmin
            if (user.Role is UserRole.SuperAdmin or UserRole.OrgAdmin)
                return Result<ToggleAccessResponse>.Fail("You cannot change access for Admin accounts.");
        }
        else
        {
            return Result<ToggleAccessResponse>.Fail("Insufficient permissions.");
        }

        var oldValue = user.IsLoginEnabled;
        user.IsLoginEnabled = request.IsLoginEnabled;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            request.IsLoginEnabled ? "USER_ACCESS_ENABLED" : "USER_ACCESS_DISABLED",
            "User",
            user.Id.ToString(),
            oldValues: $"IsLoginEnabled: {oldValue}",
            newValues: $"IsLoginEnabled: {request.IsLoginEnabled}",
            description: request.Reason ?? (request.IsLoginEnabled ? "Access enabled by admin" : "Access disabled by admin"));

        var action = request.IsLoginEnabled ? "enabled" : "disabled";
        return Result<ToggleAccessResponse>.Ok(new ToggleAccessResponse
        {
            UserId = user.Id,
            FullName = user.FullName,
            IsLoginEnabled = user.IsLoginEnabled,
            Message = $"Login access has been {action} for {user.FullName}."
        });
    }
}
