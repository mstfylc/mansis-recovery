// Firebase Cloud Messaging Service Worker
// This file is auto-generated during build - DO NOT EDIT MANUALLY
// Template: public/firebase-messaging-sw.template.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyDvesoGhKjOWd3gw43eV05Z6daFpRDPHCA',
  authDomain: 'uyanik-kutuphane.firebaseapp.com',
  projectId: 'uyanik-kutuphane',
  storageBucket: 'uyanik-kutuphane.firebasestorage.app',
  messagingSenderId: '699473904976',
  appId: '1:699473904976:web:20cec97dab3b788fbb5855',
  measurementId: 'G-2FQ81SHF6P'
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Bildirim';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/static/images/logo/posanto-icon.png',
    badge: '/static/images/logo/posanto-icon.png',
    data: payload.data || {},
    tag: payload.data?.tag || 'default',
    requireInteraction: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.route || event.notification.data?.deepLink || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
