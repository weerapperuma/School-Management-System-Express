import express from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController';
import { validateLogin, validateRegister } from '../middleware/validation';
import { authRateLimit } from '../middleware/auth';

const router = express.Router();

// Apply rate limiting to auth routes
const authLimiter = rateLimit(authRateLimit);

// Authentication routes
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/me', authController.getProfile);

export default router;
