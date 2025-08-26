-- LMS Database Setup Script
-- Run this with: sqlcmd -S localhost -U SA -P 'YourPassword123!' -i setup-database.sql

-- ============================================
-- 1. Use or create database
-- ============================================
IF DB_ID('LMS') IS NULL
    CREATE DATABASE LMS;
GO

USE LMS;
GO

-- ============================================
-- 2. Drop and create Users table
-- ============================================
IF OBJECT_ID('Users', 'U') IS NOT NULL
    DROP TABLE Users;
GO

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Student','Teacher','Admin')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL
);
GO

-- ============================================
-- 3. Drop and create stored procedures
-- ============================================

-- sp_RegisterUser
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

-- sp_UpdateLastLogin
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

-- sp_ChangePassword
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

-- sp_GetUserByEmail
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

-- sp_GetUserById
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

-- sp_StorePasswordResetToken
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

-- sp_ValidatePasswordResetToken
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

-- sp_UpdatePassword
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

-- sp_ClearPasswordResetToken
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

-- ============================================
-- 4. Create indexes for performance
-- ============================================
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);
CREATE INDEX IX_Users_CreatedAt ON Users(CreatedAt);
GO

-- ============================================
-- 5. Insert test data (optional)
-- ============================================
-- Uncomment the lines below to insert test data

-- EXEC sp_RegisterUser 'Sahiru Test', 'sahiru@test.com', '12345', 'Student';
-- EXEC sp_RegisterUser 'Admin User', 'admin@lms.com', 'admin123', 'Admin';
-- EXEC sp_RegisterUser 'Teacher User', 'teacher@lms.com', 'teacher123', 'Teacher';

-- ============================================
-- 6. Verify setup
-- ============================================
SELECT 'Database setup completed successfully!' AS Status;
SELECT COUNT(*) AS TotalUsers FROM Users;
GO
