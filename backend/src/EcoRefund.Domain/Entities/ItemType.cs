using EcoRefund.Domain.Common;

namespace EcoRefund.Domain.Entities;

public class ItemType : TenantEntity
{
    public string TypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DefaultDepositAmount { get; set; }
    public bool IsActive { get; set; } = true;
    public string? IconUrl { get; set; }

    public Organization? Organization { get; set; }
    public ICollection<Item> Items { get; set; } = new List<Item>();
}
