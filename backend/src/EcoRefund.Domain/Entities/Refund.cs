using EcoRefund.Domain.Common;
using EcoRefund.Domain.Enums;

namespace EcoRefund.Domain.Entities;

public class Refund : TenantEntity
{
    public Guid ItemId { get; set; }
    public Guid QrCodeId { get; set; }
    public Guid DepositId { get; set; }
    public Guid ProcessedByUserId { get; set; }
    public decimal Amount { get; set; }
    public RefundMethod RefundMethod { get; set; }
    public string? TransactionReference { get; set; }
    public string? UpiId { get; set; }
    public string? CouponCode { get; set; }
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public bool IsApproved { get; set; } = true;
    public Guid? ApprovedByUserId { get; set; }

    public Organization? Organization { get; set; }
    public Item? Item { get; set; }
    public QrCode? QrCode { get; set; }
    public Deposit? Deposit { get; set; }
    public User? ProcessedBy { get; set; }
}
