using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Enums;
using MediatR;

namespace EcoRefund.Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? Phone,
    UserRole Role,
    Guid? OrganizationId,
    Guid? AssignedLocationId
) : IRequest<Result<CreateUserResponse>>;

public class CreateUserResponse
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsLoginEnabled { get; set; }
}
