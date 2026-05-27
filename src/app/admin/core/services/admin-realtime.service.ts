import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SocketService } from '../../../shared/services/socket.service';

export interface AdminRealtimeEventMap {
  'product-stock-updated': { productId: string; newStock: number };
  'order-created': { orderId: string };
  'order-status-updated': { orderId: string; status: string };
  'inventory-updated': {
    productId: string;
    availableStock: number;
    reservedStock: number;
    totalStock: number;
    status: string;
  };
  'low-stock-alert': { productId: string; currentStock: number; threshold: number };
}

@Injectable({
  providedIn: 'root',
})
export class AdminRealtimeService {
  private readonly socketService = inject(SocketService);

  onEvent<K extends keyof AdminRealtimeEventMap>(
    eventName: K
  ): Observable<AdminRealtimeEventMap[K]> {
    return this.socketService.onEvent<AdminRealtimeEventMap[K]>(eventName);
  }
}
