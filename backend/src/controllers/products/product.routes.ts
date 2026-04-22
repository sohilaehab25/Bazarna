import { Router } from 'express';
import { ProductController } from '../ProductController';
import { jwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { rolesGuard } from '../../shared/guards/roles.guard';
import { validateObjectId } from '../../shared/utils/validation.util';
import { UserRole } from '../../models/User';

const router = Router();
const productController = new ProductController();

router.get('/', productController.getAllProducts.bind(productController));
router.get('/:id', validateObjectId(), productController.getProduct.bind(productController));
router.post('/', jwtAuthGuard, rolesGuard([UserRole.ADMIN]), productController.createProduct.bind(productController));
router.put('/:id', jwtAuthGuard, validateObjectId(), productController.updateProduct.bind(productController));
router.delete('/:id', jwtAuthGuard, rolesGuard([UserRole.ADMIN]), validateObjectId(), productController.deleteProduct.bind(productController));

export default router;