namespace EcoRefund.Application.Common.Interfaces;

public interface IQrService
{
    string GenerateQrCodeData(Guid organizationId, Guid qrCodeId, string qrNumber);
    byte[] GenerateQrCodeImage(string data);
    string GenerateQrCodeImageBase64(string data);
    string GenerateQrNumber(int sequence);
    byte[] GeneratePrintLabel(string qrNumber, string itemType, decimal depositAmount, string orgName, byte[] qrImage);
}
