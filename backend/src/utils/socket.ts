import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from './logger';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info('socket_connected', { socketId: socket.id });

    socket.on('disconnect', () => {
      logger.info('socket_disconnected', { socketId: socket.id });
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
