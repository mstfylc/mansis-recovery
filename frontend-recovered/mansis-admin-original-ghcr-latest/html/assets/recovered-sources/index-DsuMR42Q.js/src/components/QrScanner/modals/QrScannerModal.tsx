import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: () => void;
  qrData: string;
  setQrData: (data: string) => void;
  loading: boolean;
}

const QrScannerModal = ({
  open,
  onClose,
  onScan,
  qrData,
  setQrData,
  loading
}: QrScannerModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('scan.qr.code')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('scan.qr.code.instruction')}</DialogContentText>
        <Box sx={{ mt: 2 }}>
          <TextField
            id="qr-input"
            label={t('qr.code.data')}
            fullWidth
            autoFocus
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            variant="outlined"
            placeholder={t('qr.code.placeholder')}
            disabled={loading}
          />
        </Box>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={onScan}
          variant="contained"
          color="primary"
          disabled={!qrData || loading}
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QrScannerModal;
