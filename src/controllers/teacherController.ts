import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql';
import { executeStoredProcedure } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const teacherController = {
  // Get all teachers with pagination and search
  getAllTeachers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      const result = await executeStoredProcedure('sp_GetAllTeachers', [
        { name: 'Page', type: sql.Int, value: page },
        { name: 'Limit', type: sql.Int, value: limit },
        { name: 'Search', type: sql.NVarChar, value: search },
        { name: 'Offset', type: sql.Int, value: offset }
      ]);

      const teachers = result.recordset || [];
      const totalCount = result.output?.TotalCount || 0;

      res.status(200).json({
        success: true,
        data: {
          teachers,
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

  // Get teacher by ID
  getTeacherById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetTeacherById', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('Teacher not found', 404);
      }

      const teacher = result.recordset[0];

      res.status(200).json({
        success: true,
        data: { teacher }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new teacher
  createTeacher: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, subject, phone, address } = req.body;

      const teacherId = uuidv4();

      // Check if teacher with email already exists
      const existingTeacher = await executeStoredProcedure('sp_GetTeacherByEmail', [
        { name: 'Email', type: sql.VarChar, value: email }
      ]);

      if (existingTeacher.recordset && existingTeacher.recordset.length > 0) {
        throw new CustomError('Teacher with this email already exists', 400);
      }

      // Create teacher
      await executeStoredProcedure('sp_CreateTeacher', [
        { name: 'Id', type: sql.UniqueIdentifier, value: teacherId },
        { name: 'Name', type: sql.NVarChar, value: name },
        { name: 'Email', type: sql.VarChar, value: email },
        { name: 'Subject', type: sql.NVarChar, value: subject },
        { name: 'Phone', type: sql.VarChar, value: phone },
        { name: 'Address', type: sql.NVarChar, value: address || null }
      ]);

      // Get created teacher
      const result = await executeStoredProcedure('sp_GetTeacherById', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: teacherId }
      ]);

      const teacher = result.recordset[0];

      logger.info(`New teacher created: ${teacher.Name} (${teacher.Email})`);

      res.status(201).json({
        success: true,
        data: { teacher }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update teacher
  updateTeacher: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if teacher exists
      const existingTeacher = await executeStoredProcedure('sp_GetTeacherById', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingTeacher.recordset || existingTeacher.recordset.length === 0) {
        throw new CustomError('Teacher not found', 404);
      }

      // Update teacher
      await executeStoredProcedure('sp_UpdateTeacher', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id },
        { name: 'Name', type: sql.NVarChar, value: updateData.name },
        { name: 'Email', type: sql.VarChar, value: updateData.email },
        { name: 'Subject', type: sql.NVarChar, value: updateData.subject },
        { name: 'Phone', type: sql.VarChar, value: updateData.phone },
        { name: 'Address', type: sql.NVarChar, value: updateData.address }
      ]);

      // Get updated teacher
      const result = await executeStoredProcedure('sp_GetTeacherById', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id }
      ]);

      const teacher = result.recordset[0];

      logger.info(`Teacher updated: ${teacher.Name} (${teacher.Email})`);

      res.status(200).json({
        success: true,
        data: { teacher }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete teacher
  deleteTeacher: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if teacher exists
      const existingTeacher = await executeStoredProcedure('sp_GetTeacherById', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingTeacher.recordset || existingTeacher.recordset.length === 0) {
        throw new CustomError('Teacher not found', 404);
      }

      // Soft delete teacher
      await executeStoredProcedure('sp_DeleteTeacher', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`Teacher deleted: ${existingTeacher.recordset[0].Name} (${existingTeacher.recordset[0].Email})`);

      res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get teacher courses
  getTeacherCourses: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetTeacherCourses', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id }
      ]);

      const courses = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { courses }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get teacher classes
  getTeacherClasses: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetTeacherClasses', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id }
      ]);

      const classes = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { classes }
      });
    } catch (error) {
      next(error);
    }
  },

  // Assign course to teacher
  assignCourse: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { courseId } = req.body;

      await executeStoredProcedure('sp_AssignCourseToTeacher', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId }
      ]);

      logger.info(`Course ${courseId} assigned to teacher ${id}`);

      res.status(200).json({
        success: true,
        message: 'Course assigned successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Unassign course from teacher
  unassignCourse: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, courseId } = req.params;

      await executeStoredProcedure('sp_UnassignCourseFromTeacher', [
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: id },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId }
      ]);

      logger.info(`Course ${courseId} unassigned from teacher ${id}`);

      res.status(200).json({
        success: true,
        message: 'Course unassigned successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
