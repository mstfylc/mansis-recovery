import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { environments } from '@/utils/helpers';
import { InboxNotification } from '@/types/Notification.interface';

interface UseNotificationSocketOptions {
  onUnreadCount?: (count: number) => void;
  onNewNotification?: (notification: InboxNotification) => void;
  onRefresh?: () => void;
}

export function useNotificationSocket({
  onUnreadCount,
  onNewNotification,
  onRefresh
}: UseNotificationSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  // Use refs for callbacks to avoid reconnecting when callbacks change
  const onUnreadCountRef = useRef(onUnreadCount);
  const onNewNotificationRef = useRef(onNewNotification);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onUnreadCountRef.current = onUnreadCount;
    onNewNotificationRef.current = onNewNotification;
    onRefreshRef.current = onRefresh;
  }, [onUnreadCount, onNewNotification, onRefresh]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const baseUrl = environments.backendBaseUrl;
    if (!baseUrl) return;

    const socket = io(`${baseUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[NotificationSocket] Connected, sid:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[NotificationSocket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[NotificationSocket] Disconnected:', reason);
    });

    socket.on('notification:unreadCount', (data: { count: number }) => {
      onUnreadCountRef.current?.(data.count);
    });

    socket.on('notification:new', (data: InboxNotification) => {
      onNewNotificationRef.current?.(data);
    });

    socket.on('notification:refresh', () => {
      onRefreshRef.current?.();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  return { disconnect };
}
