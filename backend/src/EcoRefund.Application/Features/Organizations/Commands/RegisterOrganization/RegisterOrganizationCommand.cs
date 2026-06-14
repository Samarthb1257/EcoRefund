using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Enums;
using MediatR;

namespace EcoRefund.Application.Features.Organizations.Commands.RegisterOrganization;

public record RegisterOrganizationCommand(
    string OrganizationName,
    OrganizationType OrganizationType,
    string Address,
    string City,
    string State,
    string PinCode,
    string Email,
    string Phone,
    string? GstNumber,
    string AdminFirstName,
    string AdminLastName,
    string AdminEmail,
    string AdminPassword,
    SubscriptionPlan SubscriptionPlan = SubscriptionPlan.Free
) : IRequest<Result<RegisterOrganizationResponse>>;

public class RegisterOrganizationResponse
{
    public Guid OrganizationId { get; set; }
    public string OrganizationCode { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public Guid AdminUserId { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
