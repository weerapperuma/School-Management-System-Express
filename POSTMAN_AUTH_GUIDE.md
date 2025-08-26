# 🔐 Authentication API - Postman Guide

## 📋 **Base URL**
```
http://localhost:3000/api/auth
```

## 📝 **Headers for All Requests**
```
Content-Type: application/json
```

For authenticated requests, add:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 1. 🔐 **Register User**

### **URL:**
```
POST http://localhost:3000/api/auth/register
```

### **JSON Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@school.com",
  "password": "Password123!",
  "role": "Student"
}
```

### **Role Options:**
- `"Student"`
- `"Teacher"`
- `"Admin"`

### **✅ Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@school.com",
      "role": "Student"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **❌ Error Response (400):**
```json
{
  "success": false,
  "error": "User already exists with this email"
}
```

---

## 2. 🔑 **Login User**

### **URL:**
```
POST http://localhost:3000/api/auth/login
```

### **JSON Body:**
```json
{
  "email": "john.doe@school.com",
  "password": "Password123!"
}
```

### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@school.com",
      "role": "Student"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **❌ Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## 3. 🔄 **Refresh Token**

### **URL:**
```
POST http://localhost:3000/api/auth/refresh-token
```

### **JSON Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **❌ Error Response (400):**
```json
{
  "success": false,
  "error": "Refresh token is required"
}
```

---

## 4. 🚪 **Logout User**

### **URL:**
```
POST http://localhost:3000/api/auth/logout
```

### **Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### **JSON Body:** (Optional)
```json
{}
```

### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 5. 👤 **Get Current User Profile**

### **URL:**
```
GET http://localhost:3000/api/auth/me
```

### **Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@school.com",
      "role": "Student",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLogin": "2024-01-15T14:45:00.000Z"
    }
  }
}
```

### **❌ Error Response (401):**
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

---

## 6. 📧 **Forgot Password**

### **URL:**
```
POST http://localhost:3000/api/auth/forgot-password
```

### **JSON Body:**
```json
{
  "email": "john.doe@school.com"
}
```

### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

---

## 7. 🔒 **Reset Password**

### **URL:**
```
POST http://localhost:3000/api/auth/reset-password
```

### **JSON Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPassword123!"
}
```

### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### **❌ Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

---

## 📋 **Test Examples**

### **Register Admin:**
```json
{
  "name": "Admin User",
  "email": "admin@school.com",
  "password": "Admin123!",
  "role": "Admin"
}
```

### **Register Teacher:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@school.com",
  "password": "Teacher123!",
  "role": "Teacher"
}
```

### **Register Student:**
```json
{
  "name": "Mike Johnson",
  "email": "mike.johnson@school.com",
  "password": "Student123!",
  "role": "Student"
}
```

---

## 🔧 **Postman Setup Instructions**

### **1. Create Environment Variables:**
- `base_url`: `http://localhost:3000`
- `access_token`: (will be set after login)
- `refresh_token`: (will be set after login)

### **2. Create Collection:**
1. Create a new collection called "LMS Authentication"
2. Add all the requests above
3. Set the base URL in collection variables

### **3. Test Flow:**
1. **Register** a new user
2. **Login** with the user credentials
3. **Get Profile** using the access token
4. **Refresh Token** when needed
5. **Logout** when done

### **4. Automate Token Setting:**
In the login response, add this test script:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.accessToken);
    pm.environment.set("refresh_token", response.data.refreshToken);
}
```

---

## 🗄️ **Database Stored Procedures Used**

### **Authentication:**
- `sp_RegisterUser` - Register new user
- `sp_LoginUser` - Login user and update last login
- `sp_GetUserByEmail` - Get user by email
- `sp_GetUserById` - Get user by ID

### **Password Reset:**
- `sp_StorePasswordResetToken` - Store reset token
- `sp_ValidatePasswordResetToken` - Validate reset token
- `sp_UpdatePassword` - Update user password
- `sp_ClearPasswordResetToken` - Clear used tokens

### **Password Change:**
- `sp_ChangePassword` - Change user password

---

## 🚀 **Quick Start**

1. **Start the server:** `npm run dev`
2. **Set up database:** Run `setup-database.sql`
3. **Import this guide** into Postman
4. **Test the endpoints** in order

Your authentication system is ready! 🎉
