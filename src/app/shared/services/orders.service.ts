import { Injectable, signal } from '@angular/core';

export interface Order {
  id: string;
  items: any[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date;
  shippingAddress: any;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private orders = signal<Order[]>([]);

  getOrders() {
    return this.orders;
  }

  createOrder(cartItems: any[], shippingInfo: any, paymentInfo: any) {
    const order: Order = {
      id: 'ORD-' + Date.now(),
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      status: 'pending',
      createdAt: new Date(),
      shippingAddress: shippingInfo
    };

    this.orders.set([...this.orders(), order]);
    return order;
  }

  getOrderById(id: string) {
    return this.orders().find(order => order.id === id);
  }

  updateOrderStatus(id: string, status: Order['status']) {
    const orders = this.orders();
    const orderIndex = orders.findIndex(order => order.id === id);
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      this.orders.set([...orders]);
    }
  }
}