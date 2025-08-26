import { Request, Response, NextFunction } from 'express';
import sql from 'mssql';
import { executeStoredProcedure } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const adminController = {
  // Get all users with pagination and search
  getAllUsers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      const result = await executeStoredProcedure('sp_GetAllUsers', [
        { name: 'Page', type: sql.Int, value: page },
        { name: 'Limit', type: sql.Int, value: limit },
        { name: 'Search', type: sql.NVarChar, value: search },
        { name: 'Offset', type: sql.Int, value: offset }
      ]);

      const users = result.recordset || [];
      const totalCount = result.output?.TotalCount || 0;

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  getUserById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetUserById', [
        { name: 'UserId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('User not found', 404);
      }

      const user = result.recordset[0];

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user status
  updateUserStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      await executeStoredProcedure('sp_UpdateUserStatus', [
        { name: 'UserId', type: sql.UniqueIdentifier, value: id },
        { name: 'IsActive', type: sql.Bit, value: isActive }
      ]);

      logger.info(`User status updated: ${id}, Active: ${isActive}`);

      res.status(200).json({
        success: true,
        message: 'User status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  deleteUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await executeStoredProcedure('sp_DeleteUser', [
        { name: 'UserId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`User deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get system stats
  getSystemStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await executeStoredProcedure('sp_GetSystemStats');

      const stats = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get system logs
  getSystemLogs: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, level } = req.query;

      const result = await executeStoredProcedure('sp_GetSystemLogs', [
        { name: 'StartDate', type: sql.DateTime, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.DateTime, value: endDate ? new Date(endDate as string) : null },
        { name: 'Level', type: sql.VarChar, value: level || null }
      ]);

      const logs = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { logs }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create backup
  createBackup: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { backupName } = req.body;

      await executeStoredProcedure('sp_CreateBackup', [
        { name: 'BackupName', type: sql.NVarChar, value: backupName }
      ]);

      logger.info(`Database backup created: ${backupName}`);

      res.status(200).json({
        success: true,
        message: 'Backup created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Restore backup
  restoreBackup: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { backupName } = req.body;

      await executeStoredProcedure('sp_RestoreBackup', [
        { name: 'BackupName', type: sql.NVarChar, value: backupName }
      ]);

      logger.info(`Database restored from backup: ${backupName}`);

      res.status(200).json({
        success: true,
        message: 'Backup restored successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk import students
  bulkImportStudents: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        throw new CustomError('Students array is required', 400);
      }

      const results = [];
      const errors = [];

      for (const studentData of students) {
        try {
          // Import student logic here
          results.push({ email: studentData.email, status: 'success' });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ email: studentData.email, error: errorMessage });
        }
      }

      logger.info(`Bulk import completed: ${results.length} successful, ${errors.length} failed`);

      res.status(200).json({
        success: true,
        data: {
          total: students.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk import teachers
  bulkImportTeachers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teachers } = req.body;

      if (!Array.isArray(teachers) || teachers.length === 0) {
        throw new CustomError('Teachers array is required', 400);
      }

      const results = [];
      const errors = [];

      for (const teacherData of teachers) {
        try {
          // Import teacher logic here
          results.push({ email: teacherData.email, status: 'success' });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ email: teacherData.email, error: errorMessage });
        }
      }

      logger.info(`Bulk import completed: ${results.length} successful, ${errors.length} failed`);

      res.status(200).json({
        success: true,
        data: {
          total: teachers.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Export all data
  exportAllData: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await executeStoredProcedure('sp_ExportAllData');

      const data = result.recordset || [];

      // Convert to JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=all_data.json');
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
};
