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

interface MembershipModalProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  createdAt: string;
}

const MembershipModal = ({
  open,
  onClose,
  onApprove,
  createdAt
}: MembershipModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('membership.purchase.confirmation')}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {t('membership.confirm.message')}
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

export default MembershipModal;
