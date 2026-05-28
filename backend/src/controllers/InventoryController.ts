import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';

export class InventoryController {
    private inventoryService = new InventoryService();

    // GET /api/inventory
    async getInventoryList(req: Request, res: Response): Promise<void> {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
            const search = (req.query.search as string) || '';
            const status = (req.query.status as string) || 'all';
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const sortBy = (req.query.sortBy as string) || 'updatedAt';
            const sortOrder = (req.query.sortOrder as string) || 'desc';

            const result = await this.inventoryService.getInventoryList({
                page,
                pageSize,
                search,
                status,
                warehouseId,
                sortBy,
                sortOrder,
            });

            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch inventory';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/stats
    async getStats(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const stats = await this.inventoryService.getInventoryStats(warehouseId);
            res.apiSuccess('Success', stats);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch stats';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/low-stock
    async getLowStockAlerts(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const items = await this.inventoryService.getLowStockAlerts(warehouseId);
            res.apiSuccess('Success', items);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch alerts';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/logs
    async getLogs(req: Request, res: Response): Promise<void> {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
            const productId = req.query.productId as string | undefined;
            const warehouseId = req.query.warehouseId as string | undefined;
            const type = req.query.type as string | undefined;
            const referenceType = req.query.referenceType as string | undefined;
            const performedBy = req.query.performedBy as string | undefined;
            const dateFrom = req.query.dateFrom as string | undefined;
            const dateTo = req.query.dateTo as string | undefined;
            const search = req.query.search as string | undefined;

            const result = await this.inventoryService.getInventoryLogs({
                productId,
                warehouseId,
                type,
                referenceType,
                performedBy,
                dateFrom,
                dateTo,
                search,
                page,
                pageSize,
            });

            const totalPages = Math.max(Math.ceil(result.totalItems / pageSize), 1);

            res.apiSuccess('Success', {
                items: result.items,
                pagination: {
                    page,
                    pageSize,
                    totalItems: result.totalItems,
                    totalPages,
                    hasPreviousPage: page > 1,
                    hasNextPage: page < totalPages,
                },
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch logs';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/product/:productId
    async getByProduct(req: Request, res: Response): Promise<void> {
        try {
            const { productId } = req.params;
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const inventory = await this.inventoryService.getInventoryByProduct(productId, warehouseId);

            if (!inventory) {
                res.apiError('Inventory record not found', 404);
                return;
            }

            res.apiSuccess('Success', inventory);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch inventory';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/product/:productId/history
    async getProductHistory(req: Request, res: Response): Promise<void> {
        try {
            const { productId } = req.params;
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
            const logs = await this.inventoryService.getProductHistory(productId, limit);
            res.apiSuccess('Success', logs);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch history';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/activity-summary
    async getActivitySummary(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
            const summary = await this.inventoryService.getActivitySummary(warehouseId, days);
            res.apiSuccess('Success', summary);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch summary';
            res.apiError(message, 500);
        }
    }

    // POST /api/inventory/restock
    async restock(req: Request, res: Response): Promise<void> {
        try {
            const { productId, quantity, warehouseId, reason } = req.body;

            if (!productId || !quantity || !reason) {
                res.apiError('productId, quantity, and reason are required', 400);
                return;
            }

            if (typeof quantity !== 'number' || quantity <= 0) {
                res.apiError('quantity must be a positive number', 400);
                return;
            }

            const performedBy = (req.user as { _id: string })?._id?.toString();
            if (!performedBy) {
                res.apiError('Authentication required', 401);
                return;
            }

            const result = await this.inventoryService.restock({
                productId,
                quantity,
                warehouseId,
                reason,
                performedBy,
            });

            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Restock failed';
            res.apiError(message, 400);
        }
    }

    // POST /api/inventory/adjust
    async adjust(req: Request, res: Response): Promise<void> {
        try {
            const { productId, newAvailableStock, warehouseId, reason } = req.body;

            if (!productId || newAvailableStock === undefined || !reason) {
                res.apiError('productId, newAvailableStock, and reason are required', 400);
                return;
            }

            if (typeof newAvailableStock !== 'number' || newAvailableStock < 0) {
                res.apiError('newAvailableStock must be a non-negative number', 400);
                return;
            }

            const performedBy = (req.user as { _id: string })?._id?.toString();
            if (!performedBy) {
                res.apiError('Authentication required', 401);
                return;
            }

            const result = await this.inventoryService.adjust({
                productId,
                newAvailableStock,
                warehouseId,
                reason,
                performedBy,
            });

            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Adjustment failed';
            res.apiError(message, 400);
        }
    }

    // PATCH /api/inventory/threshold
    async setThreshold(req: Request, res: Response): Promise<void> {
        try {
            const { productId, threshold, warehouseId } = req.body;

            if (!productId || threshold === undefined) {
                res.apiError('productId and threshold are required', 400);
                return;
            }

            if (typeof threshold !== 'number' || threshold < 0) {
                res.apiError('threshold must be a non-negative number', 400);
                return;
            }

            const performedBy = (req.user as { _id: string })?._id?.toString();
            if (!performedBy) {
                res.apiError('Authentication required', 401);
                return;
            }

            const result = await this.inventoryService.setThreshold({
                productId,
                threshold,
                warehouseId,
                performedBy,
            });

            if (!result) {
                res.apiError('Inventory record not found', 404);
                return;
            }

            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to set threshold';
            res.apiError(message, 400);
        }
    }

    // POST /api/inventory/sync
    async syncFromProducts(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.inventoryService.syncAllFromProducts();
            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Sync failed';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/dashboard
    async getDashboardAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
            const result = await this.inventoryService.getDashboardAnalytics(warehouseId, days);
            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch dashboard';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/top-selling
    async getTopSelling(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
            const result = await this.inventoryService.getTopSellingProducts(warehouseId, days, limit);
            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch top selling';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/timeline
    async getTimeline(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = (req.query.warehouseId as string) || 'default';
            const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
            const result = await this.inventoryService.getStockMovementTimeline(warehouseId, days);
            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch timeline';
            res.apiError(message, 500);
        }
    }

    // GET /api/inventory/product/:productId/timeline
    async getProductTimeline(req: Request, res: Response): Promise<void> {
        try {
            const { productId } = req.params;
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
            const result = await this.inventoryService.getProductLogTimeline(productId, page, pageSize);
            const totalPages = Math.max(Math.ceil(result.totalItems / pageSize), 1);
            res.apiSuccess('Success', {
                items: result.items,
                pagination: {
                    page,
                    pageSize,
                    totalItems: result.totalItems,
                    totalPages,
                    hasPreviousPage: page > 1,
                    hasNextPage: page < totalPages,
                },
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch product timeline';
            res.apiError(message, 500);
        }
    }

    // POST /api/inventory/refund
    async refund(req: Request, res: Response): Promise<void> {
        try {
            const { productId, quantity, orderId, warehouseId, reason } = req.body;

            if (!productId || !quantity || !orderId || !reason) {
                res.apiError('productId, quantity, orderId, and reason are required', 400);
                return;
            }

            if (typeof quantity !== 'number' || quantity <= 0) {
                res.apiError('quantity must be a positive number', 400);
                return;
            }

            const performedBy = (req.user as { _id: string })?._id?.toString() || null;

            const result = await this.inventoryService.refundStock({
                productId,
                quantity,
                orderId,
                warehouseId,
                reason,
                performedBy,
            });

            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Refund failed';
            res.apiError(message, 400);
        }
    }

    // POST /api/inventory/import
    async importStock(req: Request, res: Response): Promise<void> {
        try {
            const { items, warehouseId, reason } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                res.apiError('items array is required and must not be empty', 400);
                return;
            }

            if (!reason) {
                res.apiError('reason is required', 400);
                return;
            }

            for (const item of items) {
                if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
                    res.apiError('Each item must have a valid productId and positive quantity', 400);
                    return;
                }
            }

            const performedBy = (req.user as { _id: string })?._id?.toString();
            if (!performedBy) {
                res.apiError('Authentication required', 401);
                return;
            }

            const ipAddress = req.ip || req.socket.remoteAddress || null;

            const result = await this.inventoryService.importStock({
                items,
                warehouseId,
                reason,
                performedBy,
                ipAddress: ipAddress ?? undefined,
            });

            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Import failed';
            res.apiError(message, 400);
        }
    }

    // POST /api/inventory/transfer
    async transferStock(req: Request, res: Response): Promise<void> {
        try {
            const { productId, quantity, fromWarehouse, toWarehouse, reason } = req.body;

            if (!productId || !quantity || !fromWarehouse || !toWarehouse || !reason) {
                res.apiError('productId, quantity, fromWarehouse, toWarehouse, and reason are required', 400);
                return;
            }

            if (typeof quantity !== 'number' || quantity <= 0) {
                res.apiError('quantity must be a positive number', 400);
                return;
            }

            if (fromWarehouse === toWarehouse) {
                res.apiError('Source and destination warehouses must be different', 400);
                return;
            }

            const performedBy = (req.user as { _id: string })?._id?.toString();
            if (!performedBy) {
                res.apiError('Authentication required', 401);
                return;
            }

            const result = await this.inventoryService.transferStock({
                productId,
                quantity,
                fromWarehouse,
                toWarehouse,
                reason,
                performedBy,
            });

            res.apiSuccess('Success', result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Transfer failed';
            res.apiError(message, 400);
        }
    }
}
