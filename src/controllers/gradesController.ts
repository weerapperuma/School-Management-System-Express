import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql';
import { executeStoredProcedure } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const gradesController = {
  // Get all grades with filters
  getAllGrades: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId, courseId, examType, startDate, endDate } = req.query;

      const result = await executeStoredProcedure('sp_GetAllGrades', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId || null },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null },
        { name: 'ExamType', type: sql.VarChar, value: examType || null },
        { name: 'StartDate', type: sql.Date, value: startDate ? new Date(startDate as string) : null },
        { name: 'EndDate', type: sql.Date, value: endDate ? new Date(endDate as string) : null }
      ]);

      const grades = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { grades }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get grade by ID
  getGradeById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetGradeById', [
        { name: 'GradeId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('Grade record not found', 404);
      }

      const grade = result.recordset[0];

      res.status(200).json({
        success: true,
        data: { grade }
      });
    } catch (error) {
      next(error);
    }
  },

  // Add a grade
  addGrade: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId, courseId, examType, score, maxScore, date, remarks } = req.body;
      const teacherId = (req as AuthRequest).user?.id;

      const gradeId = uuidv4();

      // Check if grade already exists for this student, course, exam type, and date
      const existingGrade = await executeStoredProcedure('sp_CheckGradeExists', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'ExamType', type: sql.VarChar, value: examType },
        { name: 'Date', type: sql.Date, value: new Date(date) }
      ]);

      if (existingGrade.recordset && existingGrade.recordset.length > 0) {
        throw new CustomError('Grade already exists for this student, course, exam type, and date', 400);
      }

      // Add grade
      await executeStoredProcedure('sp_AddGrade', [
        { name: 'Id', type: sql.UniqueIdentifier, value: gradeId },
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'ExamType', type: sql.VarChar, value: examType },
        { name: 'Score', type: sql.Decimal, value: score },
        { name: 'MaxScore', type: sql.Decimal, value: maxScore },
        { name: 'Date', type: sql.Date, value: new Date(date) },
        { name: 'Remarks', type: sql.NVarChar, value: remarks || null }
      ]);

      logger.info(`Grade added: Student ${studentId}, Course ${courseId}, Exam ${examType}, Score ${score}/${maxScore}`);

      res.status(201).json({
        success: true,
        message: 'Grade added successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Update grade
  updateGrade: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { score, maxScore, remarks } = req.body;

      // Check if grade exists
      const existingGrade = await executeStoredProcedure('sp_GetGradeById', [
        { name: 'GradeId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingGrade.recordset || existingGrade.recordset.length === 0) {
        throw new CustomError('Grade record not found', 404);
      }

      // Update grade
      await executeStoredProcedure('sp_UpdateGrade', [
        { name: 'GradeId', type: sql.UniqueIdentifier, value: id },
        { name: 'Score', type: sql.Decimal, value: score },
        { name: 'MaxScore', type: sql.Decimal, value: maxScore },
        { name: 'Remarks', type: sql.NVarChar, value: remarks || null }
      ]);

      logger.info(`Grade updated: ${id}, Score ${score}/${maxScore}`);

      res.status(200).json({
        success: true,
        message: 'Grade updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete grade
  deleteGrade: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if grade exists
      const existingGrade = await executeStoredProcedure('sp_GetGradeById', [
        { name: 'GradeId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingGrade.recordset || existingGrade.recordset.length === 0) {
        throw new CustomError('Grade record not found', 404);
      }

      // Delete grade
      await executeStoredProcedure('sp_DeleteGrade', [
        { name: 'GradeId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`Grade deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Grade deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Add bulk grades
  addBulkGrades: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId, examType, maxScore, date, gradesData } = req.body;
      const teacherId = (req as AuthRequest).user?.id;

      if (!Array.isArray(gradesData) || gradesData.length === 0) {
        throw new CustomError('Grades data array is required', 400);
      }

      const results = [];
      const errors = [];

      for (const record of gradesData) {
        try {
          const gradeId = uuidv4();

          // Check if grade already exists
          const existingGrade = await executeStoredProcedure('sp_CheckGradeExists', [
            { name: 'StudentId', type: sql.UniqueIdentifier, value: record.studentId },
            { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
            { name: 'ExamType', type: sql.VarChar, value: examType },
            { name: 'Date', type: sql.Date, value: new Date(date) }
          ]);

          if (existingGrade.recordset && existingGrade.recordset.length > 0) {
            // Update existing grade
            await executeStoredProcedure('sp_UpdateGrade', [
              { name: 'GradeId', type: sql.UniqueIdentifier, value: existingGrade.recordset[0].Id },
              { name: 'Score', type: sql.Decimal, value: record.score },
              { name: 'MaxScore', type: sql.Decimal, value: maxScore },
              { name: 'Remarks', type: sql.NVarChar, value: record.remarks || null }
            ]);
          } else {
            // Create new grade
            await executeStoredProcedure('sp_AddGrade', [
              { name: 'Id', type: sql.UniqueIdentifier, value: gradeId },
              { name: 'StudentId', type: sql.UniqueIdentifier, value: record.studentId },
              { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
              { name: 'ExamType', type: sql.VarChar, value: examType },
              { name: 'Score', type: sql.Decimal, value: record.score },
              { name: 'MaxScore', type: sql.Decimal, value: maxScore },
              { name: 'Date', type: sql.Date, value: new Date(date) },
              { name: 'Remarks', type: sql.NVarChar, value: record.remarks || null }
            ]);
          }

          results.push({ studentId: record.studentId, status: 'success' });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ studentId: record.studentId, error: errorMessage });
        }
      }

      logger.info(`Bulk grades added: ${results.length} successful, ${errors.length} failed`);

      res.status(200).json({
        success: true,
        data: {
          total: gradesData.length,
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

  // Get course grades
  getCourseGrades: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId } = req.params;
      const { examType } = req.query;

      const result = await executeStoredProcedure('sp_GetCourseGrades', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId },
        { name: 'ExamType', type: sql.VarChar, value: examType || null }
      ]);

      const grades = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { grades }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student grades
  getStudentGrades: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { courseId, examType } = req.query;

      const result = await executeStoredProcedure('sp_GetStudentGrades', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId },
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId || null },
        { name: 'ExamType', type: sql.VarChar, value: examType || null }
      ]);

      const grades = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { grades }
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

  // Calculate GPA
  calculateGPA: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.query;

      const result = await executeStoredProcedure('sp_CalculateGPA', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId || null }
      ]);

      const gpa = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { gpa }
      });
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
  }
};
