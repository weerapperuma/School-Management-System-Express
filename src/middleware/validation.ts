import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CustomError, validationErrorHandler } from './errorHandler';

// Generic validation handler
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = validationErrorHandler(errors.array());
    next(error);
    return;
  }
  next();
};

// Authentication validation
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate
];

export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin'),
  validate
];

// Student validation
export const validateStudent = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('grade')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade must be between 1 and 12'),
  body('parentName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Parent name must be between 2 and 50 characters'),
  body('parentPhone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  validate
];

export const validateStudentUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('grade')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade must be between 1 and 12'),
  validate
];

// Teacher validation
export const validateTeacher = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('subject')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
  body('phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  validate
];

// Course validation
export const validateCourse = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course name must be between 2 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('credits')
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('grade')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade must be between 1 and 12'),
  validate
];

// Attendance validation
export const validateAttendance = [
  body('studentId')
    .isUUID()
    .withMessage('Please provide a valid student ID'),
  body('courseId')
    .isUUID()
    .withMessage('Please provide a valid course ID'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
  validate
];

// Grade validation
export const validateGrade = [
  body('studentId')
    .isUUID()
    .withMessage('Please provide a valid student ID'),
  body('courseId')
    .isUUID()
    .withMessage('Please provide a valid course ID'),
  body('examType')
    .isIn(['midterm', 'final', 'quiz', 'assignment', 'project'])
    .withMessage('Exam type must be midterm, final, quiz, assignment, or project'),
  body('score')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
  body('maxScore')
    .isFloat({ min: 1 })
    .withMessage('Maximum score must be at least 1'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  validate
];

// ID parameter validation
export const validateId = [
  param('id')
    .isUUID()
    .withMessage('Please provide a valid ID'),
  validate
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
];

// Search validation
export const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  validate
];

// Date range validation
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  validate
];
