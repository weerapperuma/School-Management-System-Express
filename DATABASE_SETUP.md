# Database Setup Guide

## 🗄️ SQL Server Database Setup

### 1. **Create Database Schema**

Run the main schema file:
```bash
sqlcmd -S localhost -U your_username -P your_password -i database/schema.sql
```

### 2. **Create Stored Procedures**

Run the stored procedures file:
```bash
sqlcmd -S localhost -U your_username -P your_password -i database/stored-procedures.sql
```

### 3. **Update Environment Variables**

Create a `.env` file with your SQL Server credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (SQL Server)
DB_SERVER=localhost
DB_DATABASE=school_management
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 4. **Database Tables Structure**

The system uses these main tables:

#### **Users Table**
```sql
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Student','Teacher','Admin')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    IsActive BIT DEFAULT 1
);
```

#### **PasswordResetTokens Table**
```sql
CREATE TABLE PasswordResetTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(100) NOT NULL,
    Token NVARCHAR(255) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    IsUsed BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);
```

### 5. **Test Database Connection**

Start the server:
```bash
npm run dev
```

The server should connect successfully to your SQL Server database.

### 6. **Default Admin User**

After setup, you can create an admin user via API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@school.com",
    "password": "Admin123!",
    "role": "Admin"
  }'
```

### 7. **Troubleshooting**

#### **Connection Issues:**
- Verify SQL Server is running
- Check firewall settings
- Ensure credentials are correct
- Verify database exists

#### **Permission Issues:**
- Ensure user has CREATE, SELECT, INSERT, UPDATE, DELETE permissions
- Grant EXECUTE permission on stored procedures

#### **Port Issues:**
- Default SQL Server port is 1433
- Check if SQL Server is listening on the correct port

### 8. **Development Mode**

If you don't want to set up SQL Server immediately, the backend will run in development mode without database connection. You'll see warnings in the logs, but the API will still respond (with mock data).

To enable full functionality, complete the database setup above.
