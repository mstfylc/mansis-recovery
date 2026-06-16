import type { FC, Dispatch, SetStateAction } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SegmentBuilder from './SegmentBuilder';
import UserChipSelect from './UserChipSelect';
import AudiencePreview from './AudiencePreview';
import {
  AudienceType,
  SegmentFilter,
  SegmentPreview
} from '@/types/Notification.interface';

interface StepAudienceProps {
  audienceType: AudienceType;
  setAudienceType: (v: AudienceType) => void;
  segmentFilter: SegmentFilter;
  setSegmentFilter: (v: SegmentFilter) => void;
  individualUsers: any[];
  setIndividualUsers: (v: any[]) => void;
  preview: SegmentPreview | null;
  setPreview: (v: SegmentPreview | null) => void;
  stepErrors: Record<string, string>;
  setStepErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

const StepAudience: FC<StepAudienceProps> = ({
  audienceType,
  setAudienceType,
  segmentFilter,
  setSegmentFilter,
  individualUsers,
  setIndividualUsers,
  preview,
  setPreview,
  stepErrors,
  setStepErrors
}) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        {stepErrors.audience && (
          <Box mb={2}>
            <Alert severity="error">{stepErrors.audience}</Alert>
          </Box>
        )}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('notification.audience.type')}</InputLabel>
          <Select
            value={audienceType}
            label={t('notification.audience.type')}
            onChange={(e) => {
              setAudienceType(e.target.value as AudienceType);
              if (stepErrors.audience)
                setStepErrors((prev) => ({ ...prev, audience: '' }));
            }}
          >
            <MenuItem value={AudienceType.ALL}>
              {t('notification.audience.all')}
            </MenuItem>
            <MenuItem value={AudienceType.SEGMENT}>
              {t('notification.audience.segment')}
            </MenuItem>
            <MenuItem value={AudienceType.INDIVIDUAL}>
              {t('notification.audience.individual')}
            </MenuItem>
          </Select>
        </FormControl>

        {audienceType === AudienceType.SEGMENT && (
          <SegmentBuilder
            filter={segmentFilter}
            onChange={(f) => {
              setSegmentFilter(f);
              if (stepErrors.audience)
                setStepErrors((prev) => ({ ...prev, audience: '' }));
            }}
            onPreview={setPreview}
          />
        )}

        {audienceType === AudienceType.INDIVIDUAL && (
          <UserChipSelect
            selectedUsers={individualUsers}
            onChange={(users) => {
              setIndividualUsers(users);
              if (stepErrors.audience)
                setStepErrors((prev) => ({ ...prev, audience: '' }));
            }}
          />
        )}
      </Grid>
      <Grid item xs={12} md={5}>
        <AudiencePreview preview={preview} />
      </Grid>
    </Grid>
  );
};

export default StepAudience;
