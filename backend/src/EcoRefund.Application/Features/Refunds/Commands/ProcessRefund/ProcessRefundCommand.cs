using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Enums;
using MediatR;

namespace EcoRefund.Application.Features.Refunds.Commands.ProcessRefund;

public record ProcessRefundCommand(
    Guid QrCodeId,
    RefundMethod RefundMethod,
    string? UpiId,
    string? CouponCode,
    string? Notes
) : IRequest<Result<ProcessRefundResponse>>;

public class ProcessRefundResponse
{
    public Guid RefundId { get; set; }
    public string QrCodeNumber { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public RefundMethod RefundMethod { get; set; }
    public string RefundMethodName { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? TransactionReference { get; set; }
}
