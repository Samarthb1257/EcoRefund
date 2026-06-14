using EcoRefund.Application.Common.Models;
using MediatR;

namespace EcoRefund.Application.Features.Users.Commands.ToggleUserAccess;

public record ToggleUserAccessCommand(
    Guid UserId,
    bool IsLoginEnabled,
    string? Reason = null
) : IRequest<Result<ToggleAccessResponse>>;

public class ToggleAccessResponse
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public bool IsLoginEnabled { get; set; }
    public string Message { get; set; } = string.Empty;
}
