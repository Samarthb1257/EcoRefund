using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Application.Features.Auth.DTOs;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IPasswordService _passwordService;
    private readonly IAuditService _auditService;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        IPasswordService passwordService,
        IAuditService auditService)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordService = passwordService;
        _auditService = auditService;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == request.Email.ToLower() &&
                u.Role == request.Role &&
                !u.IsDeleted,
                cancellationToken);

        if (user == null)
        {
            await _auditService.LogAsync("LOGIN_FAILED", "User", null,
                description: $"Login failed for {request.Email} with role {request.Role}",
                isSuccess: false, errorMessage: "User not found");
            return Result<AuthResponse>.Fail("Invalid email, password, or role.");
        }

        // Check if user is locked out
        if (user.IsLockedOut)
        {
            return Result<AuthResponse>.Fail($"Account is locked until {user.LockoutUntil:HH:mm}. Please try again later.");
        }

        // Verify password
        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockoutUntil = DateTime.UtcNow.AddMinutes(15);
                user.FailedLoginAttempts = 0;
            }
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("LOGIN_FAILED", "User", user.Id.ToString(),
                description: "Wrong password", isSuccess: false);
            return Result<AuthResponse>.Fail("Invalid email, password, or role.");
        }

        // Check if account is active
        if (!user.IsActive)
        {
            return Result<AuthResponse>.Fail("Your account has been deactivated. Contact your administrator.");
        }

        // KEY FEATURE: Check if login is enabled for this user (admin can disable staff login)
        if (!user.IsLoginEnabled)
        {
            await _auditService.LogAsync("LOGIN_BLOCKED", "User", user.Id.ToString(),
                description: "Login disabled by admin", isSuccess: false);
            return Result<AuthResponse>.Fail("Login access has been disabled for your account. Please contact your Organization Admin.");
        }

        // For non-super-admin, check organization status
        if (user.Role != UserRole.SuperAdmin && user.Organization != null)
        {
            if (!user.Organization.IsActive)
            {
                return Result<AuthResponse>.Fail("Your organization account is suspended. Contact support.");
            }

            if (!user.Organization.IsLoginEnabled)
            {
                return Result<AuthResponse>.Fail("Organization login has been disabled. Contact your Super Admin.");
            }

            // Check subscription validity
            if (user.Organization.SubscriptionExpiresAt.HasValue &&
                user.Organization.SubscriptionExpiresAt.Value < DateTime.UtcNow &&
                user.Role != UserRole.OrgAdmin)
            {
                return Result<AuthResponse>.Fail("Organization subscription has expired. Contact your Organization Admin.");
            }
        }

        // Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        user.FailedLoginAttempts = 0;
        user.LockoutUntil = null;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("LOGIN_SUCCESS", "User", user.Id.ToString(),
            description: $"Successful login for {user.Email}");

        return Result<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = new UserDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                RoleName = user.Role.ToString(),
                OrganizationId = user.OrganizationId,
                OrganizationName = user.Organization?.OrganizationName,
                OrganizationCode = user.Organization?.OrganizationCode,
                ProfileImageUrl = user.ProfileImageUrl,
                AssignedLocationId = user.AssignedLocationId
            }
        });
    }
}
