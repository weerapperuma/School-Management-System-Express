-- School Management System Stored Procedures
-- SQL Server Database

USE LMS;
GO

-- =============================================
-- User Management Stored Procedures
-- =============================================

-- Get user by email
IF OBJECT_ID('sp_GetUserByEmail', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetUserByEmail;
GO

CREATE PROCEDURE sp_GetUserByEmail
    @Email NVARCHAR(100)
AS
BEGIN
    SELECT UserID, FullName, Email, PasswordHash, Role, CreatedAt, LastLogin
    FROM Users 
    WHERE Email = @Email;
END;
GO

-- Update last login
IF OBJECT_ID('sp_UpdateLastLogin', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateLastLogin;
GO

CREATE PROCEDURE sp_UpdateLastLogin
    @UserID INT
AS
BEGIN
    UPDATE Users 
    SET LastLogin = GETDATE()
    WHERE UserID = @UserID;
END;
GO

-- Get user by ID
IF OBJECT_ID('sp_GetUserById', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetUserById;
GO

CREATE PROCEDURE sp_GetUserById
    @UserID INT
AS
BEGIN
    SELECT UserID, FullName, Email, PasswordHash, Role, CreatedAt, LastLogin
    FROM Users 
    WHERE UserID = @UserID;
END;
GO

-- Register new user
IF OBJECT_ID('sp_RegisterUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_RegisterUser;
GO

CREATE PROCEDURE sp_RegisterUser
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @Role NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        THROW 50001, 'Email already exists. Registration aborted.', 1; -- stops execution
        RETURN;
    END

    -- Insert new user
    INSERT INTO Users (FullName, Email, PasswordHash, Role)
    VALUES (@FullName, @Email, @PasswordHash, @Role);
END;
GO

-- Update last login
IF OBJECT_ID('sp_UpdateLastLogin', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateLastLogin;
GO

CREATE PROCEDURE sp_UpdateLastLogin
    @UserID INT
AS
BEGIN
    UPDATE Users 
    SET LastLogin = GETDATE()
    WHERE UserID = @UserID;
END;
GO

-- Get all users with pagination
IF OBJECT_ID('sp_GetAllUsers', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetAllUsers;
GO

CREATE PROCEDURE sp_GetAllUsers
    @Page INT = 1,
    @Limit INT = 10,
    @Search NVARCHAR(100) = NULL,
    @Offset INT = 0
AS
BEGIN
    DECLARE @TotalCount INT;
    
    -- Get total count
    SELECT @TotalCount = COUNT(*)
    FROM Users
    WHERE (@Search IS NULL OR FullName LIKE '%' + @Search + '%' OR Email LIKE '%' + @Search + '%');
    
    -- Get paginated results
    SELECT UserID, FullName, Email, Role, CreatedAt, LastLogin
    FROM Users
    WHERE (@Search IS NULL OR FullName LIKE '%' + @Search + '%' OR Email LIKE '%' + @Search + '%')
    ORDER BY CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
    
    -- Return total count
    SELECT @TotalCount AS TotalCount;
END;
GO

-- Update user status
IF OBJECT_ID('sp_UpdateUserStatus', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateUserStatus;
GO

CREATE PROCEDURE sp_UpdateUserStatus
    @UserID INT,
    @IsActive BIT
AS
BEGIN
    UPDATE Users 
    SET IsActive = @IsActive
    WHERE UserID = @UserID;
END;
GO

-- Delete user (soft delete)
IF OBJECT_ID('sp_DeleteUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_DeleteUser;
GO

CREATE PROCEDURE sp_DeleteUser
    @UserID INT
AS
BEGIN
    UPDATE Users 
    SET IsActive = 0
    WHERE UserID = @UserID;
END;
GO

-- =============================================
-- Password Reset Stored Procedures
-- =============================================

-- Store password reset token
IF OBJECT_ID('sp_StorePasswordResetToken', 'P') IS NOT NULL
    DROP PROCEDURE sp_StorePasswordResetToken;
GO

CREATE PROCEDURE sp_StorePasswordResetToken
    @Email NVARCHAR(100),
    @ResetToken NVARCHAR(255),
    @ExpiresAt DATETIME
AS
BEGIN
    -- Delete existing tokens for this email
    DELETE FROM PasswordResetTokens WHERE Email = @Email;
    
    -- Insert new token
    INSERT INTO PasswordResetTokens (Email, Token, ExpiresAt)
    VALUES (@Email, @ResetToken, @ExpiresAt);
END;
GO

-- Validate password reset token
IF OBJECT_ID('sp_ValidatePasswordResetToken', 'P') IS NOT NULL
    DROP PROCEDURE sp_ValidatePasswordResetToken;
GO

CREATE PROCEDURE sp_ValidatePasswordResetToken
    @Email NVARCHAR(100),
    @ResetToken NVARCHAR(255)
AS
BEGIN
    SELECT 1
    FROM PasswordResetTokens
    WHERE Email = @Email 
    AND Token = @ResetToken 
    AND ExpiresAt > GETDATE()
    AND IsUsed = 0;
END;
GO

-- Update password
IF OBJECT_ID('sp_UpdatePassword', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdatePassword;
GO

CREATE PROCEDURE sp_UpdatePassword
    @Email NVARCHAR(100),
    @NewPassword NVARCHAR(255)
AS
BEGIN
    UPDATE Users 
    SET PasswordHash = @NewPassword
    WHERE Email = @Email;
END;
GO

-- Clear password reset token
IF OBJECT_ID('sp_ClearPasswordResetToken', 'P') IS NOT NULL
    DROP PROCEDURE sp_ClearPasswordResetToken;
GO

CREATE PROCEDURE sp_ClearPasswordResetToken
    @Email NVARCHAR(100)
AS
BEGIN
    UPDATE PasswordResetTokens 
    SET IsUsed = 1
    WHERE Email = @Email;
END;
GO

-- Change password stored procedure
IF OBJECT_ID('sp_ChangePassword', 'P') IS NOT NULL
    DROP PROCEDURE sp_ChangePassword;
GO

CREATE PROCEDURE sp_ChangePassword
    @UserID INT,
    @OldPasswordHash NVARCHAR(255),
    @NewPasswordHash NVARCHAR(255)
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID AND PasswordHash = @OldPasswordHash)
    BEGIN
        RAISERROR('Old password is incorrect', 16, 1);
        RETURN;
    END

    UPDATE Users
    SET PasswordHash = @NewPasswordHash
    WHERE UserID = @UserID;
END;
GO

-- =============================================
-- Dashboard and Reports Stored Procedures
-- =============================================

-- Get dashboard overview
IF OBJECT_ID('sp_GetDashboardOverview', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetDashboardOverview;
GO

CREATE PROCEDURE sp_GetDashboardOverview
AS
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM Users WHERE Role = 'Student') AS TotalStudents,
        (SELECT COUNT(*) FROM Users WHERE Role = 'Teacher') AS TotalTeachers,
        (SELECT COUNT(*) FROM Users WHERE Role = 'Admin') AS TotalAdmins,
        (SELECT COUNT(*) FROM Users WHERE LastLogin >= DATEADD(day, -7, GETDATE())) AS ActiveUsers
END;
GO

-- Get system stats
IF OBJECT_ID('sp_GetSystemStats', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetSystemStats;
GO

CREATE PROCEDURE sp_GetSystemStats
AS
BEGIN
    SELECT 
        'Total Users' AS StatName,
        COUNT(*) AS StatValue
    FROM Users
    UNION ALL
    SELECT 
        'Active Users (Last 7 days)' AS StatName,
        COUNT(*) AS StatValue
    FROM Users
    WHERE LastLogin >= DATEADD(day, -7, GETDATE());
END;
GO

-- =============================================
-- Additional Tables (if needed)
-- =============================================

-- Add IsActive column to Users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsActive')
BEGIN
    ALTER TABLE Users ADD IsActive BIT DEFAULT 1;
END;
GO

-- Create PasswordResetTokens table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PasswordResetTokens')
BEGIN
    CREATE TABLE PasswordResetTokens (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email NVARCHAR(100) NOT NULL,
        Token NVARCHAR(255) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        IsUsed BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_PasswordResetTokens_Email ON PasswordResetTokens(Email);
    CREATE INDEX IX_PasswordResetTokens_Token ON PasswordResetTokens(Token);
END;
GO
