import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { jwtAuthGuard } from '../shared/guards/jwt-auth.guard';

const router = Router();
const cartController = new CartController();

router.get('/', jwtAuthGuard, cartController.getCart.bind(cartController));
router.post('/add', jwtAuthGuard, cartController.addToCart.bind(cartController));
router.post('/update-quantity', jwtAuthGuard, cartController.updateQuantity.bind(cartController));
router.delete('/remove/:productId', jwtAuthGuard, cartController.removeProduct.bind(cartController));

export default router;
