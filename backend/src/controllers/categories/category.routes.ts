import { Router } from 'express';
import { CategoryController } from '../CategoryController';
import { jwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { rolesGuard } from '../../shared/guards/roles.guard';
import { validateObjectId } from '../../shared/utils/validation.util';
import { UserRole } from '../../models/User';

const router = Router();
const categoryController = new CategoryController();

router.get('/', categoryController.getAllCategories.bind(categoryController));
router.get('/:id', validateObjectId(), categoryController.getCategory.bind(categoryController));
router.post('/', jwtAuthGuard, rolesGuard([UserRole.ADMIN]), categoryController.createCategory.bind(categoryController));
router.put('/:id', jwtAuthGuard, rolesGuard([UserRole.ADMIN]), validateObjectId(), categoryController.updateCategory.bind(categoryController));
router.delete('/:id', jwtAuthGuard, rolesGuard([UserRole.ADMIN]), validateObjectId(), categoryController.deleteCategory.bind(categoryController));

export default router;