import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql';
import { executeStoredProcedure } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const attendanceController = {
  // Get attendance with filters
  getAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, courseId, studentId } = req.query;

      const result = await executeStoredProcedure('sp_GetAttendance', [
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null },
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId || null }
      ]);

      const attendance = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { attendance }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get attendance by ID
  getAttendanceById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetAttendanceById', [
        { name: 'AttendanceId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('Attendance record not found', 404);
      }

      const attendance = result.recordset[0];

      res.status(200).json({
        success: true,
        data: { attendance }
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark attendance for a student
  markAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId, courseId, date, status, remarks } = req.body;
      const teacherId = (req as AuthRequest).user?.id;

      const attendanceId = uuidv4();

      // Check if attendance already exists for this student, course, and date
      const existingAttendance = await executeStoredProcedure('sp_CheckAttendanceExists', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'Date', type: sql.Date, value: new Date(date) }
      ]);

      if (existingAttendance.recordset && existingAttendance.recordset.length > 0) {
        throw new CustomError('Attendance already marked for this student on this date', 400);
      }

      // Mark attendance
      await executeStoredProcedure('sp_MarkAttendance', [
        { name: 'Id', type: sql.UniqueIdentifier, value: attendanceId },
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: teacherId },
        { name: 'Date', type: sql.Date, value: new Date(date) },
        { name: 'Status', type: sql.VarChar, value: status },
        { name: 'Remarks', type: sql.NVarChar, value: remarks || null }
      ]);

      logger.info(`Attendance marked: Student ${studentId}, Course ${courseId}, Status ${status}`);

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Update attendance
  updateAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      // Check if attendance exists
      const existingAttendance = await executeStoredProcedure('sp_GetAttendanceById', [
        { name: 'AttendanceId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingAttendance.recordset || existingAttendance.recordset.length === 0) {
        throw new CustomError('Attendance record not found', 404);
      }

      // Update attendance
      await executeStoredProcedure('sp_UpdateAttendance', [
        { name: 'AttendanceId', type: sql.UniqueIdentifier, value: id },
        { name: 'Status', type: sql.VarChar, value: status },
        { name: 'Remarks', type: sql.NVarChar, value: remarks || null }
      ]);

      logger.info(`Attendance updated: ${id}, Status ${status}`);

      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete attendance
  deleteAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if attendance exists
      const existingAttendance = await executeStoredProcedure('sp_GetAttendanceById', [
        { name: 'AttendanceId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingAttendance.recordset || existingAttendance.recordset.length === 0) {
        throw new CustomError('Attendance record not found', 404);
      }

      // Delete attendance
      await executeStoredProcedure('sp_DeleteAttendance', [
        { name: 'AttendanceId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`Attendance deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Attendance deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark bulk attendance for multiple students
  markBulkAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId, date, attendanceData } = req.body;
      const teacherId = (req as AuthRequest).user?.id;

      if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        throw new CustomError('Attendance data array is required', 400);
      }

      const results = [];
      const errors = [];

      for (const record of attendanceData) {
        try {
          const attendanceId = uuidv4();

          // Check if attendance already exists
          const existingAttendance = await executeStoredProcedure('sp_CheckAttendanceExists', [
            { name: 'StudentId', type: sql.UniqueIdentifier, value: record.studentId },
            { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
            { name: 'Date', type: sql.Date, value: new Date(date) }
          ]);

          if (existingAttendance.recordset && existingAttendance.recordset.length > 0) {
            // Update existing attendance
            await executeStoredProcedure('sp_UpdateAttendance', [
              { name: 'AttendanceId', type: sql.UniqueIdentifier, value: existingAttendance.recordset[0].Id },
              { name: 'Status', type: sql.VarChar, value: record.status },
              { name: 'Remarks', type: sql.NVarChar, value: record.remarks || null }
            ]);
          } else {
            // Create new attendance
            await executeStoredProcedure('sp_MarkAttendance', [
              { name: 'Id', type: sql.UniqueIdentifier, value: attendanceId },
              { name: 'StudentId', type: sql.UniqueIdentifier, value: record.studentId },
              { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
              { name: 'TeacherId', type: sql.UniqueIdentifier, value: teacherId },
              { name: 'Date', type: sql.Date, value: new Date(date) },
              { name: 'Status', type: sql.VarChar, value: record.status },
              { name: 'Remarks', type: sql.NVarChar, value: record.remarks || null }
            ]);
          }

          results.push({ studentId: record.studentId, status: 'success' });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ studentId: record.studentId, error: errorMessage });
        }
      }

      logger.info(`Bulk attendance marked: ${results.length} successful, ${errors.length} failed`);

      res.status(200).json({
        success: true,
        data: {
          total: attendanceData.length,
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

  // Get course attendance
  getCourseAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { date } = req.query;

      const result = await executeStoredProcedure('sp_GetCourseAttendance', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'Date', type: sql.Date, value: date ? new Date(date as string) : new Date() }
      ]);

      const attendance = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { attendance }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student attendance
  getStudentAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, courseId } = req.query;

      const result = await executeStoredProcedure('sp_GetStudentAttendance', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null }
      ]);

      const attendance = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { attendance }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get attendance summary
  getAttendanceSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, courseId } = req.query;

      const result = await executeStoredProcedure('sp_GetAttendanceSummary', [
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null }
      ]);

      const summary = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      next(error);
    }
  },

  // Export attendance report
  exportAttendanceReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, courseId } = req.query;

      const result = await executeStoredProcedure('sp_ExportAttendanceReport', [
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null }
      ]);

      const attendance = result.recordset || [];

      // Convert to CSV format
      const csvHeaders = 'StudentName,CourseName,Date,Status,Remarks\n';
      const csvData = attendance.map(record => 
        `"${record.StudentName}","${record.CourseName}","${record.Date}","${record.Status}","${record.Remarks || ''}"`
      ).join('\n');

      const csvContent = csvHeaders + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
};
