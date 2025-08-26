import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql';
import { executeStoredProcedure, executeQuery } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const studentController = {
  // Get all students with pagination and search
  getAllStudents: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      const result = await executeStoredProcedure('sp_GetAllStudents', [
        { name: 'Page', type: sql.Int, value: page },
        { name: 'Limit', type: sql.Int, value: limit },
        { name: 'Search', type: sql.NVarChar, value: search },
        { name: 'Offset', type: sql.Int, value: offset }
      ]);

      const students = result.recordset || [];
      const totalCount = result.output?.TotalCount || 0;

      res.status(200).json({
        success: true,
        data: {
          students,
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

  // Get student by ID
  getStudentById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetStudentById', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('Student not found', 404);
      }

      const student = result.recordset[0];

      res.status(200).json({
        success: true,
        data: { student }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new student
  createStudent: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        name,
        email,
        dateOfBirth,
        grade,
        parentName,
        parentPhone,
        address,
        emergencyContact
      } = req.body;

      const studentId = uuidv4();

      // Check if student with email already exists
      const existingStudent = await executeStoredProcedure('sp_GetStudentByEmail', [
        { name: 'Email', type: sql.VarChar, value: email }
      ]);

      if (existingStudent.recordset && existingStudent.recordset.length > 0) {
        throw new CustomError('Student with this email already exists', 400);
      }

      // Create student
      await executeStoredProcedure('sp_CreateStudent', [
        { name: 'Id', type: sql.UniqueIdentifier, value: studentId },
        { name: 'Name', type: sql.NVarChar, value: name },
        { name: 'Email', type: sql.VarChar, value: email },
        { name: 'DateOfBirth', type: sql.Date, value: new Date(dateOfBirth) },
        { name: 'Grade', type: sql.Int, value: grade },
        { name: 'ParentName', type: sql.NVarChar, value: parentName },
        { name: 'ParentPhone', type: sql.VarChar, value: parentPhone },
        { name: 'Address', type: sql.NVarChar, value: address || null },
        { name: 'EmergencyContact', type: sql.NVarChar, value: emergencyContact || null }
      ]);

      // Get created student
      const result = await executeStoredProcedure('sp_GetStudentById', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId }
      ]);

      const student = result.recordset[0];

      logger.info(`New student created: ${student.Name} (${student.Email})`);

      res.status(201).json({
        success: true,
        data: { student }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update student
  updateStudent: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if student exists
      const existingStudent = await executeStoredProcedure('sp_GetStudentById', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingStudent.recordset || existingStudent.recordset.length === 0) {
        throw new CustomError('Student not found', 404);
      }

      // Update student
      await executeStoredProcedure('sp_UpdateStudent', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id },
        { name: 'Name', type: sql.NVarChar, value: updateData.name },
        { name: 'Email', type: sql.VarChar, value: updateData.email },
        { name: 'DateOfBirth', type: sql.Date, value: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null },
        { name: 'Grade', type: sql.Int, value: updateData.grade },
        { name: 'ParentName', type: sql.NVarChar, value: updateData.parentName },
        { name: 'ParentPhone', type: sql.VarChar, value: updateData.parentPhone },
        { name: 'Address', type: sql.NVarChar, value: updateData.address },
        { name: 'EmergencyContact', type: sql.NVarChar, value: updateData.emergencyContact }
      ]);

      // Get updated student
      const result = await executeStoredProcedure('sp_GetStudentById', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id }
      ]);

      const student = result.recordset[0];

      logger.info(`Student updated: ${student.Name} (${student.Email})`);

      res.status(200).json({
        success: true,
        data: { student }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete student
  deleteStudent: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if student exists
      const existingStudent = await executeStoredProcedure('sp_GetStudentById', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingStudent.recordset || existingStudent.recordset.length === 0) {
        throw new CustomError('Student not found', 404);
      }

      // Soft delete student
      await executeStoredProcedure('sp_DeleteStudent', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`Student deleted: ${existingStudent.recordset[0].Name} (${existingStudent.recordset[0].Email})`);

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student attendance
  getStudentAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { startDate, endDate, courseId } = req.query;

      const result = await executeStoredProcedure('sp_GetStudentAttendance', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id },
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

  // Get student grades
  getStudentGrades: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { courseId, examType } = req.query;

      const result = await executeStoredProcedure('sp_GetStudentGrades', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id },
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

  // Get student reports
  getStudentReports: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetStudentReports', [
        { name: 'StudentId', type: sql.UniqueIdentifier, value: id }
      ]);

      const reports = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { reports }
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
          const studentId = uuidv4();
          
          await executeStoredProcedure('sp_CreateStudent', [
            { name: 'Id', type: sql.UniqueIdentifier, value: studentId },
            { name: 'Name', type: sql.NVarChar, value: studentData.name },
            { name: 'Email', type: sql.VarChar, value: studentData.email },
            { name: 'DateOfBirth', type: sql.Date, value: new Date(studentData.dateOfBirth) },
            { name: 'Grade', type: sql.Int, value: studentData.grade },
            { name: 'ParentName', type: sql.NVarChar, value: studentData.parentName },
            { name: 'ParentPhone', type: sql.VarChar, value: studentData.parentPhone },
            { name: 'Address', type: sql.NVarChar, value: studentData.address || null },
            { name: 'EmergencyContact', type: sql.NVarChar, value: studentData.emergencyContact || null }
          ]);

          results.push({ email: studentData.email, status: 'success' });
        } catch (error) {
          errors.push({ email: studentData.email, error: error.message });
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

  // Export students to CSV
  exportStudentsCSV: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await executeStoredProcedure('sp_GetAllStudentsForExport');

      const students = result.recordset || [];

      // Convert to CSV format
      const csvHeaders = 'Name,Email,DateOfBirth,Grade,ParentName,ParentPhone,Address,EmergencyContact\n';
      const csvData = students.map(student => 
        `"${student.Name}","${student.Email}","${student.DateOfBirth}","${student.Grade}","${student.ParentName}","${student.ParentPhone}","${student.Address || ''}","${student.EmergencyContact || ''}"`
      ).join('\n');

      const csvContent = csvHeaders + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
};
