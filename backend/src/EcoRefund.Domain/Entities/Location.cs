using EcoRefund.Domain.Common;
using EcoRefund.Domain.Enums;

namespace EcoRefund.Domain.Entities;

public class Location : TenantEntity
{
    public string LocationName { get; set; } = string.Empty;
    public LocationType LocationType { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;

    public Organization? Organization { get; set; }
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public ICollection<User> AssignedUsers { get; set; } = new List<User>();
}
