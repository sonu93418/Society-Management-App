import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/token';
import { logger } from '../utils/logger';

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`🔌 Socket connected: ${user.userId} (${user.role})`);

    // Join society room
    socket.join(`society:${user.societyId}`);

    // Join personal room for direct notifications
    socket.join(`user:${user.userId}`);

    // Visitor events
    socket.on('visitor:request', (data) => {
      io.to(`user:${data.residentId}`).emit('visitor:request', data);
    });

    socket.on('visitor:approved', (data) => {
      io.to(`society:${user.societyId}`).emit('visitor:approved', data);
    });

    socket.on('visitor:rejected', (data) => {
      io.to(`society:${user.societyId}`).emit('visitor:rejected', data);
    });

    socket.on('visitor:entry', (data) => {
      io.to(`user:${data.residentId}`).emit('visitor:entry', data);
      io.to(`society:${user.societyId}`).emit('guard:activity', data);
    });

    socket.on('visitor:exit', (data) => {
      io.to(`user:${data.residentId}`).emit('visitor:exit', data);
      io.to(`society:${user.societyId}`).emit('guard:activity', data);
    });

    // Notification event
    socket.on('notification', (data) => {
      io.to(`user:${data.userId}`).emit('notification', data);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${user.userId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToSociety = (societyId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`society:${societyId}`).emit(event, data);
  }
};
