using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace EcoRefund.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var claim = User?.FindFirst("uid")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public Guid? OrganizationId
    {
        get
        {
            var claim = User?.FindFirst("orgId")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public UserRole? Role
    {
        get
        {
            // JWT middleware maps "role" → ClaimTypes.Role; also check raw "role" as fallback
            var claim = User?.FindFirst(ClaimTypes.Role)?.Value
                     ?? User?.FindFirst("role")?.Value;
            return Enum.TryParse<UserRole>(claim, out var role) ? role : null;
        }
    }

    public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value
                          ?? User?.FindFirst("email")?.Value;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public bool IsSuperAdmin => Role == UserRole.SuperAdmin;

    public bool IsOrgAdmin => Role == UserRole.OrgAdmin;
}
