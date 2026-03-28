import { Router } from 'express';
import authRoutes from './controllers/auth/auth.routes';
import userRoutes from './controllers/users/user.routes';
import productRoutes from './controllers/products/product.routes';
import orderRoutes from './controllers/orders/order.routes';
import categoryRoutes from './controllers/categories/category.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);

export default router;