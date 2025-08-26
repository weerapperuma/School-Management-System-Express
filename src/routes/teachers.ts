import express from 'express';
import { teacherController } from '../controllers/teacherController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { 
  validateTeacher, 
  validateId, 
  validatePagination, 
  validateSearch 
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Teacher routes
router.get('/', requireAdmin, validatePagination, validateSearch, teacherController.getAllTeachers);
router.get('/:id', requireAdmin, validateId, teacherController.getTeacherById);
router.post('/', requireAdmin, validateTeacher, teacherController.createTeacher);
router.put('/:id', requireAdmin, validateId, validateTeacher, teacherController.updateTeacher);
router.delete('/:id', requireAdmin, validateId, teacherController.deleteTeacher);

// Teacher-specific routes
router.get('/:id/courses', requireAdmin, validateId, teacherController.getTeacherCourses);
router.get('/:id/classes', requireAdmin, validateId, teacherController.getTeacherClasses);
router.post('/:id/assign-course', requireAdmin, validateId, teacherController.assignCourse);
router.delete('/:id/unassign-course/:courseId', requireAdmin, validateId, teacherController.unassignCourse);

export default router;
