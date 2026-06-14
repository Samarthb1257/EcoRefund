using EcoRefund.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using EcoRefund.Domain.Enums;

namespace EcoRefund.API.Controllers;

public class ReportsController : BaseController
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ReportsController(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    /// <summary>Get audit logs as JSON (paginated)</summary>
    [HttpGet("audit")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Auditor")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var orgId    = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;
        var fromDate = from ?? DateTime.UtcNow.AddDays(-7);
        var toDate   = to   ?? DateTime.UtcNow;

        var query = _context.AuditLogs
            .Include(a => a.User)
            .Where(a => (orgId == null || a.OrganizationId == orgId) &&
                        a.CreatedAt >= fromDate && a.CreatedAt <= toDate)
            .OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.Action,
                a.EntityType,
                a.EntityId,
                UserEmail = a.User != null ? a.User.Email : "System",
                a.IsSuccess,
                a.Description,
                a.IpAddress,
                a.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { success = true, data = items, total, page, pageSize });
    }

    /// <summary>Export Refund Report as Excel</summary>
    [HttpGet("refunds/excel")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,Auditor")]
    public async Task<IActionResult> ExportRefundsExcel(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var data = await _context.Refunds
            .Include(r => r.Item).ThenInclude(i => i!.ItemType)
            .Include(r => r.QrCode)
            .Include(r => r.ProcessedBy)
            .Where(r => (orgId == null || r.OrganizationId == orgId) &&
                        r.ProcessedAt >= fromDate && r.ProcessedAt <= toDate)
            .OrderByDescending(r => r.ProcessedAt)
            .ToListAsync(ct);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Refund Report");

        // Header styling
        var headers = new[] { "Sl No", "QR Code", "Item Type", "Deposit (₹)", "Refund Amount (₹)",
                               "Refund Method", "Transaction Ref", "Processed By", "Processed At", "Notes" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#2E7D32");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        for (int i = 0; i < data.Count; i++)
        {
            var r = data[i];
            var row = i + 2;
            ws.Cell(row, 1).Value = i + 1;
            ws.Cell(row, 2).Value = r.QrCode?.QrCodeNumber ?? "";
            ws.Cell(row, 3).Value = r.Item?.ItemType?.TypeName ?? "";
            ws.Cell(row, 4).Value = r.Item?.DepositAmount ?? 0;
            ws.Cell(row, 5).Value = r.Amount;
            ws.Cell(row, 6).Value = r.RefundMethod.ToString();
            ws.Cell(row, 7).Value = r.TransactionReference ?? "";
            ws.Cell(row, 8).Value = r.ProcessedBy?.Email ?? "";
            ws.Cell(row, 9).Value = r.ProcessedAt.ToString("dd/MM/yyyy HH:mm");
            ws.Cell(row, 10).Value = r.Notes ?? "";

            if (i % 2 == 1)
                ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#F5F5F5");
        }

        // Summary row
        var sumRow = data.Count + 3;
        ws.Cell(sumRow, 1).Value = "TOTAL";
        ws.Cell(sumRow, 1).Style.Font.Bold = true;
        ws.Cell(sumRow, 5).Value = data.Sum(r => r.Amount);
        ws.Cell(sumRow, 5).Style.Font.Bold = true;

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var fileName = $"EcoRefund-Report-{fromDate:yyyyMMdd}-to-{toDate:yyyyMMdd}.xlsx";

        return File(stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    /// <summary>Export Deposits Report as Excel</summary>
    [HttpGet("deposits/excel")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Manager,Auditor")]
    public async Task<IActionResult> ExportDepositsExcel(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var data = await _context.Deposits
            .Include(d => d.Item).ThenInclude(i => i!.ItemType)
            .Include(d => d.Item).ThenInclude(i => i!.Location)
            .Include(d => d.QrCode)
            .Include(d => d.CollectedBy)
            .Where(d => (orgId == null || d.OrganizationId == orgId) &&
                        d.CollectedAt >= fromDate && d.CollectedAt <= toDate)
            .OrderByDescending(d => d.CollectedAt)
            .ToListAsync(ct);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Deposit Report");

        var headers = new[] { "Sl No", "QR Code", "Item Type", "Location",
                               "Deposit Amount (₹)", "Payment Method", "Collected By", "Collected At" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1565C0");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        for (int i = 0; i < data.Count; i++)
        {
            var d = data[i];
            var row = i + 2;
            ws.Cell(row, 1).Value = i + 1;
            ws.Cell(row, 2).Value = d.QrCode?.QrCodeNumber ?? "";
            ws.Cell(row, 3).Value = d.Item?.ItemType?.TypeName ?? "";
            ws.Cell(row, 4).Value = d.Item?.Location?.LocationName ?? "";
            ws.Cell(row, 5).Value = d.Amount;
            ws.Cell(row, 6).Value = d.PaymentMethod;
            ws.Cell(row, 7).Value = d.CollectedBy?.Email ?? "";
            ws.Cell(row, 8).Value = d.CollectedAt.ToString("dd/MM/yyyy HH:mm");

            if (i % 2 == 1)
                ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#F5F5F5");
        }

        var sumRow = data.Count + 3;
        ws.Cell(sumRow, 1).Value = "TOTAL";
        ws.Cell(sumRow, 1).Style.Font.Bold = true;
        ws.Cell(sumRow, 5).Value = data.Sum(d => d.Amount);
        ws.Cell(sumRow, 5).Style.Font.Bold = true;

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return File(stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"EcoRefund-Deposits-{fromDate:yyyyMMdd}.xlsx");
    }

    /// <summary>Audit log report</summary>
    [HttpGet("audit/excel")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin,Auditor")]
    public async Task<IActionResult> ExportAuditExcel(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var orgId = _currentUser.IsSuperAdmin ? (Guid?)null : _currentUser.OrganizationId;
        var fromDate = from ?? DateTime.UtcNow.AddDays(-7);
        var toDate = to ?? DateTime.UtcNow;

        var data = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => (orgId == null || a.OrganizationId == orgId) &&
                        a.CreatedAt >= fromDate && a.CreatedAt <= toDate)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5000)
            .ToListAsync(ct);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Audit Log");

        var headers = new[] { "Sl No", "Action", "Entity", "Entity ID",
                               "User", "Success", "Description", "IP Address", "Timestamp" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#4A148C");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        for (int i = 0; i < data.Count; i++)
        {
            var a = data[i];
            var row = i + 2;
            ws.Cell(row, 1).Value = i + 1;
            ws.Cell(row, 2).Value = a.Action;
            ws.Cell(row, 3).Value = a.EntityType;
            ws.Cell(row, 4).Value = a.EntityId ?? "";
            ws.Cell(row, 5).Value = a.User?.Email ?? "System";
            ws.Cell(row, 6).Value = a.IsSuccess ? "Yes" : "No";
            ws.Cell(row, 7).Value = a.Description ?? "";
            ws.Cell(row, 8).Value = a.IpAddress ?? "";
            ws.Cell(row, 9).Value = a.CreatedAt.ToString("dd/MM/yyyy HH:mm:ss");

            if (!a.IsSuccess)
                ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#FFEBEE");
        }

        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return File(stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"EcoRefund-AuditLog-{fromDate:yyyyMMdd}.xlsx");
    }
}
