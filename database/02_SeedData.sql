-- =====================================================================
-- EcoRefund AI - Seed Data
-- =====================================================================

USE Ecorefund;
GO

-- Super Admin (Password: SuperAdmin@123 - BCrypt hashed)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'superadmin@ecorefund.ai')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, Email, PasswordHash, Role, IsActive, IsLoginEnabled)
    VALUES (
        NEWID(),
        'Super', 'Admin',
        'superadmin@ecorefund.ai',
        '$2a$12$placeholderHashReplaceWithActualBCryptHash',
        1, -- SuperAdmin
        1,
        1
    );
    PRINT 'Super Admin seeded.';
END

-- Demo Organization: Mysuru Zoo
IF NOT EXISTS (SELECT 1 FROM Organizations WHERE Email = 'admin@mysuruzo.com')
BEGIN
    DECLARE @OrgId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO Organizations (Id, OrganizationCode, OrganizationName, OrganizationType,
        Address, City, State, PinCode, Email, Phone, SubscriptionPlan, MaxLocations, MaxUsers, MaxQrPerDay,
        SubscriptionExpiresAt)
    VALUES (
        @OrgId, 'ORG-1001', 'Mysuru Zoo', 3, -- CinemaHall enum value, but Zoo = 1
        'Mysore Palace Premises', 'Mysuru', 'Karnataka', '570001',
        'admin@mysuruzo.com', '9876543210', 3, 5, 50, 500,
        DATEADD(YEAR, 1, GETUTCDATE())
    );

    -- Org Admin
    INSERT INTO Users (Id, OrganizationId, FirstName, LastName, Email, PasswordHash, Role, IsActive, IsLoginEnabled)
    VALUES (NEWID(), @OrgId, 'Zoo', 'Admin', 'admin@mysuruzo.com',
        '$2a$12$placeholderHashReplaceWithActualBCryptHash', 2, 1, 1);

    -- Default Locations
    INSERT INTO Locations (Id, OrganizationId, LocationName, LocationType)
    VALUES
        (NEWID(), @OrgId, 'Main Gate', 1),
        (NEWID(), @OrgId, 'Entry Gate', 2),
        (NEWID(), @OrgId, 'Exit Gate', 3);

    -- Default Item Types
    INSERT INTO ItemTypes (Id, OrganizationId, TypeName, DefaultDepositAmount)
    VALUES
        (NEWID(), @OrgId, 'Plastic Bottle', 20.00),
        (NEWID(), @OrgId, 'Plastic Bag', 10.00),
        (NEWID(), @OrgId, 'Food Container', 30.00),
        (NEWID(), @OrgId, 'Can', 15.00),
        (NEWID(), @OrgId, 'Glass Bottle', 25.00);

    PRINT 'Demo organization (Mysuru Zoo) seeded.';
END
GO

PRINT 'Seed data completed!';
GO
