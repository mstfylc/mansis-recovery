import {
  ListItem,
  ListItemText,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { formatDistanceToNow, Locale } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@/data/notificationService';
import { InboxNotification } from '@/types/Notification.interface';
import React from 'react';

interface NotificationItemProps {
  notification: InboxNotification;
  onUpdate: (id: number, updates: Partial<InboxNotification>) => void;
  onRemove: (id: number) => void;
}

const dateFnsLocaleMap: Record<string, Locale> = { tr, en: enUS };

function NotificationItem({
  notification,
  onUpdate,
  onRemove
}: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? enUS;
  const navigate = useNavigate();
  const n = notification;

  const handleRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(n.id);
      onUpdate(n.id, { isRead: true, readAt: new Date().toISOString() });
    } catch {
      // silent
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.archiveInboxItem(n.id);
      onRemove(n.id);
    } catch {
      // silent
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteInboxItem(n.id);
      onRemove(n.id);
    } catch {
      // silent
    }
  };

  const handleClick = () => {
    if (!n.isRead) {
      notificationService.markAsRead(n.id).catch(() => {});
      onUpdate(n.id, { isRead: true });
    }
    if (n.deepLink) navigate(n.deepLink);
  };

  return (
    <ListItem
      sx={{
        py: 1.5,
        px: 2,
        bgcolor: 'transparent',
        borderLeft: n.isRead ? 'none' : '3px solid',
        borderLeftColor: 'primary.main',
        pl: n.isRead ? 2 : '13px',
        cursor: n.deepLink ? 'pointer' : 'default',
        '&:hover': { bgcolor: 'transparent' },
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
      onClick={handleClick}
      secondaryAction={
        <Box display="flex" gap={0.5}>
          {!n.isRead && (
            <Tooltip title={t('notification.inbox.markRead')}>
              <IconButton size="small" onClick={handleRead}>
                <MarkEmailReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('notification.inbox.archive')}>
            <IconButton size="small" onClick={handleArchive}>
              <ArchiveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton size="small" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      {!n.isRead && (
        <FiberManualRecordIcon
          sx={{ fontSize: 10, color: 'primary.main', mr: 1 }}
        />
      )}
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="subtitle2"
              fontWeight={n.isRead ? 'normal' : 'bold'}
            >
              {n.title}
            </Typography>
            {n.category && (
              <Chip
                label={t(`notification.category.${n.category.toLowerCase()}`)}
                size="small"
                sx={{ height: 20, fontSize: 11 }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {n.body}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(n.createdAt), {
                addSuffix: true,
                locale: dateFnsLocale
              })}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
}

export default NotificationItem;
