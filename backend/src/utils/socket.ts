import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust this in production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitStockUpdate = (productId: string, newStock: number) => {
  if (io) {
    io.emit('product-stock-updated', { productId, newStock });
  }
};

// ---------------------------------------------------------------------------
// Order status real-time push
// ---------------------------------------------------------------------------

export interface OrderStatusUpdatePayload {
  orderId: string;
  fromStatus: string;
  toStatus: string;
  performedBy: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Broadcasts an order status change to all connected clients.
 * Front-end sockets should listen for 'order:status-changed' to update
 * live order views without a manual refresh.
 */
export const emitOrderStatusUpdate = (payload: OrderStatusUpdatePayload): void => {
  if (io) {
    io.emit('order:status-changed', payload);
  }
};

export interface InventoryUpdatePayload {
  availableStock: number;
  reservedStock: number;
  totalStock: number;
  status: string;
}

export const emitInventoryUpdate = (productId: string, data: InventoryUpdatePayload) => {
  if (io) {
    io.emit('inventory-updated', { productId, ...data });
  }
};

export const emitLowStockAlert = (productId: string, currentStock: number, threshold: number) => {
  if (io) {
    io.emit('low-stock-alert', { productId, currentStock, threshold });
  }
};
