using EcoRefund.Application.Common.Interfaces;
using EcoRefund.Application.Common.Models;
using EcoRefund.Domain.Entities;
using EcoRefund.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EcoRefund.Application.Features.Organizations.Commands.RegisterOrganization;

public class RegisterOrganizationCommandHandler
    : IRequestHandler<RegisterOrganizationCommand, Result<RegisterOrganizationResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordService _passwordService;

    public RegisterOrganizationCommandHandler(
        IApplicationDbContext context,
        IPasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    public async Task<Result<RegisterOrganizationResponse>> Handle(
        RegisterOrganizationCommand request,
        CancellationToken cancellationToken)
    {
        // Check if email already exists
        var emailExists = await _context.Organizations
            .AnyAsync(o => o.Email.ToLower() == request.Email.ToLower() && !o.IsDeleted, cancellationToken);

        if (emailExists)
            return Result<RegisterOrganizationResponse>.Fail("An organization with this email already exists.");

        var adminEmailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == request.AdminEmail.ToLower() && !u.IsDeleted, cancellationToken);

        if (adminEmailExists)
            return Result<RegisterOrganizationResponse>.Fail("An account with this admin email already exists.");

        // Generate unique organization code
        var orgCode = await GenerateOrgCodeAsync(cancellationToken);

        // Set subscription limits
        var (maxLocations, maxUsers, maxQrPerDay) = GetSubscriptionLimits(request.SubscriptionPlan);

        var organization = new Organization
        {
            OrganizationCode = orgCode,
            OrganizationName = request.OrganizationName,
            OrganizationType = request.OrganizationType,
            Address = request.Address,
            City = request.City,
            State = request.State,
            PinCode = request.PinCode,
            Email = request.Email,
            Phone = request.Phone,
            GstNumber = request.GstNumber,
            SubscriptionPlan = request.SubscriptionPlan,
            MaxLocations = maxLocations,
            MaxUsers = maxUsers,
            MaxQrPerDay = maxQrPerDay,
            IsActive = true,
            IsLoginEnabled = true,
            SubscriptionExpiresAt = request.SubscriptionPlan == SubscriptionPlan.Free
                ? DateTime.UtcNow.AddDays(30)
                : DateTime.UtcNow.AddYears(1)
        };

        _context.Organizations.Add(organization);

        var adminUser = new User
        {
            OrganizationId = organization.Id,
            FirstName = request.AdminFirstName,
            LastName = request.AdminLastName,
            Email = request.AdminEmail,
            PasswordHash = _passwordService.HashPassword(request.AdminPassword),
            Role = UserRole.OrgAdmin,
            IsActive = true,
            IsLoginEnabled = true
        };

        _context.Users.Add(adminUser);

        // Create default location
        var defaultLocation = new Location
        {
            OrganizationId = organization.Id,
            LocationName = "Main Gate",
            LocationType = LocationType.MainGate,
            IsActive = true
        };
        _context.Locations.Add(defaultLocation);

        // Create default item types
        var defaultItemTypes = new List<ItemType>
        {
            new() { OrganizationId = organization.Id, TypeName = "Plastic Bottle", DefaultDepositAmount = 20, IsActive = true },
            new() { OrganizationId = organization.Id, TypeName = "Plastic Bag", DefaultDepositAmount = 10, IsActive = true },
            new() { OrganizationId = organization.Id, TypeName = "Food Container", DefaultDepositAmount = 30, IsActive = true },
            new() { OrganizationId = organization.Id, TypeName = "Can", DefaultDepositAmount = 15, IsActive = true },
            new() { OrganizationId = organization.Id, TypeName = "Glass Bottle", DefaultDepositAmount = 25, IsActive = true },
        };
        _context.ItemTypes.AddRange(defaultItemTypes);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<RegisterOrganizationResponse>.Ok(new RegisterOrganizationResponse
        {
            OrganizationId = organization.Id,
            OrganizationCode = organization.OrganizationCode,
            OrganizationName = organization.OrganizationName,
            AdminUserId = adminUser.Id,
            AdminEmail = adminUser.Email,
            Message = $"Organization registered successfully. Your Organization ID is {orgCode}."
        });
    }

    private async Task<string> GenerateOrgCodeAsync(CancellationToken cancellationToken)
    {
        var count = await _context.Organizations.CountAsync(cancellationToken);
        return $"ORG-{(count + 1001):D4}";
    }

    private static (int maxLocations, int maxUsers, int maxQrPerDay) GetSubscriptionLimits(SubscriptionPlan plan) =>
        plan switch
        {
            SubscriptionPlan.Free => (3, 10, 100),
            SubscriptionPlan.Starter => (5, 25, 500),
            SubscriptionPlan.Professional => (20, 100, 2000),
            SubscriptionPlan.Enterprise => (100, 500, 10000),
            _ => (3, 10, 100)
        };
}
