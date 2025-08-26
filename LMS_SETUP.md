# LMS Database Setup Guide

## 🗄️ **Setup Your LMS Database**

### **Step 1: Run Database Setup Script**

```bash
sqlcmd -S localhost -U SA -P 'YourPassword123!' -i setup-database.sql
```

This will:
- Create the `LMS` database
- Create the `Users` table
- Create all stored procedures
- Add performance indexes

### **Step 2: Update Environment Variables**

Create a `.env` file in your project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (LMS)
DB_SERVER=localhost
DB_DATABASE=LMS
DB_USER=sa
DB_PASSWORD=YourPassword123!
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

### **Step 3: Start the Server**

```bash
npm run dev
```

### **Step 4: Test Registration**

**URL:** `POST http://localhost:3000/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**JSON Body:**
```json
{
  "name": "Sahiru Test",
  "email": "sahiru@test.com",
  "password": "Password123!",
  "role": "Student"
}
```

### **Step 5: Test Login**

**URL:** `POST http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**JSON Body:**
```json
{
  "email": "sahiru@test.com",
  "password": "Password123!"
}
```

## 🔧 **Database Schema**

### **Users Table**
```sql
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Student','Teacher','Admin')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL
);
```

### **Stored Procedures**
- `sp_RegisterUser` - Register new user
- `sp_LoginUser` - Login user and update last login
- `sp_ChangePassword` - Change user password
- `sp_GetUserByEmail` - Get user by email
- `sp_GetUserById` - Get user by ID

## 🚀 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### **Health Check**
- `GET /health` - Server health status

## 🐛 **Troubleshooting**

### **Database Connection Issues:**
1. Verify SQL Server is running
2. Check credentials in `.env` file
3. Ensure `LMS` database exists
4. Verify stored procedures are created

### **Test Database Connection:**
```bash
sqlcmd -S localhost -U SA -P 'YourPassword123!' -d LMS -Q "SELECT 'Connected successfully!'"
```

### **Check Stored Procedures:**
```bash
sqlcmd -S localhost -U SA -P 'YourPassword123!' -d LMS -Q "SELECT name FROM sys.procedures WHERE name LIKE 'sp_%'"
```

## ✅ **Success Indicators**

- Server starts without database errors
- Registration endpoint returns 201 status
- Login endpoint returns 200 status with JWT tokens
- Database shows new user records

Your LMS backend is now ready to use! 🎉
