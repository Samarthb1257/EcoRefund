using EcoRefund.Domain.Enums;

namespace EcoRefund.Application.Features.Auth.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}
