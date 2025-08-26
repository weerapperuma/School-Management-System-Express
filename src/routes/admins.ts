import express from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { 
  validateId, 
  validatePagination, 
  validateSearch 
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Admin routes
router.get('/users', requireAdmin, validatePagination, validateSearch, adminController.getAllUsers);
router.get('/users/:id', requireAdmin, validateId, adminController.getUserById);
router.put('/users/:id/status', requireAdmin, validateId, adminController.updateUserStatus);
router.delete('/users/:id', requireAdmin, validateId, adminController.deleteUser);

// System management
router.get('/system/stats', requireAdmin, adminController.getSystemStats);
router.get('/system/logs', requireAdmin, adminController.getSystemLogs);
router.post('/system/backup', requireAdmin, adminController.createBackup);
router.post('/system/restore', requireAdmin, adminController.restoreBackup);

// Bulk operations
router.post('/bulk/import-students', requireAdmin, adminController.bulkImportStudents);
router.post('/bulk/import-teachers', requireAdmin, adminController.bulkImportTeachers);
router.get('/export/all-data', requireAdmin, adminController.exportAllData);

export default router;
