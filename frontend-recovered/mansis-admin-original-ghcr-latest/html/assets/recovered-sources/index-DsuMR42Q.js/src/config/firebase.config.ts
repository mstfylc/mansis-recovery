import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    });
  }
  return app;
}

export const getFirebaseMessaging = async () => {
  // Skip initialization when Firebase env vars are not configured
  if (
    !import.meta.env.VITE_FIREBASE_API_KEY ||
    !import.meta.env.VITE_FIREBASE_APP_ID
  ) {
    return null;
  }
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(getApp());
};

export { getApp as getFirebaseApp };
