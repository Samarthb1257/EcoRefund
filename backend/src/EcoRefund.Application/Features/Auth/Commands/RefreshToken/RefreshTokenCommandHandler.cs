using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;

    public RefreshTokenCommandHandler(IApplicationDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var principal = _jwtService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
            return Result<AuthResponse>.Fail("Invalid access token.");

        var userId = principal.Claims.FirstOrDefault(c => c.Type == "uid")?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Result<AuthResponse>.Fail("Invalid token claims.");

        var user = await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userGuid && !u.IsDeleted, cancellationToken);

        if (user == null || user.RefreshToken != request.RefreshToken)
            return Result<AuthResponse>.Fail("Invalid refresh token.");

        if (user.RefreshTokenExpiryTime < DateTime.UtcNow)
            return Result<AuthResponse>.Fail("Refresh token has expired. Please login again.");

        if (!user.IsActive || !user.IsLoginEnabled)
            return Result<AuthResponse>.Fail("Account access revoked. Please login again.");

        var newAccessToken = _jwtService.GenerateAccessToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
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
            }
        });
    }
}
