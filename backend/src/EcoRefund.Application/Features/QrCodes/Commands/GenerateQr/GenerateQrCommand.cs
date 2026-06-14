using EcoRefund.Application.Common.Models;
using MediatR;

namespace EcoRefund.Application.Features.QrCodes.Commands.GenerateQr;

public record GenerateQrCommand(
    Guid ItemTypeId,
    Guid LocationId,
    decimal DepositAmount,
    string? Description,
    int ValidityDays = 30
) : IRequest<Result<GenerateQrResponse>>;

public class GenerateQrResponse
{
    public Guid QrCodeId { get; set; }
    public string QrCodeNumber { get; set; } = string.Empty;
    public string QrImageBase64 { get; set; } = string.Empty;
    public Guid ItemId { get; set; }
    public string ItemNumber { get; set; } = string.Empty;
    public string ItemTypeName { get; set; } = string.Empty;
    public decimal DepositAmount { get; set; }
    public DateTime ExpiresAt { get; set; }
    public byte[]? PrintLabelBytes { get; set; }
}
