import express from 'express';
import { studentController } from '../controllers/studentController';
import { authenticate, requireAdmin, requireTeacherOrAdmin } from '../middleware/auth';
import { 
  validateStudent, 
  validateStudentUpdate, 
  validateId, 
  validatePagination, 
  validateSearch 
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Student routes
router.get('/', requireTeacherOrAdmin, validatePagination, validateSearch, studentController.getAllStudents);
router.get('/:id', requireTeacherOrAdmin, validateId, studentController.getStudentById);
router.post('/', requireAdmin, validateStudent, studentController.createStudent);
router.put('/:id', requireAdmin, validateId, validateStudentUpdate, studentController.updateStudent);
router.delete('/:id', requireAdmin, validateId, studentController.deleteStudent);

// Student-specific routes
router.get('/:id/attendance', requireTeacherOrAdmin, validateId, studentController.getStudentAttendance);
router.get('/:id/grades', requireTeacherOrAdmin, validateId, studentController.getStudentGrades);
router.get('/:id/reports', requireTeacherOrAdmin, validateId, studentController.getStudentReports);

// Bulk operations
router.post('/bulk-import', requireAdmin, studentController.bulkImportStudents);
router.get('/export/csv', requireAdmin, studentController.exportStudentsCSV);

export default router;
