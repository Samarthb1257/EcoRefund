using EcoRefund.Domain.Common;

namespace EcoRefund.Domain.Entities;

public class Deposit : TenantEntity
{
    public Guid ItemId { get; set; }
    public Guid QrCodeId { get; set; }
    public Guid CollectedByUserId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? TransactionReference { get; set; }
    public DateTime CollectedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    public Organization? Organization { get; set; }
    public Item? Item { get; set; }
    public QrCode? QrCode { get; set; }
    public User? CollectedBy { get; set; }
}
