import mongoose from 'mongoose';
import { InventoryRepository } from '../repositories/InventoryRepository';
import {
    InventoryLogRepository,
    CreateInventoryLogData,
} from '../repositories/InventoryLogRepository';
import { Inventory, computeInventoryStatus } from '../models/Inventory';
import { InventoryLogType, InventoryLogReferenceType } from '../models/InventoryLog';
import InventoryModel from '../models/Inventory';
import ProductModel from '../models/Product';
import { emitInventoryUpdate, emitLowStockAlert } from '../utils/socket';

export interface RestockPayload {
    productId: string;
    quantity: number;
    warehouseId?: string;
    reason: string;
    performedBy: string;
}

export interface AdjustmentPayload {
    productId: string;
    newAvailableStock: number;
    warehouseId?: string;
    reason: string;
    performedBy: string;
}

export interface ThresholdPayload {
    productId: string;
    threshold: number;
    warehouseId?: string;
    performedBy: string;
}

export interface ReservePayload {
    productId: string;
    quantity: number;
    orderId: string;
    warehouseId?: string;
}

export interface CommitPayload {
    productId: string;
    quantity: number;
    orderId: string;
    warehouseId?: string;
}

export interface ReleasePayload {
    productId: string;
    quantity: number;
    orderId: string;
    warehouseId?: string;
    reason: string;
}

export interface RefundPayload {
    productId: string;
    quantity: number;
    orderId: string;
    warehouseId?: string;
    reason: string;
    performedBy: string | null;
}

export interface ImportPayload {
    items: { productId: string; quantity: number }[];
    warehouseId?: string;
    reason: string;
    performedBy: string;
    ipAddress?: string;
}

export interface TransferPayload {
    productId: string;
    quantity: number;
    fromWarehouse: string;
    toWarehouse: string;
    reason: string;
    performedBy: string;
}

export class InventoryService {
    private inventoryRepo = new InventoryRepository();
    private logRepo = new InventoryLogRepository();

    // -----------------------------------------------------------------------
    // Query operations
    // -----------------------------------------------------------------------

    async getInventoryByProduct(productId: string, warehouseId: string = 'default') {
        return this.inventoryRepo.findByProductId(productId, warehouseId);
    }

    async getInventoryList(query: {
        page: number;
        pageSize: number;
        search: string;
        status: string;
        warehouseId: string;
        sortBy: string;
        sortOrder: string;
    }) {
        const result = await this.inventoryRepo.findPaginated({
            page: query.page,
            pageSize: query.pageSize,
            search: query.search,
            status: query.status as 'all' | Inventory['status'],
            warehouseId: query.warehouseId || 'default',
            sortBy: (query.sortBy as 'availableStock') || 'updatedAt',
            sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
        });

        const totalPages = Math.max(Math.ceil(result.totalItems / query.pageSize), 1);

        return {
            items: result.items,
            pagination: {
                page: query.page,
                pageSize: query.pageSize,
                totalItems: result.totalItems,
                totalPages,
                hasPreviousPage: query.page > 1,
                hasNextPage: query.page < totalPages,
            },
        };
    }

    async getInventoryStats(warehouseId: string = 'default') {
        return this.inventoryRepo.getInventoryStats(warehouseId);
    }

    async getLowStockAlerts(warehouseId: string = 'default') {
        return this.inventoryRepo.getLowStockItems(undefined, warehouseId);
    }

    async getInventoryLogs(query: {
        productId?: string;
        warehouseId?: string;
        type?: string;
        referenceType?: string;
        performedBy?: string;
        dateFrom?: string;
        dateTo?: string;
        search?: string;
        page: number;
        pageSize: number;
    }) {
        return this.logRepo.findPaginated({
            productId: query.productId,
            warehouseId: query.warehouseId,
            type: (query.type as InventoryLogType | 'all') || 'all',
            referenceType: (query.referenceType as InventoryLogReferenceType | 'all') || 'all',
            performedBy: query.performedBy,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            search: query.search,
            page: query.page,
            pageSize: query.pageSize,
        });
    }

    async getProductHistory(productId: string, limit: number = 50) {
        return this.logRepo.getRecentByProductId(productId, limit);
    }

    async getActivitySummary(warehouseId: string = 'default', days: number = 30) {
        return this.logRepo.getActivitySummary(warehouseId, days);
    }

    async getDashboardAnalytics(warehouseId: string = 'default', days: number = 30) {
        const [stats, lowStock, activity, timeline, topSelling, recentMovements] =
            await Promise.all([
                this.inventoryRepo.getInventoryStats(warehouseId),
                this.inventoryRepo.getLowStockItems(undefined, warehouseId),
                this.logRepo.getActivitySummary(warehouseId, days),
                this.logRepo.getStockMovementTimeline(warehouseId, days),
                this.logRepo.getTopMovedProducts(warehouseId, days, 10),
                this.logRepo.getRecentMovements(warehouseId, 10),
            ]);

        return {
            stats,
            lowStock,
            activity,
            timeline,
            topSelling,
            recentMovements,
        };
    }

    async getStockMovementTimeline(warehouseId: string = 'default', days: number = 30) {
        return this.logRepo.getStockMovementTimeline(warehouseId, days);
    }

    async getTopSellingProducts(warehouseId: string = 'default', days: number = 30, limit: number = 10) {
        return this.logRepo.getTopMovedProducts(warehouseId, days, limit);
    }

    // -----------------------------------------------------------------------
    // Mutation operations (transaction-safe)
    // -----------------------------------------------------------------------

    async restock(payload: RestockPayload): Promise<Inventory> {
        const { productId, quantity, warehouseId = 'default', reason, performedBy } = payload;

        if (quantity <= 0) {
            throw new Error('Restock quantity must be positive');
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const current = await InventoryModel.findOne({ productId, warehouseId }).session(session);

            const previousAvailable = current?.availableStock ?? 0;
            const previousReserved = current?.reservedStock ?? 0;

            const updated = await this.inventoryRepo.restock(productId, quantity, warehouseId, session);
            if (!updated) {
                throw new Error('Inventory record not found');
            }

            // Sync Product.stock field for backward compatibility
            await ProductModel.findByIdAndUpdate(
                productId,
                { $set: { stock: updated.availableStock } },
                { session }
            );

            // Update status
            const newStatus = computeInventoryStatus(
                updated.availableStock,
                updated.reservedStock,
                updated.lowStockThreshold ?? 10
            );
            await InventoryModel.findByIdAndUpdate(
                updated._id,
                { $set: { status: newStatus } },
                { session }
            );

            const logData: CreateInventoryLogData = {
                productId,
                warehouseId,
                type: InventoryLogType.RESTOCK,
                quantity,
                previousAvailable,
                newAvailable: updated.availableStock,
                previousReserved,
                newReserved: updated.reservedStock,
                referenceType: InventoryLogReferenceType.MANUAL,
                referenceId: null,
                performedBy,
                reason,
            };
            await this.logRepo.create(logData, session);

            await session.commitTransaction();

            // Real-time notification
            emitInventoryUpdate(productId, {
                availableStock: updated.availableStock,
                reservedStock: updated.reservedStock,
                totalStock: updated.totalStock,
                status: newStatus,
            });

            return updated;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async adjust(payload: AdjustmentPayload): Promise<Inventory> {
        const { productId, newAvailableStock, warehouseId = 'default', reason, performedBy } = payload;

        if (newAvailableStock < 0) {
            throw new Error('Stock cannot be negative');
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const current = await InventoryModel.findOne({ productId, warehouseId }).session(session);
            if (!current) {
                throw new Error('Inventory record not found');
            }

            const previousAvailable = current.availableStock;
            const previousReserved = current.reservedStock;
            const diff = newAvailableStock - previousAvailable;

            const updated = await this.inventoryRepo.adjustStock(
                productId,
                newAvailableStock,
                warehouseId,
                session
            );
            if (!updated) {
                throw new Error('Failed to adjust inventory');
            }

            // Sync Product.stock
            await ProductModel.findByIdAndUpdate(
                productId,
                { $set: { stock: newAvailableStock } },
                { session }
            );

            const newStatus = computeInventoryStatus(
                updated.availableStock,
                updated.reservedStock,
                updated.lowStockThreshold ?? 10
            );
            await InventoryModel.findByIdAndUpdate(
                updated._id,
                { $set: { status: newStatus } },
                { session }
            );

            const logData: CreateInventoryLogData = {
                productId,
                warehouseId,
                type: InventoryLogType.ADJUSTMENT,
                quantity: diff,
                previousAvailable,
                newAvailable: newAvailableStock,
                previousReserved,
                newReserved: previousReserved,
                referenceType: InventoryLogReferenceType.MANUAL,
                referenceId: null,
                performedBy,
                reason,
            };
            await this.logRepo.create(logData, session);

            await session.commitTransaction();

            emitInventoryUpdate(productId, {
                availableStock: updated.availableStock,
                reservedStock: updated.reservedStock,
                totalStock: updated.totalStock,
                status: newStatus,
            });

            // Check for low stock alert
            if (newStatus === 'low-stock' || newStatus === 'out-of-stock') {
                emitLowStockAlert(productId, updated.availableStock, updated.lowStockThreshold ?? 10);
            }

            return updated;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async setThreshold(payload: ThresholdPayload): Promise<Inventory | null> {
        const { productId, threshold, warehouseId = 'default', performedBy } = payload;

        if (threshold < 0) {
            throw new Error('Threshold cannot be negative');
        }

        const updated = await InventoryModel.findOneAndUpdate(
            { productId, warehouseId },
            { $set: { lowStockThreshold: threshold } },
            { new: true }
        ).lean<Inventory>();

        if (updated) {
            const newStatus = computeInventoryStatus(
                updated.availableStock,
                updated.reservedStock,
                threshold
            );
            await InventoryModel.findByIdAndUpdate(updated._id, { $set: { status: newStatus } });

            emitInventoryUpdate(productId, {
                availableStock: updated.availableStock,
                reservedStock: updated.reservedStock,
                totalStock: updated.totalStock,
                status: newStatus,
            });
        }

        return updated;
    }

    // -----------------------------------------------------------------------
    // Reservation flow (called by OrderService)
    // -----------------------------------------------------------------------

    async reserveForOrder(payload: ReservePayload): Promise<Inventory> {
        const { productId, quantity, orderId, warehouseId = 'default' } = payload;

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const current = await InventoryModel.findOne({ productId, warehouseId }).session(session);
            if (!current) {
                throw new Error(`No inventory record for product ${productId}`);
            }

            const previousAvailable = current.availableStock;
            const previousReserved = current.reservedStock;

            const updated = await this.inventoryRepo.reserveStock(
                productId,
                quantity,
                warehouseId,
                session
            );
            if (!updated) {
                throw new Error(`Insufficient stock for product ${productId}`);
            }

            const newStatus = computeInventoryStatus(
                updated.availableStock,
                updated.reservedStock,
                updated.lowStockThreshold ?? 10
            );
            await InventoryModel.findByIdAndUpdate(
                updated._id,
                { $set: { status: newStatus } },
                { session }
            );

            const logData: CreateInventoryLogData = {
                productId,
                warehouseId,
                type: InventoryLogType.RESERVATION,
                quantity,
                previousAvailable,
                newAvailable: updated.availableStock,
                previousReserved,
                newReserved: updated.reservedStock,
                referenceType: InventoryLogReferenceType.ORDER,
                referenceId: orderId,
                performedBy: null,
                reason: `Stock reserved for order ${orderId}`,
            };
            await this.logRepo.create(logData, session);

            await session.commitTransaction();

            emitInventoryUpdate(productId, {
                availableStock: updated.availableStock,
                reservedStock: updated.reservedStock,
                totalStock: updated.totalStock,
                status: newStatus,
            });

            if (newStatus === 'low-stock') {
                emitLowStockAlert(productId, updated.availableStock, updated.lowStockThreshold ?? 10);
            }

            return updated;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async commitReservation(payload: CommitPayload): Promise<Inventory> {
        const { productId, quantity, orderId, warehouseId = 'default' } = payload;

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const current = await InventoryModel.findOne({ productId, warehouseId }).session(session);
            if (!current) {
                throw new Error(`No inventory record for product ${productId}`);
            }

            const previousAvailable = current.availableStock;
            const previousReserved = current.reservedStock;

            const updated = await this.inventoryRepo.commitReservation(
                productId,
                quantity,
                warehouseId,
                session
            );
            if (!updated) {
                throw new Error(`Cannot commit reservation for product ${productId}`);
            }

            // Sync Product.stock to reflect totalStock decrement
            await ProductModel.findByIdAndUpdate(
                productId,
                { $set: { stock: updated.availableStock } },
                { session }
            );

            const newStatus = computeInventoryStatus(
                updated.availableStock,
                updated.reservedStock,
                updated.lowStockThreshold ?? 10
            );
            await InventoryModel.findByIdAndUpdate(
                updated._id,
                { $set: { status: newStatus } },
                { session }
            );

            const logData: CreateInventoryLogData = {
                productId,
                warehouseId,
                type: InventoryLogType.SALE,
                quantity,
                previousAvailable,
                newAvailable: updated.availableStock,
                previousReserved,
                newReserved: updated.reservedStock,
                referenceType: InventoryLogReferenceType.ORDER,
                referenceId: orderId,
                performedBy: null,
                reason: `Reservation committed for order ${orderId}`,
            };
            await this.logRepo.create(logData, session);

            await session.commitTransaction();

            emitInventoryUpdate(productId, {
                availableStock: updated.availableStock,
                reservedStock: updated.reservedStock,
                totalStock: updated.totalStock,
                status: newStatus,
            });

            return updated;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async releaseReservation(payload: ReleasePayload): Promise<Inventory> {
        const { productId, quantity, orderId, warehouseId = 'default', reason } = payload;

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const current = await InventoryModel.findOne({ productId, warehouseId }).session(session);
            if (!current) {
                throw new Error(`No inventory record for product ${productId}`);
            }

            const previousAvailable = current.availableStock;
            const previousReserved = current.reservedStock;

            const updated = await this.inventoryRepo.releaseReservation(
                productId,
                quantity,
                warehouseId,
                session
            );
            if (!updated) {
                throw new Error(`Cannot release reservation for product ${productId}`);
            }

            // Sync Product.stock
            await ProductModel.findByIdAndUpdate(
                productId,
                { $set: { stock: updated.availableStock } },
                { session }
            );

            const newStatus = computeInventoryStatus(
                updated.availableStock,
                updated.reservedStock,
                updated.lowStockThreshold ?? 10
            );
            await InventoryModel.findByIdAndUpdate(
                updated._id,
                { $set: { status: newStatus } },
                { session }
            );

            const logData: CreateInventoryLogData = {
                productId,
                warehouseId,
                type: InventoryLogType.RELEASE,
                quantity,
                previousAvailable,
                newAvailable: updated.availableStock,
                previousReserved,
                newReserved: updated.reservedStock,
                referenceType: InventoryLogReferenceType.ORDER,
                referenceId: orderId,
                performedBy: null,
                reason,
            };
            await this.logRepo.create(logData, session);

            await session.commitTransaction();

            emitInventoryUpdate(productId, {
                availableStock: updated.availableStock,
                reservedStock: updated.reservedStock,
                totalStock: updated.totalStock,
                status: newStatus,
            });

            return updated;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // -----------------------------------------------------------------------
    // Refund stock restoration
    // -----------------------------------------------------------------------

    async refundStock(payload: RefundPayload): Promise<Inventory> {
        const { productId, quantity, orderId, warehouseId = 'default', reason, performedBy } = payload;

        if (quantity <= 0) {
            throw new Error('Refund quantity must be positive');
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const current = await InventoryModel.findOne({ productId, warehouseId }).session(session);
            if (!current) {
                throw new Error(`No inventory record for product ${productId}`);
            }

            const previousAvailable = current.availableStock;
            const previousReserved = current.reservedStock;

            const updated = await this.inventoryRepo.restock(productId, quantity, warehouseId, session);
            if (!updated) {
                throw new Error('Failed to restore stock from refund');
            }

            await ProductModel.findByIdAndUpdate(
                productId,
                { $set: { stock: updated.availableStock } },
                { session }
            );

            const newStatus = computeInventoryStatus(
                updated.availableStock,
                updated.reservedStock,
                updated.lowStockThreshold ?? 10
            );
            await InventoryModel.findByIdAndUpdate(
                updated._id,
                { $set: { status: newStatus } },
                { session }
            );

            const logData: CreateInventoryLogData = {
                productId,
                warehouseId,
                type: InventoryLogType.REFUND,
                quantity,
                previousAvailable,
                newAvailable: updated.availableStock,
                previousReserved,
                newReserved: updated.reservedStock,
                snapshotTotalStock: updated.totalStock,
                referenceType: InventoryLogReferenceType.ORDER,
                referenceId: orderId,
                performedBy,
                reason,
            };
            await this.logRepo.create(logData, session);

            await session.commitTransaction();

            emitInventoryUpdate(productId, {
                availableStock: updated.availableStock,
                reservedStock: updated.reservedStock,
                totalStock: updated.totalStock,
                status: newStatus,
            });

            return updated;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // -----------------------------------------------------------------------
    // Bulk import stock
    // -----------------------------------------------------------------------

    async importStock(payload: ImportPayload): Promise<{ imported: number; errors: string[] }> {
        const { items, warehouseId = 'default', reason, performedBy, ipAddress } = payload;

        const errors: string[] = [];
        let imported = 0;

        for (const item of items) {
            const session = await mongoose.startSession();
            try {
                session.startTransaction();

                const current = await InventoryModel.findOne({
                    productId: item.productId,
                    warehouseId,
                }).session(session);

                const previousAvailable = current?.availableStock ?? 0;
                const previousReserved = current?.reservedStock ?? 0;

                const updated = await this.inventoryRepo.restock(
                    item.productId,
                    item.quantity,
                    warehouseId,
                    session
                );
                if (!updated) {
                    errors.push(`Failed to import for product ${item.productId}`);
                    await session.abortTransaction();
                    continue;
                }

                await ProductModel.findByIdAndUpdate(
                    item.productId,
                    { $set: { stock: updated.availableStock } },
                    { session }
                );

                const newStatus = computeInventoryStatus(
                    updated.availableStock,
                    updated.reservedStock,
                    updated.lowStockThreshold ?? 10
                );
                await InventoryModel.findByIdAndUpdate(
                    updated._id,
                    { $set: { status: newStatus } },
                    { session }
                );

                const logData: CreateInventoryLogData = {
                    productId: item.productId,
                    warehouseId,
                    type: InventoryLogType.IMPORT,
                    quantity: item.quantity,
                    previousAvailable,
                    newAvailable: updated.availableStock,
                    previousReserved,
                    newReserved: updated.reservedStock,
                    snapshotTotalStock: updated.totalStock,
                    referenceType: InventoryLogReferenceType.IMPORT,
                    referenceId: null,
                    performedBy,
                    reason,
                    ipAddress: ipAddress ?? null,
                };
                await this.logRepo.create(logData, session);

                await session.commitTransaction();
                imported++;

                emitInventoryUpdate(item.productId, {
                    availableStock: updated.availableStock,
                    reservedStock: updated.reservedStock,
                    totalStock: updated.totalStock,
                    status: newStatus,
                });
            } catch (error) {
                await session.abortTransaction();
                const msg = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Product ${item.productId}: ${msg}`);
            } finally {
                session.endSession();
            }
        }

        return { imported, errors };
    }

    // -----------------------------------------------------------------------
    // Warehouse transfer (preparation)
    // -----------------------------------------------------------------------

    async transferStock(payload: TransferPayload): Promise<{ from: Inventory; to: Inventory }> {
        const { productId, quantity, fromWarehouse, toWarehouse, reason, performedBy } = payload;

        if (quantity <= 0) {
            throw new Error('Transfer quantity must be positive');
        }
        if (fromWarehouse === toWarehouse) {
            throw new Error('Source and destination warehouses must be different');
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Deduct from source
            const source = await InventoryModel.findOne({
                productId,
                warehouseId: fromWarehouse,
            }).session(session);
            if (!source) {
                throw new Error(`No inventory record in warehouse ${fromWarehouse}`);
            }
            if (source.availableStock < quantity) {
                throw new Error(`Insufficient stock in ${fromWarehouse}. Available: ${source.availableStock}`);
            }

            const srcPrevAvail = source.availableStock;
            const srcPrevReserved = source.reservedStock;

            source.availableStock -= quantity;
            source.totalStock -= quantity;
            source.status = computeInventoryStatus(source.availableStock, source.reservedStock, source.lowStockThreshold);
            await source.save({ session });

            // Add to destination (create if not exists)
            let dest = await InventoryModel.findOne({
                productId,
                warehouseId: toWarehouse,
            }).session(session);

            const destPrevAvail = dest?.availableStock ?? 0;
            const destPrevReserved = dest?.reservedStock ?? 0;

            if (!dest) {
                const [created] = await InventoryModel.create(
                    [
                        {
                            productId,
                            warehouseId: toWarehouse,
                            totalStock: quantity,
                            availableStock: quantity,
                            reservedStock: 0,
                            lowStockThreshold: source.lowStockThreshold,
                            status: computeInventoryStatus(quantity, 0, source.lowStockThreshold),
                        },
                    ],
                    { session }
                );
                dest = created;
            } else {
                dest.availableStock += quantity;
                dest.totalStock += quantity;
                dest.status = computeInventoryStatus(dest.availableStock, dest.reservedStock, dest.lowStockThreshold);
                await dest.save({ session });
            }

            // Log source deduction
            await this.logRepo.create(
                {
                    productId,
                    warehouseId: fromWarehouse,
                    type: InventoryLogType.WAREHOUSE_TRANSFER,
                    quantity: -quantity,
                    previousAvailable: srcPrevAvail,
                    newAvailable: source.availableStock,
                    previousReserved: srcPrevReserved,
                    newReserved: source.reservedStock,
                    snapshotTotalStock: source.totalStock,
                    referenceType: InventoryLogReferenceType.TRANSFER,
                    referenceId: toWarehouse,
                    performedBy,
                    reason,
                },
                session
            );

            // Log destination addition
            await this.logRepo.create(
                {
                    productId,
                    warehouseId: toWarehouse,
                    type: InventoryLogType.WAREHOUSE_TRANSFER,
                    quantity,
                    previousAvailable: destPrevAvail,
                    newAvailable: dest.availableStock,
                    previousReserved: destPrevReserved,
                    newReserved: dest.reservedStock,
                    snapshotTotalStock: dest.totalStock,
                    referenceType: InventoryLogReferenceType.TRANSFER,
                    referenceId: fromWarehouse,
                    performedBy,
                    reason,
                },
                session
            );

            await session.commitTransaction();

            emitInventoryUpdate(productId, {
                availableStock: source.availableStock,
                reservedStock: source.reservedStock,
                totalStock: source.totalStock,
                status: source.status,
            });

            return { from: source.toObject(), to: dest.toObject() };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // -----------------------------------------------------------------------
    // Product timeline (paginated per-product log history)
    // -----------------------------------------------------------------------

    async getProductLogTimeline(productId: string, page: number = 1, pageSize: number = 50) {
        return this.logRepo.getProductTimeline(productId, page, pageSize);
    }

    // -----------------------------------------------------------------------
    // Sync utility: initialize inventory records from existing products
    // -----------------------------------------------------------------------

    async syncAllFromProducts(): Promise<{ synced: number }> {
        const products = await ProductModel.find({}).select('_id stock').lean();
        let synced = 0;

        for (const product of products) {
            await this.inventoryRepo.syncFromProduct(
                product._id.toString(),
                product.stock,
                'default'
            );
            synced++;
        }

        return { synced };
    }
}
