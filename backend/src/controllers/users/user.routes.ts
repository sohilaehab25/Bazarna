import { Router } from 'express';
import { UserController } from './UserController';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const userController = new UserController();

router.get('/profile', authenticate, userController.getProfile.bind(userController));
router.put('/profile', authenticate, userController.updateProfile.bind(userController));

export default router;