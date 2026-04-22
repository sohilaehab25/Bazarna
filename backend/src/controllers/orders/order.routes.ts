import { Router } from 'express';
import { OrderController } from '../OrderController';
import { jwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { rolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../models/User';

const router = Router();
const orderController = new OrderController();

router.post('/', jwtAuthGuard, orderController.createOrder.bind(orderController));
router.post('/checkout', jwtAuthGuard, orderController.checkout.bind(orderController));
router.get('/my-orders', jwtAuthGuard, orderController.getUserOrders.bind(orderController));
router.get('/:id', jwtAuthGuard, orderController.getOrder.bind(orderController));
router.get('/:id/items', jwtAuthGuard, orderController.getOrderItems.bind(orderController));
router.get('/', jwtAuthGuard, rolesGuard([UserRole.ADMIN]), orderController.getAllOrders.bind(orderController));
router.put('/:id/status', jwtAuthGuard, rolesGuard([UserRole.ADMIN]), orderController.updateOrderStatus.bind(orderController));

export default router;