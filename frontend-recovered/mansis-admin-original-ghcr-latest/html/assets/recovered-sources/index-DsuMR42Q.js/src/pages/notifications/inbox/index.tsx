import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Button,
  Box
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ArchiveIcon from '@mui/icons-material/Archive';
import InboxIcon from '@mui/icons-material/Inbox';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { notificationService } from '@/data/notificationService';
import { useSnackbar } from 'notistack';
import PageHeader from './PageHeader';
import NotificationList from './NotificationList';
import NotificationFilters from './NotificationFilters';

function NotificationInbox() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [category, setCategory] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      enqueueSnackbar(t('notification.inbox.allMarkedRead'), {
        variant: 'success'
      });
      setRefreshKey((prev) => prev + 1);
    } catch {
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('notification.inbox.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Card sx={{ mx: 3 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <NotificationFilters
                value={category}
                onChange={(v) => {
                  setCategory(v);
                  setIsArchived(false);
                }}
                disabled={isArchived}
              />
            </Box>
          }
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                variant={isArchived ? 'contained' : 'outlined'}
                startIcon={
                  isArchived ? (
                    <InboxIcon fontSize="small" />
                  ) : (
                    <ArchiveIcon fontSize="small" />
                  )
                }
                onClick={() => {
                  setIsArchived((prev) => !prev);
                  setCategory('');
                }}
              >
                {isArchived
                  ? t('notification.inbox.title')
                  : t('notification.inbox.archiveLabel')}
              </Button>
              {!isArchived && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MarkEmailReadIcon />}
                  onClick={handleMarkAllRead}
                >
                  {t('notification.inbox.markAllRead')}
                </Button>
              )}
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          <NotificationList
            key={`${refreshKey}-${isArchived}`}
            category={category}
            isArchived={isArchived}
          />
        </CardContent>
      </Card>
    </>
  );
}

export default NotificationInbox;
