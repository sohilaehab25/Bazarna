import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
    AdminAdjustPayload,
    AdminImportApi,
    AdminImportPayload,
    AdminImportResult,
    AdminInventoryActivityApi,
    AdminInventoryActivityEntry,
    AdminInventoryDashboardApi,
    AdminInventoryDashboardData,
    AdminInventoryHistoryApi,
    AdminInventoryListApi,
    AdminInventoryListResponse,
    AdminInventoryLogEntry,
    AdminInventoryLogsApi,
    AdminInventoryLogsQuery,
    AdminInventoryLogsResponse,
    AdminInventoryLowStockApi,
    AdminInventoryQuery,
    AdminInventoryRecord,
    AdminInventoryRecordApi,
    AdminInventoryStats,
    AdminInventoryStatsApi,
    AdminInventorySyncApi,
    AdminInventoryTimelineApi,
    AdminInventoryTimelineDay,
    AdminInventoryTopSellingApi,
    AdminInventoryTopSellingProduct,
    AdminRefundApi,
    AdminRefundPayload,
    AdminRestockPayload,
    AdminThresholdPayload,
    AdminTransferApi,
    AdminTransferPayload,
} from './admin-inventory.contracts';

@Injectable({
    providedIn: 'root',
})
export class AdminInventoryApiService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:3009/api';

    getInventoryList(query: AdminInventoryQuery): Observable<AdminInventoryListResponse> {
        let params = new HttpParams()
            .set('page', String(query.page))
            .set('pageSize', String(query.pageSize))
            .set('sortBy', query.sortBy)
            .set('sortOrder', query.sortOrder)
            .set('status', query.status)
            .set('warehouseId', query.warehouseId);

        if (query.search.trim().length > 0) {
            params = params.set('search', query.search.trim());
        }

        return this.http
            .get<AdminInventoryListApi>(`${this.apiUrl}/inventory`, { params })
            .pipe(map((response) => response.data));
    }

    getStats(warehouseId: string = 'default'): Observable<AdminInventoryStats> {
        const params = new HttpParams().set('warehouseId', warehouseId);
        return this.http
            .get<AdminInventoryStatsApi>(`${this.apiUrl}/inventory/stats`, { params })
            .pipe(map((response) => response.data));
    }

    getLowStockAlerts(warehouseId: string = 'default'): Observable<AdminInventoryRecord[]> {
        const params = new HttpParams().set('warehouseId', warehouseId);
        return this.http
            .get<AdminInventoryLowStockApi>(`${this.apiUrl}/inventory/low-stock`, { params })
            .pipe(map((response) => response.data));
    }

    getLogs(query: AdminInventoryLogsQuery): Observable<AdminInventoryLogsResponse> {
        let params = new HttpParams()
            .set('page', String(query.page))
            .set('pageSize', String(query.pageSize));

        if (query.productId) {
            params = params.set('productId', query.productId);
        }
        if (query.type && query.type !== 'all') {
            params = params.set('type', query.type);
        }
        if (query.referenceType && query.referenceType !== 'all') {
            params = params.set('referenceType', query.referenceType);
        }
        if (query.performedBy) {
            params = params.set('performedBy', query.performedBy);
        }
        if (query.warehouseId) {
            params = params.set('warehouseId', query.warehouseId);
        }
        if (query.dateFrom) {
            params = params.set('dateFrom', query.dateFrom);
        }
        if (query.dateTo) {
            params = params.set('dateTo', query.dateTo);
        }
        if (query.search && query.search.trim().length > 0) {
            params = params.set('search', query.search.trim());
        }

        return this.http
            .get<AdminInventoryLogsApi>(`${this.apiUrl}/inventory/logs`, { params })
            .pipe(map((response) => response.data));
    }

    getProductInventory(productId: string): Observable<AdminInventoryRecord> {
        return this.http
            .get<AdminInventoryRecordApi>(`${this.apiUrl}/inventory/product/${productId}`)
            .pipe(map((response) => response.data));
    }

    getProductHistory(productId: string, limit: number = 50): Observable<AdminInventoryLogEntry[]> {
        const params = new HttpParams().set('limit', String(limit));
        return this.http
            .get<AdminInventoryHistoryApi>(`${this.apiUrl}/inventory/product/${productId}/history`, { params })
            .pipe(map((response) => response.data));
    }

    getActivitySummary(warehouseId: string = 'default', days: number = 30): Observable<AdminInventoryActivityEntry[]> {
        const params = new HttpParams()
            .set('warehouseId', warehouseId)
            .set('days', String(days));
        return this.http
            .get<AdminInventoryActivityApi>(`${this.apiUrl}/inventory/activity-summary`, { params })
            .pipe(map((response) => response.data));
    }

    restock(payload: AdminRestockPayload): Observable<AdminInventoryRecord> {
        return this.http
            .post<AdminInventoryRecordApi>(`${this.apiUrl}/inventory/restock`, payload)
            .pipe(map((response) => response.data));
    }

    adjust(payload: AdminAdjustPayload): Observable<AdminInventoryRecord> {
        return this.http
            .post<AdminInventoryRecordApi>(`${this.apiUrl}/inventory/adjust`, payload)
            .pipe(map((response) => response.data));
    }

    setThreshold(payload: AdminThresholdPayload): Observable<AdminInventoryRecord> {
        return this.http
            .patch<AdminInventoryRecordApi>(`${this.apiUrl}/inventory/threshold`, payload)
            .pipe(map((response) => response.data));
    }

    syncFromProducts(): Observable<{ synced: number }> {
        return this.http
            .post<AdminInventorySyncApi>(`${this.apiUrl}/inventory/sync`, {})
            .pipe(map((response) => response.data));
    }

    getDashboardAnalytics(warehouseId: string = 'default', days: number = 30): Observable<AdminInventoryDashboardData> {
        const params = new HttpParams()
            .set('warehouseId', warehouseId)
            .set('days', String(days));
        return this.http
            .get<AdminInventoryDashboardApi>(`${this.apiUrl}/inventory/dashboard`, { params })
            .pipe(map((response) => response.data));
    }

    getTopSelling(warehouseId: string = 'default', days: number = 30, limit: number = 10): Observable<AdminInventoryTopSellingProduct[]> {
        const params = new HttpParams()
            .set('warehouseId', warehouseId)
            .set('days', String(days))
            .set('limit', String(limit));
        return this.http
            .get<AdminInventoryTopSellingApi>(`${this.apiUrl}/inventory/top-selling`, { params })
            .pipe(map((response) => response.data));
    }

    getTimeline(warehouseId: string = 'default', days: number = 30): Observable<AdminInventoryTimelineDay[]> {
        const params = new HttpParams()
            .set('warehouseId', warehouseId)
            .set('days', String(days));
        return this.http
            .get<AdminInventoryTimelineApi>(`${this.apiUrl}/inventory/timeline`, { params })
            .pipe(map((response) => response.data));
    }

    getProductTimeline(productId: string, page: number = 1, pageSize: number = 50): Observable<AdminInventoryLogsResponse> {
        const params = new HttpParams()
            .set('page', String(page))
            .set('pageSize', String(pageSize));
        return this.http
            .get<AdminInventoryLogsApi>(`${this.apiUrl}/inventory/product/${productId}/timeline`, { params })
            .pipe(map((response) => response.data));
    }

    refund(payload: AdminRefundPayload): Observable<AdminInventoryRecord> {
        return this.http
            .post<AdminRefundApi>(`${this.apiUrl}/inventory/refund`, payload)
            .pipe(map((response) => response.data));
    }

    importStock(payload: AdminImportPayload): Observable<AdminImportResult> {
        return this.http
            .post<AdminImportApi>(`${this.apiUrl}/inventory/import`, payload)
            .pipe(map((response) => response.data));
    }

    transfer(payload: AdminTransferPayload): Observable<{ from: AdminInventoryRecord; to: AdminInventoryRecord }> {
        return this.http
            .post<AdminTransferApi>(`${this.apiUrl}/inventory/transfer`, payload)
            .pipe(map((response) => response.data));
    }
}
