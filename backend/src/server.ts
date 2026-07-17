import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initializeSocket } from './socket';
import { initializeFirebase } from './config/firebase';
import { logger } from './utils/logger';

import { notificationQueueService } from './services/notificationQueue.service';

const startServer = async (): Promise<void> => {
  try {
    // Initialize Firebase Admin SDK (for push notifications)
    initializeFirebase();

    // Connect to MongoDB
    await connectDatabase();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(server);

    // Start background notification queue retry worker
    notificationQueueService.startCronWorker();

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`🚀 Portl API running on port ${env.PORT}`);
      logger.info(`📡 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health: http://localhost:${env.PORT}/health`);
      logger.info(`📋 API: http://localhost:${env.PORT}/api/v1`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
