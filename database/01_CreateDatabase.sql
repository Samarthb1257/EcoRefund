-- =====================================================================
-- EcoRefund AI - SQL Server Database Scripts
-- Production-Grade Multi-Tenant SaaS Platform
-- =====================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'EcoRefundAI')
BEGIN
    CREATE DATABASE EcoRefundAI
    COLLATE SQL_Latin1_General_CP1_CI_AS;
END
GO

USE EcoRefundAI;
GO

-- =====================================================================
-- TABLE: Organizations (Multi-Tenant Anchor)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Organizations')
BEGIN
    CREATE TABLE Organizations (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationCode NVARCHAR(20)       NOT NULL,
        OrganizationName NVARCHAR(200)      NOT NULL,
        OrganizationType INT                NOT NULL,  -- See OrganizationType enum
        Address         NVARCHAR(500)       NOT NULL,
        City            NVARCHAR(100)       NOT NULL,
        State           NVARCHAR(100)       NOT NULL,
        PinCode         NVARCHAR(10)        NOT NULL,
        Email           NVARCHAR(256)       NOT NULL,
        Phone           NVARCHAR(20)        NOT NULL,
        GstNumber       NVARCHAR(20)        NULL,
        LogoUrl         NVARCHAR(500)       NULL,
        Website         NVARCHAR(300)       NULL,
        IsActive        BIT                 NOT NULL DEFAULT 1,
        IsLoginEnabled  BIT                 NOT NULL DEFAULT 1,  -- SuperAdmin can block entire org
        SubscriptionPlan INT                NOT NULL DEFAULT 1,  -- 1=Free, 2=Starter, 3=Pro, 4=Enterprise
        SubscriptionExpiresAt DATETIME2     NULL,
        MaxLocations    INT                 NOT NULL DEFAULT 3,
        MaxUsers        INT                 NOT NULL DEFAULT 10,
        MaxQrPerDay     INT                 NOT NULL DEFAULT 100,
        IsDeleted       BIT                 NOT NULL DEFAULT 0,
        DeletedAt       DATETIME2           NULL,
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt       DATETIME2           NULL,
        CreatedBy       NVARCHAR(256)       NULL,
        UpdatedBy       NVARCHAR(256)       NULL,

        CONSTRAINT PK_Organizations PRIMARY KEY (Id),
        CONSTRAINT UQ_Organizations_Code UNIQUE (OrganizationCode),
        CONSTRAINT UQ_Organizations_Email UNIQUE (Email)
    );
END
GO

-- =====================================================================
-- TABLE: Users (Supports all roles with per-user login control)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id                      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId          UNIQUEIDENTIFIER    NULL,        -- NULL for SuperAdmin
        FirstName               NVARCHAR(100)       NOT NULL,
        LastName                NVARCHAR(100)       NOT NULL,
        Email                   NVARCHAR(256)       NOT NULL,
        PasswordHash            NVARCHAR(512)       NOT NULL,
        Phone                   NVARCHAR(20)        NULL,
        Role                    INT                 NOT NULL,    -- 1=SuperAdmin,2=OrgAdmin,3=Manager,4=EntryStaff,5=ExitStaff,6=Auditor
        IsActive                BIT                 NOT NULL DEFAULT 1,
        IsLoginEnabled          BIT                 NOT NULL DEFAULT 1,   -- OrgAdmin/SuperAdmin can toggle this
        ProfileImageUrl         NVARCHAR(500)       NULL,
        RefreshToken            NVARCHAR(512)       NULL,
        RefreshTokenExpiryTime  DATETIME2           NULL,
        LastLoginAt             DATETIME2           NULL,
        LastLoginIp             NVARCHAR(50)        NULL,
        FailedLoginAttempts     INT                 NOT NULL DEFAULT 0,
        LockoutUntil            DATETIME2           NULL,
        AssignedLocationId      UNIQUEIDENTIFIER    NULL,
        IsDeleted               BIT                 NOT NULL DEFAULT 0,
        DeletedAt               DATETIME2           NULL,
        CreatedAt               DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt               DATETIME2           NULL,
        CreatedBy               NVARCHAR(256)       NULL,
        UpdatedBy               NVARCHAR(256)       NULL,

        CONSTRAINT PK_Users PRIMARY KEY (Id),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT FK_Users_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Users_Location FOREIGN KEY (AssignedLocationId)
            REFERENCES Locations(Id) ON DELETE SET NULL
    );
END
GO

-- =====================================================================
-- TABLE: Locations
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Locations')
BEGIN
    CREATE TABLE Locations (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId  UNIQUEIDENTIFIER    NOT NULL,
        LocationName    NVARCHAR(200)       NOT NULL,
        LocationType    INT                 NOT NULL,  -- 1=MainGate,2=EntryGate,3=ExitGate,4=Branch,...
        Description     NVARCHAR(500)       NULL,
        Address         NVARCHAR(500)       NULL,
        IsActive        BIT                 NOT NULL DEFAULT 1,
        IsDeleted       BIT                 NOT NULL DEFAULT 0,
        DeletedAt       DATETIME2           NULL,
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt       DATETIME2           NULL,
        CreatedBy       NVARCHAR(256)       NULL,
        UpdatedBy       NVARCHAR(256)       NULL,

        CONSTRAINT PK_Locations PRIMARY KEY (Id),
        CONSTRAINT FK_Locations_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE CASCADE
    );
END
GO

-- =====================================================================
-- TABLE: ItemTypes
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ItemTypes')
BEGIN
    CREATE TABLE ItemTypes (
        Id                      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId          UNIQUEIDENTIFIER    NOT NULL,
        TypeName                NVARCHAR(100)       NOT NULL,
        Description             NVARCHAR(500)       NULL,
        DefaultDepositAmount    DECIMAL(18,2)       NOT NULL DEFAULT 0,
        IconUrl                 NVARCHAR(500)       NULL,
        IsActive                BIT                 NOT NULL DEFAULT 1,
        IsDeleted               BIT                 NOT NULL DEFAULT 0,
        CreatedAt               DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt               DATETIME2           NULL,

        CONSTRAINT PK_ItemTypes PRIMARY KEY (Id),
        CONSTRAINT FK_ItemTypes_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE CASCADE
    );
END
GO

-- =====================================================================
-- TABLE: QrCodes (Core QR tracking table)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QrCodes')
BEGIN
    CREATE TABLE QrCodes (
        Id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId      UNIQUEIDENTIFIER    NOT NULL,
        QrCodeNumber        NVARCHAR(50)        NOT NULL,
        QrCodeData          NVARCHAR(MAX)       NOT NULL,
        QrImageBase64       NVARCHAR(MAX)       NULL,
        Status              INT                 NOT NULL DEFAULT 2,  -- 1=Generated,2=Active,3=Returned,4=Refunded,5=Invalid,6=Expired
        GeneratedByUserId   UNIQUEIDENTIFIER    NOT NULL,
        GeneratedAt         DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        ActivatedAt         DATETIME2           NULL,
        RedeemedAt          DATETIME2           NULL,
        ExpiresAt           DATETIME2           NULL,
        RedemptionNotes     NVARCHAR(500)       NULL,
        RedeemedByUserId    UNIQUEIDENTIFIER    NULL,
        ScanAttemptCount    INT                 NOT NULL DEFAULT 0,
        IsDeleted           BIT                 NOT NULL DEFAULT 0,
        CreatedAt           DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt           DATETIME2           NULL,

        CONSTRAINT PK_QrCodes PRIMARY KEY (Id),
        CONSTRAINT UQ_QrCodes_OrgNumber UNIQUE (OrganizationId, QrCodeNumber),
        CONSTRAINT FK_QrCodes_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_QrCodes_GeneratedBy FOREIGN KEY (GeneratedByUserId)
            REFERENCES Users(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================================
-- TABLE: Items (Registered physical items)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Items')
BEGIN
    CREATE TABLE Items (
        Id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId      UNIQUEIDENTIFIER    NOT NULL,
        ItemTypeId          UNIQUEIDENTIFIER    NOT NULL,
        LocationId          UNIQUEIDENTIFIER    NOT NULL,
        QrCodeId            UNIQUEIDENTIFIER    NOT NULL,
        RegisteredByUserId  UNIQUEIDENTIFIER    NOT NULL,
        ItemNumber          NVARCHAR(50)        NOT NULL,
        Description         NVARCHAR(500)       NULL,
        DepositAmount       DECIMAL(18,2)       NOT NULL,
        Status              INT                 NOT NULL DEFAULT 1,  -- 1=Active,2=Returned,3=Refunded,4=Expired,5=Lost
        RegisteredAt        DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        ReturnedAt          DATETIME2           NULL,
        ExpiresAt           DATETIME2           NULL,
        Notes               NVARCHAR(500)       NULL,
        IsDeleted           BIT                 NOT NULL DEFAULT 0,
        CreatedAt           DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt           DATETIME2           NULL,

        CONSTRAINT PK_Items PRIMARY KEY (Id),
        CONSTRAINT FK_Items_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Items_ItemType FOREIGN KEY (ItemTypeId)
            REFERENCES ItemTypes(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Items_Location FOREIGN KEY (LocationId)
            REFERENCES Locations(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Items_QrCode FOREIGN KEY (QrCodeId)
            REFERENCES QrCodes(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Items_RegisteredBy FOREIGN KEY (RegisteredByUserId)
            REFERENCES Users(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================================
-- TABLE: Deposits
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Deposits')
BEGIN
    CREATE TABLE Deposits (
        Id                      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId          UNIQUEIDENTIFIER    NOT NULL,
        ItemId                  UNIQUEIDENTIFIER    NOT NULL,
        QrCodeId                UNIQUEIDENTIFIER    NOT NULL,
        CollectedByUserId       UNIQUEIDENTIFIER    NOT NULL,
        Amount                  DECIMAL(18,2)       NOT NULL,
        PaymentMethod           NVARCHAR(50)        NOT NULL DEFAULT 'Cash',
        TransactionReference    NVARCHAR(100)       NULL,
        CollectedAt             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        Notes                   NVARCHAR(500)       NULL,
        IsDeleted               BIT                 NOT NULL DEFAULT 0,
        CreatedAt               DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt               DATETIME2           NULL,

        CONSTRAINT PK_Deposits PRIMARY KEY (Id),
        CONSTRAINT FK_Deposits_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Deposits_Item FOREIGN KEY (ItemId)
            REFERENCES Items(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Deposits_QrCode FOREIGN KEY (QrCodeId)
            REFERENCES QrCodes(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Deposits_CollectedBy FOREIGN KEY (CollectedByUserId)
            REFERENCES Users(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================================
-- TABLE: Refunds
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Refunds')
BEGIN
    CREATE TABLE Refunds (
        Id                      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId          UNIQUEIDENTIFIER    NOT NULL,
        ItemId                  UNIQUEIDENTIFIER    NOT NULL,
        QrCodeId                UNIQUEIDENTIFIER    NOT NULL,
        DepositId               UNIQUEIDENTIFIER    NOT NULL,
        ProcessedByUserId       UNIQUEIDENTIFIER    NOT NULL,
        Amount                  DECIMAL(18,2)       NOT NULL,
        RefundMethod            INT                 NOT NULL,  -- 1=Cash,2=UPI,3=Coupon,4=Wallet,5=BankTransfer
        TransactionReference    NVARCHAR(100)       NULL,
        UpiId                   NVARCHAR(100)       NULL,
        CouponCode              NVARCHAR(50)        NULL,
        ProcessedAt             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        Notes                   NVARCHAR(500)       NULL,
        IsApproved              BIT                 NOT NULL DEFAULT 1,
        ApprovedByUserId        UNIQUEIDENTIFIER    NULL,
        IsDeleted               BIT                 NOT NULL DEFAULT 0,
        CreatedAt               DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt               DATETIME2           NULL,

        CONSTRAINT PK_Refunds PRIMARY KEY (Id),
        CONSTRAINT FK_Refunds_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Refunds_Item FOREIGN KEY (ItemId)
            REFERENCES Items(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Refunds_QrCode FOREIGN KEY (QrCodeId)
            REFERENCES QrCodes(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Refunds_Deposit FOREIGN KEY (DepositId)
            REFERENCES Deposits(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Refunds_ProcessedBy FOREIGN KEY (ProcessedByUserId)
            REFERENCES Users(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================================
-- TABLE: ScanAttempts (Fraud Prevention)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ScanAttempts')
BEGIN
    CREATE TABLE ScanAttempts (
        Id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId      UNIQUEIDENTIFIER    NOT NULL,
        QrCodeId            UNIQUEIDENTIFIER    NOT NULL,
        ScannedByUserId     UNIQUEIDENTIFIER    NULL,
        Result              INT                 NOT NULL,  -- 1=Success,2=AlreadyRedeemed,3=Invalid,4=WrongOrg,5=Expired,6=NotFound
        IpAddress           NVARCHAR(50)        NULL,
        DeviceInfo          NVARCHAR(500)       NULL,
        Notes               NVARCHAR(500)       NULL,
        ScannedAt           DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        IsDeleted           BIT                 NOT NULL DEFAULT 0,
        CreatedAt           DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_ScanAttempts PRIMARY KEY (Id),
        CONSTRAINT FK_ScanAttempts_Organization FOREIGN KEY (OrganizationId)
            REFERENCES Organizations(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_ScanAttempts_QrCode FOREIGN KEY (QrCodeId)
            REFERENCES QrCodes(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================================
-- TABLE: AuditLogs (Full audit trail)
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE AuditLogs (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
        OrganizationId  UNIQUEIDENTIFIER    NULL,
        UserId          UNIQUEIDENTIFIER    NULL,
        Action          NVARCHAR(100)       NOT NULL,
        EntityType      NVARCHAR(100)       NOT NULL,
        EntityId        NVARCHAR(100)       NULL,
        OldValues       NVARCHAR(MAX)       NULL,
        NewValues       NVARCHAR(MAX)       NULL,
        IpAddress       NVARCHAR(50)        NULL,
        UserAgent       NVARCHAR(500)       NULL,
        Description     NVARCHAR(500)       NULL,
        IsSuccess       BIT                 NOT NULL DEFAULT 1,
        ErrorMessage    NVARCHAR(500)       NULL,
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_AuditLogs PRIMARY KEY (Id)
    );
END
GO

-- =====================================================================
-- INDEXES for Performance
-- =====================================================================
CREATE INDEX IX_Items_OrganizationId_Status ON Items(OrganizationId, Status) WHERE IsDeleted = 0;
CREATE INDEX IX_Items_RegisteredAt ON Items(RegisteredAt);
CREATE INDEX IX_QrCodes_OrganizationId_Status ON QrCodes(OrganizationId, Status) WHERE IsDeleted = 0;
CREATE INDEX IX_QrCodes_GeneratedAt ON QrCodes(GeneratedAt);
CREATE INDEX IX_Refunds_OrganizationId_ProcessedAt ON Refunds(OrganizationId, ProcessedAt) WHERE IsDeleted = 0;
CREATE INDEX IX_Deposits_OrganizationId_CollectedAt ON Deposits(OrganizationId, CollectedAt) WHERE IsDeleted = 0;
CREATE INDEX IX_AuditLogs_OrganizationId_CreatedAt ON AuditLogs(OrganizationId, CreatedAt);
CREATE INDEX IX_AuditLogs_UserId ON AuditLogs(UserId);
CREATE INDEX IX_ScanAttempts_QrCodeId ON ScanAttempts(QrCodeId);
CREATE INDEX IX_Users_OrganizationId_Role ON Users(OrganizationId, Role) WHERE IsDeleted = 0;
GO

PRINT 'EcoRefund AI database created successfully!';
GO
