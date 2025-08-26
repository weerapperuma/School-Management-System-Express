import express from 'express';
import { gradesController } from '../controllers/gradesController';
import { authenticate, requireTeacherOrAdmin } from '../middleware/auth';
import { 
  validateGrade, 
  validateId, 
  validateDateRange 
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Grades routes
router.get('/', requireTeacherOrAdmin, gradesController.getAllGrades);
router.get('/:id', requireTeacherOrAdmin, validateId, gradesController.getGradeById);
router.post('/', requireTeacherOrAdmin, validateGrade, gradesController.addGrade);
router.put('/:id', requireTeacherOrAdmin, validateId, validateGrade, gradesController.updateGrade);
router.delete('/:id', requireTeacherOrAdmin, validateId, gradesController.deleteGrade);

// Bulk grades operations
router.post('/bulk', requireTeacherOrAdmin, gradesController.addBulkGrades);
router.get('/course/:courseId', requireTeacherOrAdmin, validateId, gradesController.getCourseGrades);
router.get('/student/:studentId', requireTeacherOrAdmin, validateId, gradesController.getStudentGrades);

// Grade reports and analytics
router.get('/reports/summary', requireTeacherOrAdmin, gradesController.getGradesSummary);
router.get('/reports/gpa', requireTeacherOrAdmin, gradesController.calculateGPA);
router.get('/reports/export', requireTeacherOrAdmin, gradesController.exportGradesReport);

export default router;
