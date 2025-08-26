-- School Management System Database Schema
-- SQL Server Database

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'school_management')
BEGIN
    CREATE DATABASE school_management;
END
GO

USE school_management;
GO

-- Create Users table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('student', 'teacher', 'admin')),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    LastLogin DATETIME2 NULL
);

-- Create Students table
CREATE TABLE Students (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    DateOfBirth DATE NOT NULL,
    Grade INT NOT NULL CHECK (Grade BETWEEN 1 AND 12),
    ParentName NVARCHAR(100) NOT NULL,
    ParentPhone VARCHAR(20) NOT NULL,
    Address NVARCHAR(500) NULL,
    EmergencyContact NVARCHAR(100) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Create Teachers table
CREATE TABLE Teachers (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Subject NVARCHAR(50) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Address NVARCHAR(500) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Create Subjects table
CREATE TABLE Subjects (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Code VARCHAR(20) UNIQUE NOT NULL,
    Description NVARCHAR(500) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create Classes table
CREATE TABLE Classes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Grade INT NOT NULL CHECK (Grade BETWEEN 1 AND 12),
    Section VARCHAR(10) NOT NULL,
    Capacity INT NOT NULL,
    TeacherId UNIQUEIDENTIFIER NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (TeacherId) REFERENCES Teachers(Id),
    UNIQUE (Grade, Section)
);

-- Create Courses table
CREATE TABLE Courses (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Code VARCHAR(20) UNIQUE NOT NULL,
    Description NVARCHAR(500) NULL,
    Credits INT NOT NULL CHECK (Credits BETWEEN 1 AND 10),
    Grade INT NOT NULL CHECK (Grade BETWEEN 1 AND 12),
    SubjectId UNIQUEIDENTIFIER NOT NULL,
    TeacherId UNIQUEIDENTIFIER NOT NULL,
    MaxStudents INT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
    FOREIGN KEY (TeacherId) REFERENCES Teachers(Id)
);

-- Create CourseEnrollments table
CREATE TABLE CourseEnrollments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL,
    CourseId UNIQUEIDENTIFIER NOT NULL,
    EnrolledAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (CourseId) REFERENCES Courses(Id),
    UNIQUE (StudentId, CourseId)
);

-- Create Attendance table
CREATE TABLE Attendance (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL,
    CourseId UNIQUEIDENTIFIER NOT NULL,
    TeacherId UNIQUEIDENTIFIER NOT NULL,
    Date DATE NOT NULL,
    Status VARCHAR(20) NOT NULL CHECK (Status IN ('present', 'absent', 'late', 'excused')),
    Remarks NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (CourseId) REFERENCES Courses(Id),
    FOREIGN KEY (TeacherId) REFERENCES Teachers(Id),
    UNIQUE (StudentId, CourseId, Date)
);

-- Create Grades table
CREATE TABLE Grades (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL,
    CourseId UNIQUEIDENTIFIER NOT NULL,
    ExamType VARCHAR(20) NOT NULL CHECK (ExamType IN ('midterm', 'final', 'quiz', 'assignment', 'project')),
    Score DECIMAL(5,2) NOT NULL CHECK (Score >= 0),
    MaxScore DECIMAL(5,2) NOT NULL CHECK (MaxScore > 0),
    Percentage DECIMAL(5,2) NOT NULL,
    Grade VARCHAR(2) NULL,
    Date DATE NOT NULL,
    Remarks NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (CourseId) REFERENCES Courses(Id)
);

-- Create PasswordResetTokens table
CREATE TABLE PasswordResetTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email VARCHAR(100) NOT NULL,
    Token VARCHAR(255) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    IsUsed BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create indexes for better performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);
CREATE INDEX IX_Students_Email ON Students(Email);
CREATE INDEX IX_Students_Grade ON Students(Grade);
CREATE INDEX IX_Teachers_Email ON Teachers(Email);
CREATE INDEX IX_Teachers_Subject ON Teachers(Subject);
CREATE INDEX IX_Courses_Code ON Courses(Code);
CREATE INDEX IX_Courses_Grade ON Courses(Grade);
CREATE INDEX IX_Courses_SubjectId ON Courses(SubjectId);
CREATE INDEX IX_Courses_TeacherId ON Courses(TeacherId);
CREATE INDEX IX_CourseEnrollments_StudentId ON CourseEnrollments(StudentId);
CREATE INDEX IX_CourseEnrollments_CourseId ON CourseEnrollments(CourseId);
CREATE INDEX IX_Attendance_StudentId ON Attendance(StudentId);
CREATE INDEX IX_Attendance_CourseId ON Attendance(CourseId);
CREATE INDEX IX_Attendance_Date ON Attendance(Date);
CREATE INDEX IX_Grades_StudentId ON Grades(StudentId);
CREATE INDEX IX_Grades_CourseId ON Grades(CourseId);
CREATE INDEX IX_Grades_ExamType ON Grades(ExamType);
CREATE INDEX IX_PasswordResetTokens_Email ON PasswordResetTokens(Email);
CREATE INDEX IX_PasswordResetTokens_Token ON PasswordResetTokens(Token);

-- Create computed column for percentage in Grades table
ALTER TABLE Grades ADD CONSTRAINT CK_Grades_Percentage 
CHECK (Percentage = (Score / MaxScore) * 100);

-- Create trigger to update percentage automatically
GO
CREATE TRIGGER TR_Grades_UpdatePercentage
ON Grades
AFTER INSERT, UPDATE
AS
BEGIN
    UPDATE Grades
    SET Percentage = (Score / MaxScore) * 100,
        Grade = CASE 
            WHEN (Score / MaxScore) * 100 >= 90 THEN 'A'
            WHEN (Score / MaxScore) * 100 >= 80 THEN 'B'
            WHEN (Score / MaxScore) * 100 >= 70 THEN 'C'
            WHEN (Score / MaxScore) * 100 >= 60 THEN 'D'
            ELSE 'F'
        END
    FROM Grades g
    INNER JOIN inserted i ON g.Id = i.Id;
END;
GO

-- Create trigger to update UpdatedAt timestamp
CREATE TRIGGER TR_UpdateTimestamp
ON Users
AFTER UPDATE
AS
BEGIN
    UPDATE Users
    SET UpdatedAt = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.Id = i.Id;
END;
GO

-- Create similar triggers for other tables
CREATE TRIGGER TR_Students_UpdateTimestamp
ON Students
AFTER UPDATE
AS
BEGIN
    UPDATE Students
    SET UpdatedAt = GETDATE()
    FROM Students s
    INNER JOIN inserted i ON s.Id = i.Id;
END;
GO

CREATE TRIGGER TR_Teachers_UpdateTimestamp
ON Teachers
AFTER UPDATE
AS
BEGIN
    UPDATE Teachers
    SET UpdatedAt = GETDATE()
    FROM Teachers t
    INNER JOIN inserted i ON t.Id = i.Id;
END;
GO

CREATE TRIGGER TR_Courses_UpdateTimestamp
ON Courses
AFTER UPDATE
AS
BEGIN
    UPDATE Courses
    SET UpdatedAt = GETDATE()
    FROM Courses c
    INNER JOIN inserted i ON c.Id = i.Id;
END;
GO

-- Insert sample data
INSERT INTO Subjects (Id, Name, Code, Description) VALUES
(NEWID(), 'Mathematics', 'MATH', 'Advanced mathematics including algebra, geometry, and calculus'),
(NEWID(), 'Science', 'SCI', 'General science including physics, chemistry, and biology'),
(NEWID(), 'English', 'ENG', 'English language and literature'),
(NEWID(), 'History', 'HIST', 'World history and social studies'),
(NEWID(), 'Computer Science', 'CS', 'Programming and computer fundamentals');

-- Create default admin user (password: Admin123!)
INSERT INTO Users (Id, Name, Email, Password, Role) VALUES
(NEWID(), 'System Administrator', 'admin@school.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2.', 'admin');

GO
