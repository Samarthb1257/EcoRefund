using EcoRefund.Domain.Common;
using EcoRefund.Domain.Enums;

namespace EcoRefund.Domain.Entities;

public class Item : TenantEntity
{
    public Guid ItemTypeId { get; set; }
    public Guid LocationId { get; set; }
    public Guid QrCodeId { get; set; }
    public Guid RegisteredByUserId { get; set; }
    public string ItemNumber { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DepositAmount { get; set; }
    public ItemStatus Status { get; set; } = ItemStatus.Active;
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReturnedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Notes { get; set; }

    public Organization? Organization { get; set; }
    public ItemType? ItemType { get; set; }
    public Location? Location { get; set; }
    public QrCode? QrCode { get; set; }
    public User? RegisteredBy { get; set; }
    public Deposit? Deposit { get; set; }
    public Refund? Refund { get; set; }
}
