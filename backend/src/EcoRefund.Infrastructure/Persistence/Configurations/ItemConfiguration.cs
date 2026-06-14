using EcoRefund.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EcoRefund.Infrastructure.Persistence.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.ItemNumber).HasMaxLength(50).IsRequired();
        builder.Property(i => i.DepositAmount).HasPrecision(18, 2).IsRequired();
        builder.Property(i => i.Status).IsRequired();

        builder.HasOne(i => i.Organization)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.ItemType)
            .WithMany(it => it.Items)
            .HasForeignKey(i => i.ItemTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Location)
            .WithMany(l => l.Items)
            .HasForeignKey(i => i.LocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.RegisteredBy)
            .WithMany()
            .HasForeignKey(i => i.RegisteredByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Deposit)
            .WithOne(d => d.Item)
            .HasForeignKey<Deposit>(d => d.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Refund)
            .WithOne(r => r.Item)
            .HasForeignKey<Refund>(r => r.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}
