import express from 'express';
import { courseController } from '../controllers/courseController';
import { authenticate, requireAdmin, requireTeacherOrAdmin } from '../middleware/auth';
import { 
  validateCourse, 
  validateId, 
  validatePagination, 
  validateSearch 
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Course routes
router.get('/', requireTeacherOrAdmin, validatePagination, validateSearch, courseController.getAllCourses);
router.get('/:id', requireTeacherOrAdmin, validateId, courseController.getCourseById);
router.post('/', requireAdmin, validateCourse, courseController.createCourse);
router.put('/:id', requireAdmin, validateId, validateCourse, courseController.updateCourse);
router.delete('/:id', requireAdmin, validateId, courseController.deleteCourse);

// Course-specific routes
router.get('/:id/students', requireTeacherOrAdmin, validateId, courseController.getCourseStudents);
router.get('/:id/attendance', requireTeacherOrAdmin, validateId, courseController.getCourseAttendance);
router.get('/:id/grades', requireTeacherOrAdmin, validateId, courseController.getCourseGrades);
router.post('/:id/enroll-student', requireAdmin, validateId, courseController.enrollStudent);
router.delete('/:id/unenroll-student/:studentId', requireAdmin, validateId, courseController.unenrollStudent);

// Subject routes
router.get('/subjects/all', requireTeacherOrAdmin, courseController.getAllSubjects);
router.post('/subjects', requireAdmin, courseController.createSubject);
router.put('/subjects/:id', requireAdmin, validateId, courseController.updateSubject);
router.delete('/subjects/:id', requireAdmin, validateId, courseController.deleteSubject);

// Class/Section routes
router.get('/classes/all', requireTeacherOrAdmin, courseController.getAllClasses);
router.post('/classes', requireAdmin, courseController.createClass);
router.put('/classes/:id', requireAdmin, validateId, courseController.updateClass);
router.delete('/classes/:id', requireAdmin, validateId, courseController.deleteClass);

export default router;
