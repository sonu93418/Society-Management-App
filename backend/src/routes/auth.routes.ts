import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { superAdminController } from '../controllers/superAdmin.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimiter.middleware';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, registerDeviceSchema, updatePreferencesSchema, googleLoginSchema, onboardingRequestSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/google-login', authLimiter, validate(googleLoginSchema), (req, res, next) => authController.googleLogin(req, res, next));
router.post('/onboarding-request', authLimiter, validate(onboardingRequestSchema), (req, res, next) => superAdminController.submitOnboardingRequest(req, res, next));
router.get('/societies', (req, res, next) => authController.getSocieties(req, res, next));

router.post('/refresh-token', validate(refreshTokenSchema), (req, res, next) => authController.refreshToken(req, res, next));
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/profile', authenticate, (req, res, next) => authController.getProfile(req, res, next));
router.put('/push-token', authenticate, (req, res, next) => authController.updatePushToken(req, res, next));

// Password Reset Routes (unauthenticated)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), (req, res, next) => authController.resetPassword(req, res, next));

// Flat Assignment Route (authenticated)
router.put('/assign-flat', authenticate, (req, res, next) => authController.assignFlat(req, res, next));

// Device token & Preferences routes (authenticated)
router.post('/register-device', authenticate, validate(registerDeviceSchema), (req, res, next) => authController.registerDevice(req, res, next));
router.put('/notification-preferences', authenticate, validate(updatePreferencesSchema), (req, res, next) => authController.updatePreferences(req, res, next));

export default router;
