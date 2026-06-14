using EcoRefund.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EcoRefund.Infrastructure.Persistence.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.HasKey(o => o.Id);
        builder.HasIndex(o => o.OrganizationCode).IsUnique();
        builder.HasIndex(o => o.Email).IsUnique();

        builder.Property(o => o.OrganizationCode).HasMaxLength(20).IsRequired();
        builder.Property(o => o.OrganizationName).HasMaxLength(200).IsRequired();
        builder.Property(o => o.Email).HasMaxLength(256).IsRequired();
        builder.Property(o => o.Phone).HasMaxLength(20).IsRequired();
        builder.Property(o => o.Address).HasMaxLength(500).IsRequired();
        builder.Property(o => o.City).HasMaxLength(100).IsRequired();
        builder.Property(o => o.State).HasMaxLength(100).IsRequired();
        builder.Property(o => o.PinCode).HasMaxLength(10).IsRequired();
        builder.Property(o => o.GstNumber).HasMaxLength(20);
        builder.Property(o => o.OrganizationType).IsRequired();
        builder.Property(o => o.SubscriptionPlan).IsRequired();

        builder.HasQueryFilter(o => !o.IsDeleted);
    }
}
