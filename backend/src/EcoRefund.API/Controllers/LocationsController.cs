using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Domain.Entities;
using EcoRefund.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.API.Controllers;

public class LocationsController : BaseController
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public LocationsController(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null && !_currentUser.IsSuperAdmin)
            return Unauthorized();

        var locations = await _context.Locations
            .Where(l => orgId == null || l.OrganizationId == orgId)
            .Select(l => new
            {
                l.Id,
                l.LocationName,
                l.LocationType,
                TypeName = l.LocationType.ToString(),
                l.Description,
                l.IsActive,
                ItemCount = l.Items.Count(i => i.Status == ItemStatus.Active)
            })
            .ToListAsync(ct);

        return Ok(new { success = true, data = locations });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateLocationDto dto, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null) return Unauthorized();

        var org = await _context.Organizations.FindAsync(new object[] { orgId.Value }, ct);
        if (org == null) return NotFound();

        var count = await _context.Locations.CountAsync(l => l.OrganizationId == orgId, ct);
        if (count >= org.MaxLocations)
            return BadRequest(new { success = false, message = $"Location limit reached ({org.MaxLocations}). Upgrade plan." });

        var location = new Location
        {
            OrganizationId = orgId.Value,
            LocationName = dto.LocationName,
            LocationType = dto.LocationType,
            Description = dto.Description,
            IsActive = true
        };

        _context.Locations.Add(location);
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, data = new { location.Id, location.LocationName }, message = "Location created." });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,OrgAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateLocationDto dto, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        var location = await _context.Locations
            .FirstOrDefaultAsync(l => l.Id == id && (orgId == null || l.OrganizationId == orgId), ct);

        if (location == null) return NotFound();

        location.LocationName = dto.LocationName;
        location.LocationType = dto.LocationType;
        location.Description = dto.Description;
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true, message = "Location updated." });
    }
}

public class CreateLocationDto
{
    public string LocationName { get; set; } = string.Empty;
    public LocationType LocationType { get; set; }
    public string? Description { get; set; }
}
