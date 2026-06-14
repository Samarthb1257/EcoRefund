using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Domain.Common;
using EcoRefund.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<ItemType> ItemTypes => Set<ItemType>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<QrCode> QrCodes => Set<QrCode>();
    public DbSet<Deposit> Deposits => Set<Deposit>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ScanAttempt> ScanAttempts => Set<ScanAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
        return await base.SaveChangesAsync(cancellationToken);
    }
}
