import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { jwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { rolesGuard } from '../shared/guards/roles.guard';
import { UserRole } from '../models/User';

const router = Router();
const inventoryController = new InventoryController();

// All inventory routes require admin authentication
router.use(jwtAuthGuard, rolesGuard([UserRole.ADMIN]));

// Query routes
router.get('/', inventoryController.getInventoryList.bind(inventoryController));
router.get('/stats', inventoryController.getStats.bind(inventoryController));
router.get('/dashboard', inventoryController.getDashboardAnalytics.bind(inventoryController));
router.get('/top-selling', inventoryController.getTopSelling.bind(inventoryController));
router.get('/timeline', inventoryController.getTimeline.bind(inventoryController));
router.get('/low-stock', inventoryController.getLowStockAlerts.bind(inventoryController));
router.get('/logs', inventoryController.getLogs.bind(inventoryController));
router.get('/activity-summary', inventoryController.getActivitySummary.bind(inventoryController));
router.get('/product/:productId', inventoryController.getByProduct.bind(inventoryController));
router.get('/product/:productId/history', inventoryController.getProductHistory.bind(inventoryController));
router.get('/product/:productId/timeline', inventoryController.getProductTimeline.bind(inventoryController));

// Mutation routes
router.post('/restock', inventoryController.restock.bind(inventoryController));
router.post('/adjust', inventoryController.adjust.bind(inventoryController));
router.post('/refund', inventoryController.refund.bind(inventoryController));
router.post('/import', inventoryController.importStock.bind(inventoryController));
router.post('/transfer', inventoryController.transferStock.bind(inventoryController));
router.patch('/threshold', inventoryController.setThreshold.bind(inventoryController));
router.post('/sync', inventoryController.syncFromProducts.bind(inventoryController));

export default router;
