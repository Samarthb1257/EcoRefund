using EcoRefund.Domain.Enums;

namespace EcoRefund.Application.Features.Auth.DTOs;

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public Guid? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public string? OrganizationCode { get; set; }
    public string? ProfileImageUrl { get; set; }
    public Guid? AssignedLocationId { get; set; }
}
