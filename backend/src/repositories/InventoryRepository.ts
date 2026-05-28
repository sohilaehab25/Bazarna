import InventoryModel, { Inventory, InventoryStatus } from '../models/Inventory';
import { ClientSession, FilterQuery } from 'mongoose';

export interface InventoryPaginatedQuery {
    page: number;
    pageSize: number;
    search: string;
    status: InventoryStatus | 'all';
    warehouseId: string;
    sortBy: 'availableStock' | 'reservedStock' | 'totalStock' | 'updatedAt' | 'lastRestockedAt';
    sortOrder: 'asc' | 'desc';
}

export interface InventoryPaginatedResult {
    items: Inventory[];
    totalItems: number;
}

export class InventoryRepository {
    async findByProductId(
        productId: string,
        warehouseId: string = 'default'
    ): Promise<Inventory | null> {
        return InventoryModel.findOne({ productId, warehouseId })
            .populate('productId', 'name imageUrl price status')
            .lean<Inventory>();
    }

    async findByProductIds(
        productIds: string[],
        warehouseId: string = 'default'
    ): Promise<Inventory[]> {
        return InventoryModel.find({ productId: { $in: productIds }, warehouseId })
            .populate('productId', 'name imageUrl price status')
            .lean<Inventory[]>();
    }

    async findPaginated(query: InventoryPaginatedQuery): Promise<InventoryPaginatedResult> {
        const filter: FilterQuery<Inventory> = {};

        if (query.warehouseId) {
            filter.warehouseId = query.warehouseId;
        }

        if (query.status !== 'all') {
            filter.status = query.status;
        }

        const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
        const sortOptions: Record<string, 1 | -1> = { [query.sortBy]: sortDirection };

        const skip = (query.page - 1) * query.pageSize;

        let dbQuery = InventoryModel.find(filter)
            .populate('productId', 'name imageUrl price status categoryId')
            .sort(sortOptions)
            .skip(skip)
            .limit(query.pageSize);

        const [items, totalItems] = await Promise.all([
            dbQuery.lean<Inventory[]>(),
            InventoryModel.countDocuments(filter),
        ]);

        // If search is specified, filter after populate (product name search)
        if (query.search.trim().length > 0) {
            const searchLower = query.search.trim().toLowerCase();
            const filtered = items.filter((item) => {
                const product = item.productId as unknown as { name: string };
                return product?.name?.toLowerCase().includes(searchLower);
            });
            return { items: filtered, totalItems: filtered.length };
        }

        return { items, totalItems };
    }

    async upsert(
        productId: string,
        warehouseId: string,
        data: Partial<Inventory>,
        session?: ClientSession
    ): Promise<Inventory> {
        const options = session ? { session, new: true, upsert: true } : { new: true, upsert: true };
        const result = await InventoryModel.findOneAndUpdate(
            { productId, warehouseId },
            { $set: data },
            options
        ).lean<Inventory>();
        return result!;
    }

    async reserveStock(
        productId: string,
        quantity: number,
        warehouseId: string = 'default',
        session?: ClientSession
    ): Promise<Inventory | null> {
        const options = session ? { new: true, session } : { new: true };
        return InventoryModel.findOneAndUpdate(
            {
                productId,
                warehouseId,
                availableStock: { $gte: quantity },
            },
            {
                $inc: {
                    availableStock: -quantity,
                    reservedStock: quantity,
                },
            },
            options
        ).lean<Inventory>();
    }

    async commitReservation(
        productId: string,
        quantity: number,
        warehouseId: string = 'default',
        session?: ClientSession
    ): Promise<Inventory | null> {
        const options = session ? { new: true, session } : { new: true };
        return InventoryModel.findOneAndUpdate(
            {
                productId,
                warehouseId,
                reservedStock: { $gte: quantity },
            },
            {
                $inc: {
                    reservedStock: -quantity,
                    totalStock: -quantity,
                },
            },
            options
        ).lean<Inventory>();
    }

    async releaseReservation(
        productId: string,
        quantity: number,
        warehouseId: string = 'default',
        session?: ClientSession
    ): Promise<Inventory | null> {
        const options = session ? { new: true, session } : { new: true };
        return InventoryModel.findOneAndUpdate(
            {
                productId,
                warehouseId,
                reservedStock: { $gte: quantity },
            },
            {
                $inc: {
                    availableStock: quantity,
                    reservedStock: -quantity,
                },
            },
            options
        ).lean<Inventory>();
    }

    async restock(
        productId: string,
        quantity: number,
        warehouseId: string = 'default',
        session?: ClientSession
    ): Promise<Inventory | null> {
        const options = session ? { new: true, session } : { new: true };
        return InventoryModel.findOneAndUpdate(
            { productId, warehouseId },
            {
                $inc: {
                    availableStock: quantity,
                    totalStock: quantity,
                },
                $set: { lastRestockedAt: new Date() },
            },
            options
        ).lean<Inventory>();
    }

    async adjustStock(
        productId: string,
        newAvailable: number,
        warehouseId: string = 'default',
        session?: ClientSession
    ): Promise<Inventory | null> {
        const current = await InventoryModel.findOne({ productId, warehouseId });
        if (!current) return null;

        const diff = newAvailable - current.availableStock;
        const options = session ? { new: true, session } : { new: true };

        return InventoryModel.findOneAndUpdate(
            { productId, warehouseId },
            {
                $set: {
                    availableStock: newAvailable,
                    totalStock: newAvailable + current.reservedStock,
                    lastAuditedAt: new Date(),
                },
            },
            options
        ).lean<Inventory>();
    }

    async getLowStockItems(
        threshold?: number,
        warehouseId: string = 'default'
    ): Promise<Inventory[]> {
        const filter: FilterQuery<Inventory> = { warehouseId };

        if (threshold !== undefined) {
            filter.availableStock = { $lte: threshold };
        } else {
            filter.$expr = { $lte: ['$availableStock', '$lowStockThreshold'] };
        }

        return InventoryModel.find(filter)
            .populate('productId', 'name imageUrl price status')
            .sort({ availableStock: 1 })
            .lean<Inventory[]>();
    }

    async getInventoryStats(warehouseId: string = 'default') {
        const result = await InventoryModel.aggregate([
            { $match: { warehouseId } },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: '$totalStock' },
                    totalAvailable: { $sum: '$availableStock' },
                    totalReserved: { $sum: '$reservedStock' },
                    outOfStockCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'out-of-stock'] }, 1, 0] },
                    },
                    lowStockCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'low-stock'] }, 1, 0] },
                    },
                    inStockCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'in-stock'] }, 1, 0] },
                    },
                },
            },
        ]);

        return (
            result[0] ?? {
                totalProducts: 0,
                totalStock: 0,
                totalAvailable: 0,
                totalReserved: 0,
                outOfStockCount: 0,
                lowStockCount: 0,
                inStockCount: 0,
            }
        );
    }

    async syncFromProduct(
        productId: string,
        stock: number,
        warehouseId: string = 'default'
    ): Promise<Inventory> {
        return InventoryModel.findOneAndUpdate(
            { productId, warehouseId },
            {
                $setOnInsert: {
                    productId,
                    warehouseId,
                    reservedStock: 0,
                    lowStockThreshold: 10,
                    lastRestockedAt: null,
                    lastAuditedAt: null,
                },
                $set: {
                    availableStock: stock,
                    totalStock: stock,
                },
            },
            { upsert: true, new: true }
        ).lean<Inventory>();
    }
}
