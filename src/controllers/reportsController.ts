import { Request, Response, NextFunction } from 'express';
import sql from 'mssql';
import { executeStoredProcedure } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const reportsController = {
  // Get dashboard overview
  getDashboardOverview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await executeStoredProcedure('sp_GetDashboardOverview');

      const overview = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { overview }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student dashboard
  getStudentDashboard: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;

      const result = await executeStoredProcedure('sp_GetStudentDashboard', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId }
      ]);

      const dashboard = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { dashboard }
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

  // Get student attendance report
  getStudentAttendanceReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      const result = await executeStoredProcedure('sp_GetStudentAttendanceReport', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null }
      ]);

      const report = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { report }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get course attendance report
  getCourseAttendanceReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { startDate, endDate } = req.query;

      const result = await executeStoredProcedure('sp_GetCourseAttendanceReport', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null }
      ]);

      const report = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { report }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get grades summary
  getGradesSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, courseId } = req.query;

      const result = await executeStoredProcedure('sp_GetGradesSummary', [
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

  // Get student grades report
  getStudentGradesReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      const result = await executeStoredProcedure('sp_GetStudentGradesReport', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null }
      ]);

      const report = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { report }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get course grades report
  getCourseGradesReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { startDate, endDate } = req.query;

      const result = await executeStoredProcedure('sp_GetCourseGradesReport', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null }
      ]);

      const report = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { report }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get GPA analysis
  getGPAAnalysis: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await executeStoredProcedure('sp_GetGPAAnalysis');

      const analysis = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { analysis }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student performance
  getStudentPerformance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;

      const result = await executeStoredProcedure('sp_GetStudentPerformance', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId }
      ]);

      const performance = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { performance }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get course performance
  getCoursePerformance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;

      const result = await executeStoredProcedure('sp_GetCoursePerformance', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId }
      ]);

      const performance = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { performance }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get performance comparison
  getPerformanceComparison: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId, examType } = req.query;

      const result = await executeStoredProcedure('sp_GetPerformanceComparison', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null },
        { name: 'ExamType', type: sql.VarChar, value: examType || null }
      ]);

      const comparison = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { comparison }
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
  },

  // Export grades report
  exportGradesReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, courseId } = req.query;

      const result = await executeStoredProcedure('sp_ExportGradesReport', [
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null }
      ]);

      const grades = result.recordset || [];

      // Convert to CSV format
      const csvHeaders = 'StudentName,CourseName,ExamType,Score,MaxScore,Percentage,Grade,Date,Remarks\n';
      const csvData = grades.map(record => 
        `"${record.StudentName}","${record.CourseName}","${record.ExamType}","${record.Score}","${record.MaxScore}","${record.Percentage}","${record.Grade}","${record.Date}","${record.Remarks || ''}"`
      ).join('\n');

      const csvContent = csvHeaders + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=grades_report.csv');
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  },

  // Export performance report
  exportPerformanceReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const result = await executeStoredProcedure('sp_ExportPerformanceReport', [
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null }
      ]);

      const performance = result.recordset || [];

      // Convert to CSV format
      const csvHeaders = 'StudentName,CourseName,GPA,AttendancePercentage,OverallGrade\n';
      const csvData = performance.map(record => 
        `"${record.StudentName}","${record.CourseName}","${record.GPA}","${record.AttendancePercentage}","${record.OverallGrade}"`
      ).join('\n');

      const csvContent = csvHeaders + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=performance_report.csv');
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
};
