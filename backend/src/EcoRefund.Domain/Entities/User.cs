using EcoRefund.Domain.Common;
using EcoRefund.Domain.Enums;

namespace EcoRefund.Domain.Entities;

public class User : BaseEntity
{
    public Guid? OrganizationId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;

    // Admin can toggle this to prevent staff from logging in
    public bool IsLoginEnabled { get; set; } = true;
    public string? ProfileImageUrl { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockoutUntil { get; set; }
    public Guid? AssignedLocationId { get; set; }

    public Organization? Organization { get; set; }
    public Location? AssignedLocation { get; set; }
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public string FullName => $"{FirstName} {LastName}";
    public bool IsLockedOut => LockoutUntil.HasValue && LockoutUntil.Value > DateTime.UtcNow;
    public bool IsSuperAdmin => Role == UserRole.SuperAdmin;
    public bool IsOrgAdmin => Role == UserRole.OrgAdmin;
    public bool IsStaff => Role is UserRole.EntryStaff or UserRole.ExitStaff or UserRole.Auditor or UserRole.Manager;
}
