using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Entities;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Result<CreateUserResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly ICurrentUserService _currentUser;

    public CreateUserCommandHandler(
        IApplicationDbContext context,
        IPasswordService passwordService,
        ICurrentUserService currentUser)
    {
        _context = context;
        _passwordService = passwordService;
        _currentUser = currentUser;
    }

    public async Task<Result<CreateUserResponse>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // Only OrgAdmin/SuperAdmin can create users
        if (!_currentUser.IsOrgAdmin && !_currentUser.IsSuperAdmin)
            return Result<CreateUserResponse>.Fail("Only Organization Admin can create users.");

        // OrgAdmin cannot create SuperAdmin or another OrgAdmin
        if (_currentUser.IsOrgAdmin && request.Role is UserRole.SuperAdmin or UserRole.OrgAdmin)
            return Result<CreateUserResponse>.Fail("You don't have permission to create this role.");

        // SuperAdmin can specify a target org; otherwise use caller's org
        var orgId = _currentUser.IsSuperAdmin
            ? request.OrganizationId ?? _currentUser.OrganizationId
            : _currentUser.OrganizationId;

        if (orgId == null && !_currentUser.IsSuperAdmin)
            return Result<CreateUserResponse>.Fail("Organization not found.");

        // Check email uniqueness
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted, cancellationToken);

        if (emailExists)
            return Result<CreateUserResponse>.Fail("A user with this email already exists.");

        // Check user limit for organization
        if (orgId.HasValue)
        {
            var org = await _context.Organizations.FindAsync(new object[] { orgId.Value }, cancellationToken);
            if (org == null) return Result<CreateUserResponse>.Fail("Organization not found.");

            var userCount = await _context.Users
                .CountAsync(u => u.OrganizationId == orgId && !u.IsDeleted, cancellationToken);

            if (userCount >= org.MaxUsers)
                return Result<CreateUserResponse>.Fail($"User limit reached ({org.MaxUsers}). Upgrade your subscription.");
        }

        var user = new User
        {
            OrganizationId = orgId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = _passwordService.HashPassword(request.Password),
            Phone = request.Phone,
            Role = request.Role,
            IsActive = true,
            IsLoginEnabled = true,
            AssignedLocationId = request.AssignedLocationId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<CreateUserResponse>.Ok(new CreateUserResponse
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsLoginEnabled = user.IsLoginEnabled
        }, "User created successfully.");
    }
}
