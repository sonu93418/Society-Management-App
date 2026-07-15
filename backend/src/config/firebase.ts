import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { env } from './env';
import { logger } from '../utils/logger';

let firebaseApp: App | null = null;

export const initializeFirebase = (): void => {
  if (firebaseApp || getApps().length > 0) {
    firebaseApp = getApps()[0];
    return;
  }

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
    logger.warn('⚠️  Firebase credentials not set. FCM push notifications via Firebase Admin will be disabled.');
    return;
  }

  try {
    // Replace escaped newlines in private key (common when stored in .env files)
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    firebaseApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    logger.info('🔥 Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
};

export const getFirebaseApp = (): App | null => firebaseApp;
