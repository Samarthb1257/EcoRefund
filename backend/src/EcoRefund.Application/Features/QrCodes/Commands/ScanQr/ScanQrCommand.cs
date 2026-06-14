using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Enums;
using MediatR;

namespace EcoRefund.Application.Features.QrCodes.Commands.ScanQr;

public record ScanQrCommand(
    string QrCodeData,
    string? DeviceInfo = null
) : IRequest<Result<ScanQrResponse>>;

public class ScanQrResponse
{
    public ScanResult Result { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool CanRefund { get; set; }

    // Populated only when scan is valid
    public Guid? QrCodeId { get; set; }
    public string? QrCodeNumber { get; set; }
    public Guid? ItemId { get; set; }
    public string? ItemNumber { get; set; }
    public string? ItemTypeName { get; set; }
    public decimal? DepositAmount { get; set; }
    public string? OrganizationName { get; set; }
    public DateTime? RegisteredAt { get; set; }
    public string? LocationName { get; set; }
}
