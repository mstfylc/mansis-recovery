import { useState, useEffect, useCallback } from 'react';
import { List, Box, Typography, CircularProgress, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@/data/notificationService';
import { InboxNotification } from '@/types/Notification.interface';
import NotificationItem from './NotificationItem';

interface NotificationListProps {
  category: string;
  isArchived?: boolean;
}

function NotificationList({
  category,
  isArchived = false
}: NotificationListProps) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        setLoading(true);
        const res = await notificationService.getRecentInbox({
          page: pageNum - 1,
          limit: 20,
          ...(category && { category }),
          isArchived
        });
        const items = res.data ?? [];
        setNotifications((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(items.length === 20);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [category, isArchived]
  );

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, true);
  }, [category, isArchived, fetchNotifications]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const handleUpdate = (id: number, updates: Partial<InboxNotification>) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  const handleRemove = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading && notifications.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="text.secondary">
          {t('notification.inbox.empty')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List disablePadding>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </List>
      {hasMore && (
        <Box textAlign="center" p={2}>
          <Button onClick={handleLoadMore} disabled={loading}>
            {loading ? t('common.loading') : t('common.loadMore')}
          </Button>
        </Box>
      )}
    </>
  );
}

export default NotificationList;
