import type { FC } from 'react';
import { Box, Alert } from '@mui/material';
import SchedulePicker from './SchedulePicker';

interface StepScheduleProps {
  sendNow: boolean;
  setSendNow: (v: boolean) => void;
  scheduledAt: Date | null;
  setScheduledAt: (v: Date | null) => void;
  expiresAt: Date | null;
  setExpiresAt: (v: Date | null) => void;
  stepErrors: Record<string, string>;
}

const StepSchedule: FC<StepScheduleProps> = ({
  sendNow,
  setSendNow,
  scheduledAt,
  setScheduledAt,
  expiresAt,
  setExpiresAt,
  stepErrors
}) => {
  return (
    <>
      {stepErrors.scheduledAt && (
        <Box mb={2}>
          <Alert severity="error">{stepErrors.scheduledAt}</Alert>
        </Box>
      )}
      {stepErrors.expiresAt && (
        <Box mb={2}>
          <Alert severity="error">{stepErrors.expiresAt}</Alert>
        </Box>
      )}
      <SchedulePicker
        sendNow={sendNow}
        onSendNowChange={setSendNow}
        scheduledAt={scheduledAt}
        onScheduledAtChange={setScheduledAt}
        expiresAt={expiresAt}
        onExpiresAtChange={setExpiresAt}
      />
    </>
  );
};

export default StepSchedule;
