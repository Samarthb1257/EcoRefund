namespace EcoRefund.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        string action,
        string entityType,
        string? entityId = null,
        string? oldValues = null,
        string? newValues = null,
        string? description = null,
        bool isSuccess = true,
        string? errorMessage = null,
        CancellationToken cancellationToken = default);
}
