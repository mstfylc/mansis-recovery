import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/config/firebase.config';

let messagingInstance: Messaging | null = null;

export const initFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (messagingInstance) return messagingInstance;
  messagingInstance = await getFirebaseMessaging();
  return messagingInstance;
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await initFirebaseMessaging();
    if (!messaging) return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    );

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration
    });
    return token;
  } catch {
    // FCM token retrieval failed — silent fail, push disabled
    return null;
  }
};

export const listenToForeground = async (
  callback: (payload: any) => void
): Promise<(() => void) | undefined> => {
  const messaging = await initFirebaseMessaging();
  if (!messaging) return undefined;
  return onMessage(messaging, callback);
};
