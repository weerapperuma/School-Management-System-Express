# School Management System Backend

A comprehensive school management system built with Express.js, TypeScript, and SQL Server. This system provides complete management of students, teachers, courses, attendance, grades, and reports.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Student, Teacher, Admin)
- Password reset functionality
- Secure password hashing with bcrypt

### 👥 User Management
- **Students**: Complete student profile management
- **Teachers**: Teacher profiles and course assignments
- **Admins**: System administration and user management

### 📚 Course Management
- Course creation and management
- Subject management
- Class/Section management
- Student enrollment in courses

### 📊 Attendance Tracking
- Daily attendance marking by teachers
- Bulk attendance operations
- Attendance reports and analytics
- Multiple attendance statuses (present, absent, late, excused)

### 📈 Grades Management
- Exam/test result upload
- Multiple exam types (midterm, final, quiz, assignment, project)
- Automatic grade calculation and GPA computation
- Grade reports and analytics

### 📋 Reports & Dashboards
- Student attendance reports
- Grade reports and GPA analysis
- Performance comparison reports
- Export functionality (CSV)
- Comprehensive dashboards

### 🗄️ Database
- SQL Server with stored procedures
- Optimized indexes for performance
- Data integrity constraints
- Automated triggers for data consistency

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQL Server
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v16 or higher)
- SQL Server (2019 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-management-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration (MSSQL)
   DB_SERVER=localhost
   DB_DATABASE=school_management
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_PORT=1433

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Database Setup**
   ```bash
   # Run the database schema
   sqlcmd -S localhost -U your_username -P your_password -i database/schema.sql
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login with email and password
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "student"
}
```

#### POST `/api/auth/refresh-token`
Refresh access token
```json
{
  "refreshToken": "your_refresh_token"
}
```

### Student Management

#### GET `/api/students`
Get all students with pagination
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string (optional)
```

#### POST `/api/students`
Create a new student
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "dateOfBirth": "2005-01-15",
  "grade": 10,
  "parentName": "Jane Doe",
  "parentPhone": "+1234567890",
  "address": "123 Main St",
  "emergencyContact": "Emergency Contact"
}
```

#### GET `/api/students/:id`
Get student by ID

#### PUT `/api/students/:id`
Update student information

#### DELETE `/api/students/:id`
Delete student (soft delete)

### Course Management

#### GET `/api/courses`
Get all courses with pagination

#### POST `/api/courses`
Create a new course
```json
{
  "name": "Advanced Mathematics",
  "code": "MATH101",
  "description": "Advanced mathematics course",
  "credits": 4,
  "grade": 10,
  "subjectId": "subject-uuid",
  "teacherId": "teacher-uuid",
  "maxStudents": 30
}
```

#### GET `/api/courses/:id/students`
Get students enrolled in a course

#### POST `/api/courses/:id/enroll-student`
Enroll a student in a course
```json
{
  "studentId": "student-uuid"
}
```

### Attendance Management

#### POST `/api/attendance`
Mark attendance for a student
```json
{
  "studentId": "student-uuid",
  "courseId": "course-uuid",
  "date": "2024-01-15",
  "status": "present",
  "remarks": "On time"
}
```

#### POST `/api/attendance/bulk`
Mark bulk attendance for multiple students
```json
{
  "courseId": "course-uuid",
  "date": "2024-01-15",
  "attendanceData": [
    {
      "studentId": "student-uuid-1",
      "status": "present",
      "remarks": "On time"
    },
    {
      "studentId": "student-uuid-2",
      "status": "absent",
      "remarks": "Sick"
    }
  ]
}
```

### Grades Management

#### POST `/api/grades`
Add a grade for a student
```json
{
  "studentId": "student-uuid",
  "courseId": "course-uuid",
  "examType": "midterm",
  "score": 85,
  "maxScore": 100,
  "date": "2024-01-15",
  "remarks": "Good performance"
}
```

#### POST `/api/grades/bulk`
Add bulk grades for multiple students
```json
{
  "courseId": "course-uuid",
  "examType": "midterm",
  "maxScore": 100,
  "date": "2024-01-15",
  "gradesData": [
    {
      "studentId": "student-uuid-1",
      "score": 85,
      "remarks": "Good performance"
    },
    {
      "studentId": "student-uuid-2",
      "score": 92,
      "remarks": "Excellent work"
    }
  ]
}
```

### Reports & Analytics

#### GET `/api/reports/dashboard/overview`
Get dashboard overview statistics

#### GET `/api/reports/attendance/summary`
Get attendance summary report
```
Query Parameters:
- startDate: string (YYYY-MM-DD)
- endDate: string (YYYY-MM-DD)
- courseId: string (optional)
```

#### GET `/api/reports/grades/summary`
Get grades summary report

#### GET `/api/reports/grades/gpa-analysis`
Get GPA analysis report

## Database Schema

The system uses the following main tables:

- **Users**: Authentication and user management
- **Students**: Student profiles and information
- **Teachers**: Teacher profiles and assignments
- **Subjects**: Subject definitions
- **Classes**: Class/section management
- **Courses**: Course definitions and assignments
- **CourseEnrollments**: Student-course relationships
- **Attendance**: Daily attendance records
- **Grades**: Exam and assignment grades
- **PasswordResetTokens**: Password reset functionality

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **SQL Injection Protection**: Parameterized queries with stored procedures

## Error Handling

The system includes comprehensive error handling:

- **Custom Error Classes**: Structured error responses
- **Validation Errors**: Detailed validation feedback
- **Database Errors**: Proper database error handling
- **Logging**: Winston-based logging for debugging

## Development

### Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Testing
npm test            # Run tests

# Linting
npm run lint        # Run ESLint
npm run lint:fix    # Fix linting issues
```

### Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── routes/          # API routes
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
