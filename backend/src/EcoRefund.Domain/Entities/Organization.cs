using EcoRefund.Domain.Common;
using EcoRefund.Domain.Enums;

namespace EcoRefund.Domain.Entities;

public class Organization : BaseEntity
{
    public string OrganizationCode { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public OrganizationType OrganizationType { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? GstNumber { get; set; }
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsLoginEnabled { get; set; } = true;
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Free;
    public DateTime? SubscriptionExpiresAt { get; set; }
    public int MaxLocations { get; set; } = 3;
    public int MaxUsers { get; set; } = 10;
    public int MaxQrPerDay { get; set; } = 100;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Location> Locations { get; set; } = new List<Location>();
    public ICollection<ItemType> ItemTypes { get; set; } = new List<ItemType>();
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public ICollection<QrCode> QrCodes { get; set; } = new List<QrCode>();
}
