using EcoRefund.Domain.Common;
using EcoRefund.Domain.Enums;

namespace EcoRefund.Domain.Entities;

public class ScanAttempt : TenantEntity
{
    public Guid QrCodeId { get; set; }
    public Guid? ScannedByUserId { get; set; }
    public ScanResult Result { get; set; }
    public string? IpAddress { get; set; }
    public string? DeviceInfo { get; set; }
    public string? Notes { get; set; }
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
    public QrCode? QrCode { get; set; }
    public User? ScannedBy { get; set; }
}
