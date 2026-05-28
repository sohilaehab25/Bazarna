import { Router } from 'express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes';
import inventoryRoutes from './routes/inventory.routes';
import paymentRoutes from './modules/payment/payment.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/payments', paymentRoutes);

export default router;