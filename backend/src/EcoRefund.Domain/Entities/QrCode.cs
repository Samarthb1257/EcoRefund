using EcoRefund.Domain.Common;
using EcoRefund.Domain.Enums;

namespace EcoRefund.Domain.Entities;

public class QrCode : TenantEntity
{
    public string QrCodeNumber { get; set; } = string.Empty;
    public string QrCodeData { get; set; } = string.Empty;
    public string? QrImageBase64 { get; set; }
    public QrStatus Status { get; set; } = QrStatus.Generated;
    public Guid GeneratedByUserId { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ActivatedAt { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? RedemptionNotes { get; set; }
    public Guid? RedeemedByUserId { get; set; }
    public int ScanAttemptCount { get; set; } = 0;

    public Organization? Organization { get; set; }
    public User? GeneratedBy { get; set; }
    public User? RedeemedBy { get; set; }
    public Item? Item { get; set; }
    public ICollection<ScanAttempt> ScanAttempts { get; set; } = new List<ScanAttempt>();
}
