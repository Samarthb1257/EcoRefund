using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.API.Controllers;

public class ItemTypesController : BaseController
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ItemTypesController(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;

        var itemTypes = await _context.ItemTypes
            .Where(t => (orgId == null || t.OrganizationId == orgId) && t.IsActive)
            .Select(t => new
            {
                t.Id,
                t.TypeName,
                t.Description,
                t.DefaultDepositAmount,
                t.IsActive
            })
            .OrderBy(t => t.TypeName)
            .ToListAsync(ct);

        return Ok(new { success = true, data = itemTypes });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateItemTypeDto dto, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null) return Unauthorized();

        var itemType = new ItemType
        {
            OrganizationId = orgId.Value,
            TypeName = dto.TypeName,
            Description = dto.Description,
            DefaultDepositAmount = dto.DefaultDepositAmount,
            IsActive = true
        };

        _context.ItemTypes.Add(itemType);
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, data = new { itemType.Id, itemType.TypeName }, message = "Item type created." });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateItemTypeDto dto, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        var itemType = await _context.ItemTypes
            .FirstOrDefaultAsync(t => t.Id == id && (orgId == null || t.OrganizationId == orgId), ct);

        if (itemType == null) return NotFound(new { success = false, message = "Item type not found." });

        itemType.TypeName = dto.TypeName;
        itemType.Description = dto.Description;
        itemType.DefaultDepositAmount = dto.DefaultDepositAmount;
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, message = "Item type updated." });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        var itemType = await _context.ItemTypes
            .FirstOrDefaultAsync(t => t.Id == id && (orgId == null || t.OrganizationId == orgId), ct);

        if (itemType == null) return NotFound(new { success = false, message = "Item type not found." });

        itemType.IsActive = false;
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, message = "Item type deactivated." });
    }
}

public class CreateItemTypeDto
{
    public string TypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DefaultDepositAmount { get; set; }
}
