using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Entities;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Features.Refunds.Commands.ProcessRefund;

public class ProcessRefundCommandHandler
    : IRequestHandler<ProcessRefundCommand, Result<ProcessRefundResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _auditService;

    public ProcessRefundCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAuditService auditService)
    {
        _context = context;
        _currentUser = currentUser;
        _auditService = auditService;
    }

    public async Task<Result<ProcessRefundResponse>> Handle(
        ProcessRefundCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.OrganizationId == null)
            return Result<ProcessRefundResponse>.Fail("Authentication required.");

        // Only Exit Staff, Manager, OrgAdmin can process refunds
        if (_currentUser.Role is not (UserRole.ExitStaff or UserRole.Manager or UserRole.OrgAdmin or UserRole.SuperAdmin))
            return Result<ProcessRefundResponse>.Fail("Only Exit Staff or Admin can process refunds.");

        var orgId = _currentUser.OrganizationId.Value;

        // Get QR code with all related data
        var qrCode = await _context.QrCodes
            .Include(q => q.Item)
            .FirstOrDefaultAsync(q => q.Id == request.QrCodeId &&
                                      q.OrganizationId == orgId, cancellationToken);

        if (qrCode == null)
            return Result<ProcessRefundResponse>.Fail("QR code not found.");

        // Final fraud check: is it already refunded?
        if (qrCode.Status is QrStatus.Refunded or QrStatus.Invalid)
            return Result<ProcessRefundResponse>.Fail(
                "QR ALREADY REDEEMED. This deposit has already been refunded. Cannot process again.");

        if (qrCode.Status == QrStatus.Expired)
            return Result<ProcessRefundResponse>.Fail("This QR code has expired.");

        if (qrCode.Item == null)
            return Result<ProcessRefundResponse>.Fail("Item data not found for this QR code.");

        // Get deposit
        var deposit = await _context.Deposits
            .FirstOrDefaultAsync(d => d.QrCodeId == request.QrCodeId &&
                                      d.OrganizationId == orgId, cancellationToken);

        if (deposit == null)
            return Result<ProcessRefundResponse>.Fail("Deposit record not found.");

        // Generate transaction reference
        var txRef = $"REF-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        // Create Refund record
        var refund = new Refund
        {
            OrganizationId = orgId,
            ItemId = qrCode.Item.Id,
            QrCodeId = request.QrCodeId,
            DepositId = deposit.Id,
            ProcessedByUserId = _currentUser.UserId!.Value,
            Amount = qrCode.Item.DepositAmount,
            RefundMethod = request.RefundMethod,
            TransactionReference = txRef,
            UpiId = request.UpiId,
            CouponCode = request.CouponCode,
            ProcessedAt = DateTime.UtcNow,
            Notes = request.Notes,
            IsApproved = true
        };

        _context.Refunds.Add(refund);

        // CRITICAL: Immediately mark QR as INVALID after refund
        qrCode.Status = QrStatus.Refunded;
        qrCode.RedeemedAt = DateTime.UtcNow;
        qrCode.RedeemedByUserId = _currentUser.UserId;
        qrCode.RedemptionNotes = $"Refunded via {request.RefundMethod}. Ref: {txRef}";

        // Update item status
        qrCode.Item.Status = ItemStatus.Refunded;
        qrCode.Item.ReturnedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync("REFUND_PROCESSED", "Refund", refund.Id.ToString(),
            description: $"Refund ₹{refund.Amount} processed for QR {qrCode.QrCodeNumber} via {request.RefundMethod}. Ref: {txRef}");

        return Result<ProcessRefundResponse>.Ok(new ProcessRefundResponse
        {
            RefundId = refund.Id,
            QrCodeNumber = qrCode.QrCodeNumber,
            RefundAmount = refund.Amount,
            RefundMethod = refund.RefundMethod,
            RefundMethodName = refund.RefundMethod.ToString(),
            ProcessedAt = refund.ProcessedAt,
            TransactionReference = txRef,
            Message = $"Refund of ₹{refund.Amount} processed successfully. QR code is now INVALID."
        });
    }
}
