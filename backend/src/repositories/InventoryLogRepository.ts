import InventoryLogModel, {
    InventoryLog,
    InventoryLogType,
    InventoryLogReferenceType,
} from '../models/InventoryLog';
import { ClientSession } from 'mongoose';

export interface CreateInventoryLogData {
    productId: string;
    warehouseId: string;
    type: InventoryLogType;
    quantity: number;
    previousAvailable: number;
    newAvailable: number;
    previousReserved: number;
    newReserved: number;
    snapshotTotalStock?: number;
    referenceType: InventoryLogReferenceType;
    referenceId: string | null;
    performedBy: string | null;
    reason: string;
    ipAddress?: string | null;
    metadata?: Record<string, unknown>;
}

export interface InventoryLogQuery {
    productId?: string;
    warehouseId?: string;
    type?: InventoryLogType | 'all';
    referenceType?: InventoryLogReferenceType | 'all';
    performedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page: number;
    pageSize: number;
}

export interface InventoryLogPaginatedResult {
    items: InventoryLog[];
    totalItems: number;
}

export class InventoryLogRepository {
    async create(data: CreateInventoryLogData, session?: ClientSession): Promise<InventoryLog> {
        const [log] = await InventoryLogModel.create(
            [
                {
                    ...data,
                    metadata: data.metadata ?? {},
                },
            ],
            session ? { session } : undefined
        );
        return log;
    }

    async findPaginated(query: InventoryLogQuery): Promise<InventoryLogPaginatedResult> {
        const filter: Record<string, unknown> = {};

        if (query.productId) {
            filter.productId = query.productId;
        }

        if (query.warehouseId) {
            filter.warehouseId = query.warehouseId;
        }

        if (query.type && query.type !== 'all') {
            filter.type = query.type;
        }

        if (query.referenceType && query.referenceType !== 'all') {
            filter.referenceType = query.referenceType;
        }

        if (query.performedBy) {
            filter.performedBy = query.performedBy;
        }

        if (query.search && query.search.trim().length > 0) {
            filter.reason = { $regex: query.search.trim(), $options: 'i' };
        }

        if (query.dateFrom || query.dateTo) {
            const dateFilter: Record<string, Date> = {};
            if (query.dateFrom) {
                dateFilter.$gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                dateFilter.$lte = new Date(query.dateTo);
            }
            filter.createdAt = dateFilter;
        }

        const skip = (query.page - 1) * query.pageSize;

        const [items, totalItems] = await Promise.all([
            InventoryLogModel.find(filter)
                .populate('productId', 'name imageUrl')
                .populate('performedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(query.pageSize)
                .lean<InventoryLog[]>(),
            InventoryLogModel.countDocuments(filter),
        ]);

        return { items, totalItems };
    }

    async getRecentByProductId(productId: string, limit: number = 20): Promise<InventoryLog[]> {
        return InventoryLogModel.find({ productId })
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean<InventoryLog[]>();
    }

    async getActivitySummary(warehouseId: string = 'default', days: number = 30) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        return InventoryLogModel.aggregate([
            {
                $match: {
                    warehouseId,
                    createdAt: { $gte: dateFrom },
                },
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                },
            },
            { $sort: { count: -1 } },
        ]);
    }

    async getStockMovementTimeline(warehouseId: string = 'default', days: number = 30) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        return InventoryLogModel.aggregate([
            {
                $match: {
                    warehouseId,
                    createdAt: { $gte: dateFrom },
                },
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        type: '$type',
                    },
                    totalQuantity: { $sum: { $abs: '$quantity' } },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: '$_id.date',
                    movements: {
                        $push: {
                            type: '$_id.type',
                            totalQuantity: '$totalQuantity',
                            count: '$count',
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    }

    async getTopMovedProducts(warehouseId: string = 'default', days: number = 30, limit: number = 10) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        return InventoryLogModel.aggregate([
            {
                $match: {
                    warehouseId,
                    type: 'sale',
                    createdAt: { $gte: dateFrom },
                },
            },
            {
                $group: {
                    _id: '$productId',
                    totalSold: { $sum: { $abs: '$quantity' } },
                    transactionCount: { $sum: 1 },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    totalSold: 1,
                    transactionCount: 1,
                    productName: { $ifNull: ['$product.name', 'Unknown'] },
                    productPrice: { $ifNull: ['$product.price', 0] },
                    productImageUrl: { $ifNull: ['$product.imageUrl', ''] },
                },
            },
        ]);
    }

    async getRecentMovements(warehouseId: string = 'default', limit: number = 10) {
        return InventoryLogModel.find({ warehouseId })
            .populate('productId', 'name imageUrl price')
            .populate('performedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean<InventoryLog[]>();
    }

    async getProductTimeline(productId: string, page: number = 1, pageSize: number = 50): Promise<InventoryLogPaginatedResult> {
        const filter = { productId };
        const skip = (page - 1) * pageSize;

        const [items, totalItems] = await Promise.all([
            InventoryLogModel.find(filter)
                .populate('performedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean<InventoryLog[]>(),
            InventoryLogModel.countDocuments(filter),
        ]);

        return { items, totalItems };
    }

    async getLogsByReference(referenceType: InventoryLogReferenceType, referenceId: string): Promise<InventoryLog[]> {
        return InventoryLogModel.find({ referenceType, referenceId })
            .populate('productId', 'name imageUrl')
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean<InventoryLog[]>();
    }

    async getLogCountByType(warehouseId: string = 'default', days: number = 30): Promise<{ type: string; count: number }[]> {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        return InventoryLogModel.aggregate([
            {
                $match: {
                    warehouseId,
                    createdAt: { $gte: dateFrom },
                },
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    type: '$_id',
                    count: 1,
                },
            },
            { $sort: { count: -1 } },
        ]);
    }
}
