import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Stack,
  Typography,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { financeService } from '@/data/financeService';
import { formatCurrency } from '@/utils/formatters';
import NumericInput from '@/components/NumericInput';
import { PartialPaymentModalProps } from '@/types/AccountingLedger.interface';

const PartialPaymentModal: React.FC<PartialPaymentModalProps> = ({
  open,
  onClose,
  withdrawal,
  onSuccess
}) => {
  const { t } = useTranslation();

  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!withdrawal) return null;

  const remainingAmount = withdrawal.remainingAmount;

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      setError(t('finance.withdrawal.invalid.amount'));
      return;
    }

    if (amount > remainingAmount) {
      setError(
        t('finance.withdrawal.exceeds.remaining', {
          amount: formatCurrency(remainingAmount)
        })
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      await financeService.partialPaymentByWithdrawal(withdrawal.id, {
        amount: amount,
        note: note.trim() || undefined
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error processing partial payment:', error);

      // Backend'den gelen hata mesajını parse et
      const errorMessage = error.response?.data?.message || '';

      // Translation key'leri kontrol et
      if (errorMessage === 'WITHDRAWAL_INVALID_STATUS_FOR_PAYMENT') {
        setError(t('finance.withdrawal.error.invalid.status'));
      } else if (errorMessage === 'WITHDRAWAL_INVALID_PAYMENT_AMOUNT') {
        setError(t('finance.withdrawal.error.invalid.amount'));
      } else if (errorMessage.startsWith('WITHDRAWAL_EXCEEDS_REMAINING')) {
        // Format: WITHDRAWAL_EXCEEDS_REMAINING|111|400
        const parts = errorMessage.split('|');
        const paymentAmount = parts[1] || '0';
        const remaining = parts[2] || '0';
        setError(
          t('finance.withdrawal.error.exceeds.remaining', {
            amount: paymentAmount,
            remaining: remaining
          })
        );
      } else {
        setError(errorMessage || t('finance.withdrawal.payment.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount(0);
    setNote('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('finance.withdrawal.partial.payment')}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Stack spacing={1.5} sx={{ mb: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" color="textSecondary">
                {t('finance.withdrawal.total.request')}:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(withdrawal.requestedAmount)}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" color="textSecondary">
                {t('finance.withdrawal.already.paid')}:
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                {formatCurrency(withdrawal.paidAmount || 0)}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}
            >
              <Typography variant="body2" fontWeight={700}>
                {t('finance.withdrawal.remaining')}:
              </Typography>
              <Chip
                label={formatCurrency(remainingAmount)}
                color="primary"
                size="small"
              />
            </Stack>
          </Stack>

          <NumericInput
            fullWidth
            label={t('finance.withdrawal.payment.amount')}
            value={amount}
            onChange={(value) => setAmount(value)}
            allowDecimals
            decimalPlaces={2}
            min={0}
            max={remainingAmount || 0}
            InputProps={{
              endAdornment: <Typography variant="body2">₺</Typography>
            }}
            helperText={t('finance.withdrawal.max.amount', {
              amount: formatCurrency(remainingAmount || 0)
            })}
          />

          <TextField
            fullWidth
            label={t('finance.withdrawal.note.optional')}
            multiline
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('finance.withdrawal.note.placeholder')}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          color="primary"
        >
          {loading ? t('processing') : t('finance.withdrawal.pay')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartialPaymentModal;
