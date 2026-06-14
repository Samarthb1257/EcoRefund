using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace EcoRefund.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _currentUser = currentUser;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        string action,
        string entityType,
        string? entityId = null,
        string? oldValues = null,
        string? newValues = null,
        string? description = null,
        bool isSuccess = true,
        string? errorMessage = null,
        CancellationToken cancellationToken = default)
    {
        var ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
        var userAgent = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString();

        var log = new AuditLog
        {
            OrganizationId = _currentUser.OrganizationId,
            UserId = _currentUser.UserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues,
            NewValues = newValues,
            Description = description,
            IsSuccess = isSuccess,
            ErrorMessage = errorMessage,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
