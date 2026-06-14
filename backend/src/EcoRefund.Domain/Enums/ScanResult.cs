namespace EcoRefund.Domain.Enums;

public enum ScanResult
{
    Success = 1,
    AlreadyRedeemed = 2,
    InvalidQr = 3,
    WrongOrganization = 4,
    Expired = 5,
    NotFound = 6,
    SystemError = 7
}
