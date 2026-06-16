import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';

interface DailyLoginModalProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  amount: number;
  createdAt: string;
}

const DailyLoginModal = ({
  open,
  onClose,
  onApprove,
  amount,
  createdAt
}: DailyLoginModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('daily.login.confirmation')}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {t('daily.login.confirm.message')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('amount')}: {amount}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('created.at')}: {formatDateToDayMonthYearTime(createdAt)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={onApprove} variant="contained" color="primary">
          {t('approve')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyLoginModal;
