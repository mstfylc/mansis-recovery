import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ResultModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  success: boolean;
}

const ResultModal = ({
  open,
  onClose,
  title,
  description,
  success
}: ResultModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          color={success ? 'success' : 'error'}
        >
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResultModal;
