import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import StyledDatePicker from '@/components/date&time/StyledDatePicker';
import { useTranslation } from 'react-i18next';

interface SchedulePickerProps {
  sendNow: boolean;
  onSendNowChange: (value: boolean) => void;
  scheduledAt: Date | null;
  onScheduledAtChange: (date: Date | null) => void;
  expiresAt: Date | null;
  onExpiresAtChange: (date: Date | null) => void;
}

function SchedulePicker({
  sendNow,
  onSendNowChange,
  scheduledAt,
  onScheduledAtChange,
  expiresAt,
  onExpiresAtChange
}: SchedulePickerProps) {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h6">{t('notification.schedule.title')}</Typography>

      <FormControlLabel
        control={
          <Switch
            checked={sendNow}
            onChange={(e) => onSendNowChange(e.target.checked)}
          />
        }
        label={t('notification.schedule.sendNow')}
      />

      {!sendNow && (
        <StyledDatePicker
          label={t('notification.schedule.scheduledAt')}
          selected={scheduledAt}
          onChange={onScheduledAtChange}
          showTimeSelect
          minDate={new Date()}
          required
        />
      )}

      <Alert severity="info" variant="outlined">
        {t('notification.schedule.timezone')}
      </Alert>

      <Box>
        <StyledDatePicker
          label={t('notification.schedule.expiresAtLabel')}
          selected={expiresAt}
          onChange={onExpiresAtChange}
          showTimeSelect
          minDate={scheduledAt || new Date()}
          helperText={t('notification.schedule.expiresAtHelper')}
        />
      </Box>
    </Box>
  );
}

export default SchedulePicker;
