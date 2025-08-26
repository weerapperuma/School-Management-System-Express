import express from 'express';
import { reportsController } from '../controllers/reportsController';
import { authenticate, requireTeacherOrAdmin } from '../middleware/auth';
import { 
  validateId, 
  validateDateRange 
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Dashboard routes
router.get('/dashboard/overview', requireTeacherOrAdmin, reportsController.getDashboardOverview);
router.get('/dashboard/student/:studentId', requireTeacherOrAdmin, validateId, reportsController.getStudentDashboard);

// Attendance reports
router.get('/attendance/summary', requireTeacherOrAdmin, validateDateRange, reportsController.getAttendanceSummary);
router.get('/attendance/student/:studentId', requireTeacherOrAdmin, validateId, reportsController.getStudentAttendanceReport);
router.get('/attendance/course/:courseId', requireTeacherOrAdmin, validateId, reportsController.getCourseAttendanceReport);

// Grade reports
router.get('/grades/summary', requireTeacherOrAdmin, validateDateRange, reportsController.getGradesSummary);
router.get('/grades/student/:studentId', requireTeacherOrAdmin, validateId, reportsController.getStudentGradesReport);
router.get('/grades/course/:courseId', requireTeacherOrAdmin, validateId, reportsController.getCourseGradesReport);
router.get('/grades/gpa-analysis', requireTeacherOrAdmin, reportsController.getGPAAnalysis);

// Performance reports
router.get('/performance/student/:studentId', requireTeacherOrAdmin, validateId, reportsController.getStudentPerformance);
router.get('/performance/course/:courseId', requireTeacherOrAdmin, validateId, reportsController.getCoursePerformance);
router.get('/performance/comparison', requireTeacherOrAdmin, reportsController.getPerformanceComparison);

// Export reports
router.get('/export/attendance', requireTeacherOrAdmin, reportsController.exportAttendanceReport);
router.get('/export/grades', requireTeacherOrAdmin, reportsController.exportGradesReport);
router.get('/export/performance', requireTeacherOrAdmin, reportsController.exportPerformanceReport);

export default router;
