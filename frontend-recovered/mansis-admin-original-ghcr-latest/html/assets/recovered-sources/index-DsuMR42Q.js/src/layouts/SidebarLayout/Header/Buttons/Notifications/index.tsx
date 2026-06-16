import { useEffect, useState, useRef, useCallback } from 'react';
import {
  alpha,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Tooltip,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationsActiveTwoToneIcon from '@mui/icons-material/NotificationsActiveTwoTone';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { notificationService } from '@/data/notificationService';
import { InboxNotification } from '@/types/Notification.interface';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

const NotificationsBadge = styled(Badge)(
  ({ theme }) => `
    .MuiBadge-badge {
        background-color: ${theme.palette.error.main};
        color: ${theme.palette.error.contrastText};
        min-width: 16px;
        height: 16px;
        padding: 0;
        font-size: 10px;
        font-weight: 700;
        &::after {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            border-radius: 50%;
            box-shadow: 0 0 0 2px ${alpha(theme.palette.error.main, 0.3)};
            content: "";
        }
    }
`
);

function HeaderNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<InboxNotification[]>([]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      console.log('[Badge] Unread count from API:', res.count);
      setUnreadCount(res.count);
    } catch {
      // silent
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await notificationService.getRecentInbox({
        page: 0,
        limit: 5
      } as any);
      setRecent(res?.data || res || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useNotificationSocket({
    onUnreadCount: (count) => {
      setUnreadCount(count);
    },
    onNewNotification: (notification) => {
      setUnreadCount((prev) => prev + 1);
      setRecent((prev) => [notification, ...prev].slice(0, 5));
    },
    onRefresh: () => {
      fetchUnreadCount();
    }
  });

  const handleOpen = () => {
    setOpen(true);
    fetchRecent();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setRecent((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  return (
    <>
      <Tooltip arrow title={t('notification.inbox.title')}>
        <IconButton color="primary" ref={ref} onClick={handleOpen}>
          <NotificationsBadge
            badgeContent={unreadCount}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <NotificationsActiveTwoToneIcon />
          </NotificationsBadge>
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={ref.current}
        onClose={() => setOpen(false)}
        open={isOpen}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box
          sx={{ p: 2, minWidth: 360 }}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h5">{t('notification.inbox.title')}</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              {t('notification.inbox.markAllRead')}
            </Button>
          )}
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {recent.length === 0 && (
            <ListItem sx={{ p: 2 }}>
              <Typography color="text.secondary">
                {t('notification.inbox.empty')}
              </Typography>
            </ListItem>
          )}
          {recent.map((n) => (
            <ListItem
              key={n.id}
              sx={{
                p: 2,
                borderLeft: n.isRead ? 'none' : '3px solid',
                borderLeftColor: 'primary.main',
                pl: n.isRead ? 2 : '13px',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'transparent' }
              }}
              onClick={() => {
                setOpen(false);
                if (n.deepLink) navigate(n.deepLink);
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    fontWeight={n.isRead ? 'normal' : 'bold'}
                    variant="subtitle2"
                  >
                    {n.title}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.primary" noWrap>
                      {n.body}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                        locale: tr
                      })}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button
            size="small"
            onClick={() => {
              setOpen(false);
              navigate('/notifications/inbox');
            }}
          >
            {t('notification.inbox.viewAll')}
          </Button>
        </Box>
      </Popover>
    </>
  );
}

export default HeaderNotifications;
