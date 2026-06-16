import { useEffect, useRef } from 'react';
import { getFCMToken, listenToForeground } from '@/utils/firebase';
import { notificationService } from '@/data/notificationService';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

export function useAdminPush() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let unsubForeground: (() => void) | undefined;

    const init = async () => {
      try {
        // Guard: skip if Notification API is unavailable (unsupported browsers, non-secure contexts)
        if (typeof window === 'undefined' || !('Notification' in window))
          return;

        // Only proceed if the user has already granted permission.
        // Don't auto-prompt — a dedicated UI should handle the first-time permission request.
        if (Notification.permission !== 'granted') return;

        const token = await getFCMToken();
        if (token) {
          await notificationService.registerFcmToken(token);
        }
      } catch {
        // Silent fail
      }

      unsubForeground = await listenToForeground((payload) => {
        enqueueSnackbar(
          payload.notification?.title || t('notification.push.newNotification'),
          {
            variant: 'info'
          }
        );
      });
    };

    init();

    return () => {
      unsubForeground?.();
    };
  }, [enqueueSnackbar, t]);
}
