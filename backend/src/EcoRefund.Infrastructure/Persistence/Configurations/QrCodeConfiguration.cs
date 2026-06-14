using EcoRefund.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EcoRefund.Infrastructure.Persistence.Configurations;

public class QrCodeConfiguration : IEntityTypeConfiguration<QrCode>
{
    public void Configure(EntityTypeBuilder<QrCode> builder)
    {
        builder.HasKey(q => q.Id);
        builder.HasIndex(q => new { q.OrganizationId, q.QrCodeNumber }).IsUnique();

        builder.Property(q => q.QrCodeNumber).HasMaxLength(50).IsRequired();
        builder.Property(q => q.QrCodeData).IsRequired();
        builder.Property(q => q.QrImageBase64).HasColumnType("nvarchar(max)");
        builder.Property(q => q.Status).IsRequired();

        builder.HasOne(q => q.Organization)
            .WithMany(o => o.QrCodes)
            .HasForeignKey(q => q.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.GeneratedBy)
            .WithMany()
            .HasForeignKey(q => q.GeneratedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.Item)
            .WithOne(i => i.QrCode)
            .HasForeignKey<Item>(i => i.QrCodeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(q => !q.IsDeleted);
    }
}
