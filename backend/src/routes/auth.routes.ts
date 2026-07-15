import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimiter.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', validate(refreshTokenSchema), (req, res, next) => authController.refreshToken(req, res, next));
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/profile', authenticate, (req, res, next) => authController.getProfile(req, res, next));
router.put('/push-token', authenticate, (req, res, next) => authController.updatePushToken(req, res, next));

export default router;
