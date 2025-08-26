import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql';
import { executeStoredProcedure } from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  // Login user
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      // First, get the user by email to check if they exist
      const userResult = await executeStoredProcedure('sp_GetUserByEmail', [
        { name: 'Email', type: sql.NVarChar, value: email }
      ]);

      if (!userResult.recordset || userResult.recordset.length === 0) {
        throw new CustomError('Invalid credentials', 401);
      }

      const user = userResult.recordset[0];

      // Check if account is active (if IsActive column exists)
      if (user.IsActive === false) {
        throw new CustomError('Account is deactivated', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
      if (!isPasswordValid) {
        throw new CustomError('Invalid credentials', 401);
      }

      // Update last login
      await executeStoredProcedure('sp_UpdateLastLogin', [
        { name: 'UserID', type: sql.Int, value: user.UserID }
      ]);

      // Generate tokens
      const accessToken = jwt.sign(
        {
          id: user.UserID,
          email: user.Email,
          role: user.Role,
          name: user.FullName
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
      );

      const refreshToken = jwt.sign(
        { id: user.UserID },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any
      );

      logger.info(`User ${user.Email} logged in successfully`);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.UserID,
            name: user.FullName,
            email: user.Email,
            role: user.Role
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Register new user
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await executeStoredProcedure('sp_GetUserByEmail', [
        { name: 'Email', type: sql.NVarChar, value: email }
      ]);

      if (existingUser.recordset && existingUser.recordset.length > 0) {
        throw new CustomError('User already exists with this email', 400);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const userId = uuidv4();

      // Execute stored procedure to create user
      await executeStoredProcedure('sp_RegisterUser', [
        { name: 'FullName', type: sql.NVarChar, value: name },
        { name: 'Email', type: sql.NVarChar, value: email },
        { name: 'PasswordHash', type: sql.NVarChar, value: hashedPassword },
        { name: 'Role', type: sql.NVarChar, value: role }
      ]);

      // Get the created user to get the actual UserID
      const createdUser = await executeStoredProcedure('sp_GetUserByEmail', [
        { name: 'Email', type: sql.NVarChar, value: email }
      ]);

      const user = createdUser.recordset[0];

      // Generate tokens
      const accessToken = jwt.sign(
        {
          id: user.UserID,
          email,
          role,
          name
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
      );

      const refreshToken = jwt.sign(
        { id: user.UserID },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any
      );

      logger.info(`New user registered: ${email} with role: ${role}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.UserID,
            name,
            email,
            role
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Refresh access token
  refreshToken: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new CustomError('Refresh token is required', 400);
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

      // Get user from database
      const result = await executeStoredProcedure('sp_GetUserById', [
        { name: 'UserID', type: sql.Int, value: decoded.id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('User not found', 404);
      }

      const user = result.recordset[0];

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user.UserID,
          email: user.Email,
          role: user.Role,
          name: user.FullName
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
      );

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout user
  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success response
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  getProfile: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const result = await executeStoredProcedure('sp_GetUserById', [
        { name: 'UserID', type: sql.Int, value: req.user.id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('User not found', 404);
      }

      const user = result.recordset[0];

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.UserID,
            name: user.FullName,
            email: user.Email,
            role: user.Role,
            createdAt: user.CreatedAt,
            lastLogin: user.LastLogin
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Forgot password
  forgotPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      // Check if user exists
      const result = await executeStoredProcedure('sp_GetUserByEmail', [
        { name: 'Email', type: sql.VarChar, value: email }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        // Don't reveal if user exists or not
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        });
        return;
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Store reset token in database
      await executeStoredProcedure('sp_StorePasswordResetToken', [
        { name: 'Email', type: sql.VarChar, value: email },
        { name: 'ResetToken', type: sql.VarChar, value: resetToken },
        { name: 'ExpiresAt', type: sql.DateTime, value: new Date(Date.now() + 3600000) }
      ]);

      // In a real application, send email with reset link
      logger.info(`Password reset requested for: ${email}`);

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      next(error);
    }
  },

  // Reset password
  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Check if reset token is valid and not expired
      const result = await executeStoredProcedure('sp_ValidatePasswordResetToken', [
        { name: 'Email', type: sql.VarChar, value: decoded.email },
        { name: 'ResetToken', type: sql.VarChar, value: token }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('Invalid or expired reset token', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await executeStoredProcedure('sp_UpdatePassword', [
        { name: 'Email', type: sql.VarChar, value: decoded.email },
        { name: 'NewPassword', type: sql.VarChar, value: hashedPassword }
      ]);

      // Clear reset token
      await executeStoredProcedure('sp_ClearPasswordResetToken', [
        { name: 'Email', type: sql.VarChar, value: decoded.email }
      ]);

      logger.info(`Password reset successful for: ${decoded.email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
