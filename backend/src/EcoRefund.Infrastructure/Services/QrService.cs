using EcoRefund.Application.Common.Interfaces;
using QRCoder;
using QuestPDF.Fluent;
using System.Text.Json;

namespace EcoRefund.Infrastructure.Services;

public class QrService : IQrService
{
    public string GenerateQrCodeData(Guid organizationId, Guid qrCodeId, string qrNumber)
    {
        var payload = new
        {
            QrId = qrCodeId,
            OrgId = organizationId,
            QrNum = qrNumber
        };
        return JsonSerializer.Serialize(payload);
    }

    public byte[] GenerateQrCodeImage(string data)
    {
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(data, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }

    public string GenerateQrCodeImageBase64(string data)
    {
        var imageBytes = GenerateQrCodeImage(data);
        return Convert.ToBase64String(imageBytes);
    }

    public string GenerateQrNumber(int sequence) =>
        $"QR-{sequence:D6}";

    public byte[] GeneratePrintLabel(
        string qrNumber,
        string itemType,
        decimal depositAmount,
        string orgName,
        byte[] qrImage)
    {
        // Simple PDF label using QuestPDF
        // Returns bytes of a small printable QR sticker label
        try
        {
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(80, 100, QuestPDF.Infrastructure.Unit.Millimetre);
                    page.Margin(5, QuestPDF.Infrastructure.Unit.Millimetre);
                    page.Content().Column(col =>
                    {
                        col.Item().AlignCenter().Text(orgName)
                            .Bold().FontSize(10);

                        col.Item().AlignCenter().Image(qrImage);

                        col.Item().AlignCenter().Text(qrNumber)
                            .Bold().FontSize(12);

                        col.Item().AlignCenter().Text(itemType)
                            .FontSize(9);

                        col.Item().AlignCenter().Text($"Deposit: Rs. {depositAmount}")
                            .Bold().FontSize(11);

                        col.Item().AlignCenter().Text("Scan to get REFUND")
                            .FontSize(8).FontColor("#666666");
                    });
                });
            });

            return document.GeneratePdf();
        }
        catch
        {
            return qrImage;
        }
    }
}
