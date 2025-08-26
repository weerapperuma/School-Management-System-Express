import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql';
import { executeStoredProcedure } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const courseController = {
  // Get all courses with pagination and search
  getAllCourses: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      const result = await executeStoredProcedure('sp_GetAllCourses', [
        { name: 'Page', type: sql.Int, value: page },
        { name: 'Limit', type: sql.Int, value: limit },
        { name: 'Search', type: sql.NVarChar, value: search },
        { name: 'Offset', type: sql.Int, value: offset }
      ]);

      const courses = result.recordset || [];
      const totalCount = result.output?.TotalCount || 0;

      res.status(200).json({
        success: true,
        data: {
          courses,
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

  // Get course by ID
  getCourseById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetCourseById', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      const course = result.recordset[0];

      res.status(200).json({
        success: true,
        data: { course }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new course
  createCourse: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        name,
        code,
        description,
        credits,
        grade,
        subjectId,
        teacherId,
        maxStudents
      } = req.body;

      const courseId = uuidv4();

      // Check if course with code already exists
      const existingCourse = await executeStoredProcedure('sp_GetCourseByCode', [
        { name: 'Code', type: sql.VarChar, value: code }
      ]);

      if (existingCourse.recordset && existingCourse.recordset.length > 0) {
        throw new CustomError('Course with this code already exists', 400);
      }

      // Create course
      await executeStoredProcedure('sp_CreateCourse', [
        { name: 'Id', type: sql.UniqueIdentifier, value: courseId },
        { name: 'Name', type: sql.NVarChar, value: name },
        { name: 'Code', type: sql.VarChar, value: code },
        { name: 'Description', type: sql.NVarChar, value: description || null },
        { name: 'Credits', type: sql.Int, value: credits },
        { name: 'Grade', type: sql.Int, value: grade },
        { name: 'SubjectId', type: sql.UniqueIdentifier, value: subjectId },
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: teacherId },
        { name: 'MaxStudents', type: sql.Int, value: maxStudents || null }
      ]);

      // Get created course
      const result = await executeStoredProcedure('sp_GetCourseById', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: courseId }
      ]);

      const course = result.recordset[0];

      logger.info(`New course created: ${course.Name} (${course.Code})`);

      res.status(201).json({
        success: true,
        data: { course }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update course
  updateCourse: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if course exists
      const existingCourse = await executeStoredProcedure('sp_GetCourseById', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingCourse.recordset || existingCourse.recordset.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      // Update course
      await executeStoredProcedure('sp_UpdateCourse', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id },
        { name: 'Name', type: sql.NVarChar, value: updateData.name },
        { name: 'Code', type: sql.VarChar, value: updateData.code },
        { name: 'Description', type: sql.NVarChar, value: updateData.description },
        { name: 'Credits', type: sql.Int, value: updateData.credits },
        { name: 'Grade', type: sql.Int, value: updateData.grade },
        { name: 'SubjectId', type: sql.UniqueIdentifier, value: updateData.subjectId },
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: updateData.teacherId },
        { name: 'MaxStudents', type: sql.Int, value: updateData.maxStudents }
      ]);

      // Get updated course
      const result = await executeStoredProcedure('sp_GetCourseById', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id }
      ]);

      const course = result.recordset[0];

      logger.info(`Course updated: ${course.Name} (${course.Code})`);

      res.status(200).json({
        success: true,
        data: { course }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete course
  deleteCourse: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if course exists
      const existingCourse = await executeStoredProcedure('sp_GetCourseById', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id }
      ]);

      if (!existingCourse.recordset || existingCourse.recordset.length === 0) {
        throw new CustomError('Course not found', 404);
      }

      // Soft delete course
      await executeStoredProcedure('sp_DeleteCourse', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`Course deleted: ${existingCourse.recordset[0].Name} (${existingCourse.recordset[0].Code})`);

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get course students
  getCourseStudents: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await executeStoredProcedure('sp_GetCourseStudents', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id }
      ]);

      const students = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { students }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get course attendance
  getCourseAttendance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { date } = req.query;

      const result = await executeStoredProcedure('sp_GetCourseAttendance', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id },
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

  // Get course grades
  getCourseGrades: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { examType } = req.query;

      const result = await executeStoredProcedure('sp_GetCourseGrades', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id },
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

  // Enroll student in course
  enrollStudent: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { studentId } = req.body;

      // Check if student is already enrolled
      const existingEnrollment = await executeStoredProcedure('sp_CheckStudentEnrollment', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id },
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId }
      ]);

      if (existingEnrollment.recordset && existingEnrollment.recordset.length > 0) {
        throw new CustomError('Student is already enrolled in this course', 400);
      }

      // Enroll student
      await executeStoredProcedure('sp_EnrollStudent', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id },
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId }
      ]);

      logger.info(`Student ${studentId} enrolled in course ${id}`);

      res.status(200).json({
        success: true,
        message: 'Student enrolled successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Unenroll student from course
  unenrollStudent: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, studentId } = req.params;

      // Unenroll student
      await executeStoredProcedure('sp_UnenrollStudent', [
        { name: 'CourseId', type: sql.UniqueIdentifier, value: id },
        { name: 'StudentId', type: sql.UniqueIdentifier, value: studentId }
      ]);

      logger.info(`Student ${studentId} unenrolled from course ${id}`);

      res.status(200).json({
        success: true,
        message: 'Student unenrolled successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all subjects
  getAllSubjects: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await executeStoredProcedure('sp_GetAllSubjects');

      const subjects = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { subjects }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create subject
  createSubject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, code, description } = req.body;

      const subjectId = uuidv4();

      await executeStoredProcedure('sp_CreateSubject', [
        { name: 'Id', type: sql.UniqueIdentifier, value: subjectId },
        { name: 'Name', type: sql.NVarChar, value: name },
        { name: 'Code', type: sql.VarChar, value: code },
        { name: 'Description', type: sql.NVarChar, value: description || null }
      ]);

      logger.info(`New subject created: ${name} (${code})`);

      res.status(201).json({
        success: true,
        message: 'Subject created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Update subject
  updateSubject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      await executeStoredProcedure('sp_UpdateSubject', [
        { name: 'SubjectId', type: sql.UniqueIdentifier, value: id },
        { name: 'Name', type: sql.NVarChar, value: updateData.name },
        { name: 'Code', type: sql.VarChar, value: updateData.code },
        { name: 'Description', type: sql.NVarChar, value: updateData.description }
      ]);

      logger.info(`Subject updated: ${updateData.name} (${updateData.code})`);

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete subject
  deleteSubject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await executeStoredProcedure('sp_DeleteSubject', [
        { name: 'SubjectId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`Subject deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all classes
  getAllClasses: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await executeStoredProcedure('sp_GetAllClasses');

      const classes = result.recordset || [];

      res.status(200).json({
        success: true,
        data: { classes }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create class
  createClass: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, grade, section, capacity, teacherId } = req.body;

      const classId = uuidv4();

      await executeStoredProcedure('sp_CreateClass', [
        { name: 'Id', type: sql.UniqueIdentifier, value: classId },
        { name: 'Name', type: sql.NVarChar, value: name },
        { name: 'Grade', type: sql.Int, value: grade },
        { name: 'Section', type: sql.VarChar, value: section },
        { name: 'Capacity', type: sql.Int, value: capacity },
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: teacherId }
      ]);

      logger.info(`New class created: ${name} (Grade ${grade}-${section})`);

      res.status(201).json({
        success: true,
        message: 'Class created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Update class
  updateClass: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      await executeStoredProcedure('sp_UpdateClass', [
        { name: 'ClassId', type: sql.UniqueIdentifier, value: id },
        { name: 'Name', type: sql.NVarChar, value: updateData.name },
        { name: 'Grade', type: sql.Int, value: updateData.grade },
        { name: 'Section', type: sql.VarChar, value: updateData.section },
        { name: 'Capacity', type: sql.Int, value: updateData.capacity },
        { name: 'TeacherId', type: sql.UniqueIdentifier, value: updateData.teacherId }
      ]);

      logger.info(`Class updated: ${updateData.name} (Grade ${updateData.grade}-${updateData.section})`);

      res.status(200).json({
        success: true,
        message: 'Class updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete class
  deleteClass: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await executeStoredProcedure('sp_DeleteClass', [
        { name: 'ClassId', type: sql.UniqueIdentifier, value: id }
      ]);

      logger.info(`Class deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Class deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
