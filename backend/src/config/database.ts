import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const options = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30 seconds
  socketTimeoutMS: 45000,
  family: 4 // Prioritize IPv4
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, options);
    logger.info(`✅ MongoDB connected (Atlas): ${conn.connection.host}`);
  } catch (error) {
    logger.error('❌ MongoDB Atlas connection failed. Attempting local MongoDB fallback...', error);
    try {
      const localUri = 'mongodb://127.0.0.1:27017/portl';
      const conn = await mongoose.connect(localUri, options);
      logger.info(`✅ MongoDB connected (Local Fallback): ${conn.connection.host}`);
    } catch (localError) {
      logger.error('❌ Local MongoDB fallback connection also failed. Exiting process.', localError);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect in 5 seconds...');
    setTimeout(async () => {
      try {
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(env.MONGODB_URI, options);
          logger.info('✅ MongoDB reconnected successfully');
        }
      } catch (err) {
        logger.error('❌ Failed to reconnect to MongoDB, will retry again:', err);
      }
    }, 5000);
  });
};
