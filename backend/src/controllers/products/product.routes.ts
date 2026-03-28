import { Router } from 'express';
import { ProductController } from './ProductController';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/User';

const router = Router();
const productController = new ProductController();

router.get('/', productController.getAllProducts.bind(productController));
router.get('/:id', productController.getProduct.bind(productController));
router.post('/', authenticate, authorize(UserRole.STORE_OWNER), productController.createProduct.bind(productController));
router.put('/:id', authenticate, productController.updateProduct.bind(productController));
router.delete('/:id', authenticate, productController.deleteProduct.bind(productController));
router.get('/store/:storeOwnerId', authenticate, productController.getStoreProducts.bind(productController));

export default router;