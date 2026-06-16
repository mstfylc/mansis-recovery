import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Skeleton
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { useTranslation } from 'react-i18next';
import { SegmentPreview } from '@/types/Notification.interface';

interface AudiencePreviewProps {
  preview: SegmentPreview | null;
  loading?: boolean;
}

function AudiencePreview({ preview, loading }: AudiencePreviewProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width={200} height={40} />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
        ))}
      </Paper>
    );
  }

  if (!preview) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">
          {t('notification.audience.noPreview')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <GroupIcon color="primary" />
        <Typography variant="h6">
          {t('notification.audience.estimatedCount', { count: preview.count })}
        </Typography>
      </Box>

      {preview.sample.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            {t('notification.audience.sampleUsers')}
          </Typography>
          <List dense>
            {preview.sample.map((user) => (
              <ListItem key={user.id}>
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                    {user.name[0]}
                    {user.surname[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.name} ${user.surname}`}
                  secondary={user.email || user.phone}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
}

export default AudiencePreview;
