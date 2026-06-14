using EcoRefund.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EcoRefund.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Phone).HasMaxLength(20);
        builder.Property(u => u.RefreshToken).HasMaxLength(512);
        builder.Property(u => u.Role).IsRequired();

        builder.Ignore(u => u.FullName);
        builder.Ignore(u => u.IsLockedOut);
        builder.Ignore(u => u.IsSuperAdmin);
        builder.Ignore(u => u.IsOrgAdmin);
        builder.Ignore(u => u.IsStaff);

        builder.HasOne(u => u.Organization)
            .WithMany(o => o.Users)
            .HasForeignKey(u => u.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.AssignedLocation)
            .WithMany(l => l.AssignedUsers)
            .HasForeignKey(u => u.AssignedLocationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasQueryFilter(u => !u.IsDeleted);
    }
}
