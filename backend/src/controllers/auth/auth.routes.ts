import { Router } from 'express';
import { AuthController } from '../../modules/auth';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/resend-verification', authController.resendVerification.bind(authController));

export default router;