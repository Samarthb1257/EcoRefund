using EcoRefund.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EcoRefund.Infrastructure.Persistence.Configurations;

public class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(r => r.RefundMethod).IsRequired();
        builder.Property(r => r.TransactionReference).HasMaxLength(100);
        builder.Property(r => r.UpiId).HasMaxLength(100);
        builder.Property(r => r.CouponCode).HasMaxLength(50);

        builder.HasOne(r => r.Organization)
            .WithMany()
            .HasForeignKey(r => r.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ProcessedBy)
            .WithMany()
            .HasForeignKey(r => r.ProcessedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // NoAction prevents cascade cycles: QrCodes→Deposits→Refunds and QrCodes→Refunds
        builder.HasOne(r => r.QrCode)
            .WithMany()
            .HasForeignKey(r => r.QrCodeId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(r => r.Deposit)
            .WithMany()
            .HasForeignKey(r => r.DepositId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
