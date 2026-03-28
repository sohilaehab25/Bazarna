import { Router } from 'express';
import { OrderController } from './OrderController';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../models/User';

const router = Router();
const orderController = new OrderController();

router.post('/', authenticate, orderController.createOrder.bind(orderController));
router.get('/my-orders', authenticate, orderController.getUserOrders.bind(orderController));
router.get('/:id', authenticate, orderController.getOrder.bind(orderController));
router.get('/:id/items', authenticate, orderController.getOrderItems.bind(orderController));
router.get('/', authenticate, authorize(UserRole.ADMIN), orderController.getAllOrders.bind(orderController));
router.put('/:id/status', authenticate, authorize(UserRole.ADMIN), orderController.updateOrderStatus.bind(orderController));

export default router;