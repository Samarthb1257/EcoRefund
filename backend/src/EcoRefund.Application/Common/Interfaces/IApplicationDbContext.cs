using EcoRefund.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<User> Users { get; }
    DbSet<Location> Locations { get; }
    DbSet<ItemType> ItemTypes { get; }
    DbSet<Item> Items { get; }
    DbSet<QrCode> QrCodes { get; }
    DbSet<Deposit> Deposits { get; }
    DbSet<Refund> Refunds { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<ScanAttempt> ScanAttempts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
