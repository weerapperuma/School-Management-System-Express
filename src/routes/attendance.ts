import express from 'express';
import { attendanceController } from '../controllers/attendanceController';
import { authenticate, requireTeacherOrAdmin } from '../middleware/auth';
import { 
  validateAttendance, 
  validateId, 
  validateDateRange 
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Attendance routes
router.get('/', requireTeacherOrAdmin, validateDateRange, attendanceController.getAttendance);
router.get('/:id', requireTeacherOrAdmin, validateId, attendanceController.getAttendanceById);
router.post('/', requireTeacherOrAdmin, validateAttendance, attendanceController.markAttendance);
router.put('/:id', requireTeacherOrAdmin, validateId, validateAttendance, attendanceController.updateAttendance);
router.delete('/:id', requireTeacherOrAdmin, validateId, attendanceController.deleteAttendance);

// Bulk attendance operations
router.post('/bulk', requireTeacherOrAdmin, attendanceController.markBulkAttendance);
router.get('/course/:courseId', requireTeacherOrAdmin, validateId, attendanceController.getCourseAttendance);
router.get('/student/:studentId', requireTeacherOrAdmin, validateId, attendanceController.getStudentAttendance);

// Attendance reports
router.get('/reports/summary', requireTeacherOrAdmin, attendanceController.getAttendanceSummary);
router.get('/reports/export', requireTeacherOrAdmin, attendanceController.exportAttendanceReport);

export default router;
