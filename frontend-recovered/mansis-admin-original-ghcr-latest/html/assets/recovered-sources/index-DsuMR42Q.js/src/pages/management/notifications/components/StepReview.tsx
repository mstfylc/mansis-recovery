import type { FC } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import NotificationPreview from './NotificationPreview';
import {
  NotificationCategory,
  AudienceType
} from '@/types/Notification.interface';

interface StepReviewProps {
  title: string;
  body: string;
  imageUrl: string;
  category: NotificationCategory;
  audienceType: AudienceType;
  sendNow: boolean;
  scheduledAt: Date | null;
}

const StepReview: FC<StepReviewProps> = ({
  title,
  body,
  imageUrl,
  category,
  audienceType,
  sendNow,
  scheduledAt
}) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="h6" mb={2}>
          {t('notification.wizard.summary')}
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography>
            <strong>{t('notification.campaign.title')}:</strong> {title}
          </Typography>
          <Typography>
            <strong>{t('notification.campaign.category')}:</strong>{' '}
            {t(`notification.category.${category.toLowerCase()}`)}
          </Typography>
          <Typography>
            <strong>{t('notification.audience.type')}:</strong>{' '}
            {t(`notification.audience.${audienceType.toLowerCase()}`)}
          </Typography>
          <Typography>
            <strong>{t('notification.schedule.title')}:</strong>{' '}
            {sendNow
              ? t('notification.schedule.sendNow')
              : scheduledAt?.toLocaleString()}
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <NotificationPreview
          title={title}
          body={body}
          imageUrl={imageUrl || undefined}
          category={category}
        />
      </Grid>
    </Grid>
  );
};

export default StepReview;
