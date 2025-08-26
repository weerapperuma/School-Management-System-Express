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

      // Execute stored procedure to get user
      const result = await executeStoredProcedure('sp_GetUserByEmail', [
        { name: 'Email', type: sql.VarChar, value: email }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('Invalid credentials', 401);
      }

      const user = result.recordset[0];

      // Check if user is active
      if (!user.IsActive) {
        throw new CustomError('Account is deactivated', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.Password);
      if (!isPasswordValid) {
        throw new CustomError('Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = jwt.sign(
        {
          id: user.Id,
          email: user.Email,
          role: user.Role,
          name: user.Name
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      const refreshToken = jwt.sign(
        { id: user.Id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Update last login
      await executeStoredProcedure('sp_UpdateLastLogin', [
        { name: 'UserId', type: sql.UniqueIdentifier, value: user.Id }
      ]);

      logger.info(`User ${user.Email} logged in successfully`);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.Id,
            name: user.Name,
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
        { name: 'Email', type: sql.VarChar, value: email }
      ]);

      if (existingUser.recordset && existingUser.recordset.length > 0) {
        throw new CustomError('User already exists with this email', 400);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const userId = uuidv4();

      // Execute stored procedure to create user
      await executeStoredProcedure('sp_CreateUser', [
        { name: 'Id', type: sql.UniqueIdentifier, value: userId },
        { name: 'Name', type: sql.NVarChar, value: name },
        { name: 'Email', type: sql.VarChar, value: email },
        { name: 'Password', type: sql.VarChar, value: hashedPassword },
        { name: 'Role', type: sql.VarChar, value: role }
      ]);

      // Generate tokens
      const accessToken = jwt.sign(
        {
          id: userId,
          email,
          role,
          name
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      logger.info(`New user registered: ${email} with role: ${role}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: userId,
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
        { name: 'UserId', type: sql.UniqueIdentifier, value: decoded.id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('User not found', 404);
      }

      const user = result.recordset[0];

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user.Id,
          email: user.Email,
          role: user.Role,
          name: user.Name
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
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
        { name: 'UserId', type: sql.UniqueIdentifier, value: req.user.id }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new CustomError('User not found', 404);
      }

      const user = result.recordset[0];

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.Id,
            name: user.Name,
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
