using EcoRefund.Domain.Enums;

namespace EcoRefund.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? OrganizationId { get; }
    UserRole? Role { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    bool IsSuperAdmin { get; }
    bool IsOrgAdmin { get; }
}
