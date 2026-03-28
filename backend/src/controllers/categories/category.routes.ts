import { Router } from 'express';
import { CategoryController } from './CategoryController';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/User';

const router = Router();
const categoryController = new CategoryController();

router.get('/', categoryController.getAllCategories.bind(categoryController));
router.get('/:id', categoryController.getCategory.bind(categoryController));
router.post('/', authenticate, authorize(UserRole.ADMIN), categoryController.createCategory.bind(categoryController));
router.put('/:id', authenticate, authorize(UserRole.ADMIN), categoryController.updateCategory.bind(categoryController));
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), categoryController.deleteCategory.bind(categoryController));

export default router;