import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Stack,
  InputAdornment,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { financeService } from '@/data/financeService';
import { formatCurrency } from '@/utils/formatters';
import NumericInput from '@/components/NumericInput';
import { NegativeLimitModalProps } from '@/types/AccountingLedger.interface';

const NegativeLimitModal: React.FC<NegativeLimitModalProps> = ({
  open,
  onClose,
  branchId,
  onSuccess
}) => {
  const { t } = useTranslation();

  const [limitAmount, setLimitAmount] = useState(0);
  const [currentLimit, setCurrentLimit] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && branchId) {
      fetchCurrentLimit();
    }
  }, [open, branchId]);

  const fetchCurrentLimit = async () => {
    if (!branchId) return;

    setFetching(true);
    try {
      const result = await financeService.getNegativeLimit(branchId);

      if (result.hasLimit) {
        setCurrentLimit(result.limitAmount);
        setLimitAmount(Math.abs(result.limitAmount));
      } else {
        setCurrentLimit(null);
        setLimitAmount(0);
      }
    } catch (error: any) {
      console.error('Error fetching negative limit:', error);
      setCurrentLimit(null);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!branchId) {
      setError(t('finance.accounting.branch.required'));
      return;
    }

    if (!limitAmount || limitAmount <= 0) {
      setError(t('finance.accounting.limit.invalid'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await financeService.updateNegativeLimit({
        branchId,
        limitAmount: -Math.abs(limitAmount)
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error saving negative limit:', error);
      setError(
        error.response?.data?.message ||
          t('finance.accounting.limit.save.error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!branchId) return;

    setLoading(true);
    setError('');

    try {
      await financeService.deleteNegativeLimit(branchId);

      setCurrentLimit(null);
      setLimitAmount(0);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error removing negative limit:', error);
      setError(
        error.response?.data?.message ||
          t('finance.accounting.limit.remove.error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLimitAmount(0);
    setCurrentLimit(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('finance.accounting.negative.limit')}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {currentLimit !== null && (
            <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="textSecondary">
                  {t('finance.accounting.current.limit')}:
                </Typography>
                <Chip
                  label={formatCurrency(currentLimit)}
                  color="warning"
                  size="small"
                />
              </Stack>
            </Box>
          )}

          <NumericInput
            fullWidth
            label={t('finance.accounting.limit.amount')}
            value={limitAmount}
            onChange={(value) => setLimitAmount(value)}
            min={0}
            inputProps={{
              startAdornment: (
                <InputAdornment position="start">₺</InputAdornment>
              )
            }}
            helperText={t('finance.accounting.limit.helper')}
            disabled={fetching}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        {currentLimit !== null && (
          <Button
            onClick={handleRemove}
            color="error"
            disabled={loading}
            sx={{ mr: 'auto' }}
          >
            {t('finance.accounting.remove.limit')}
          </Button>
        )}

        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || fetching}
          color="primary"
        >
          {loading ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NegativeLimitModal;
