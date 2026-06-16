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

interface ExamModalProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  title: string;
  amount: number;
  startDate: string;
  createdAt: string;
}

const ExamModal = ({
  open,
  onClose,
  onApprove,
  title,
  amount,
  startDate,
  createdAt
}: ExamModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('exam.purchase.confirmation')}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('amount')}: {amount}
        </Typography>
        {startDate && (
          <Typography variant="body2" color="textSecondary">
            {t('start.date')}: {formatDateToDayMonthYearTime(startDate)}
          </Typography>
        )}
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

export default ExamModal;
