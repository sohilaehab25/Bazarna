import { Router } from 'express';
import { UserController } from '../UserController';
import { jwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

const router = Router();
const userController = new UserController();

router.get('/profile', jwtAuthGuard, userController.getProfile.bind(userController));
router.put('/profile', jwtAuthGuard, userController.updateProfile.bind(userController));

export default router;