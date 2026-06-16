import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Stack,
  InputAdornment
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { financeService } from '@/data/financeService';
import NumericInput from '@/components/NumericInput';
import {
  ManualAdjustmentModalProps,
  AdjustmentType,
  ADJUSTMENT_TYPE
} from '@/types/AccountingLedger.interface';

const ManualAdjustmentModal: React.FC<ManualAdjustmentModalProps> = ({
  open,
  onClose,
  branchId,
  onSuccess
}) => {
  const { t } = useTranslation();

  const [type, setType] = useState<AdjustmentType>(ADJUSTMENT_TYPE.POSITIVE);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parseValidationError = (errorResponse: any): string => {
    if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
      const errors = errorResponse.errors;
      if (errors.length > 0) {
        const firstError = errors[0];
        const property = firstError.property;
        const constraints = firstError.constraints;

        if (constraints) {
          if (property === 'description' && constraints.minLength) {
            return t('finance.accounting.description.min.length');
          }
        }
      }
    }
    return errorResponse?.message || t('finance.accounting.adjustment.error');
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      setError(t('finance.accounting.invalid.amount'));
      return;
    }

    if (!description.trim()) {
      setError(t('finance.accounting.description.required'));
      return;
    }

    if (!branchId) {
      setError(t('finance.accounting.branch.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalAmount =
        type === ADJUSTMENT_TYPE.POSITIVE ? amount : -Math.abs(amount);

      await financeService.createManualAdjustment({
        branchId,
        amount: finalAmount,
        description: description.trim()
      });

      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error('Error saving manual adjustment:', error);
      const errorMessage = parseValidationError(error.response?.data);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType(ADJUSTMENT_TYPE.POSITIVE);
    setAmount(0);
    setDescription('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('finance.accounting.manual.adjustment')}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 1.5 }}>
              {t('finance.accounting.adjustment.type')}
            </FormLabel>
            <RadioGroup
              row
              value={type}
              onChange={(e) => setType(e.target.value as AdjustmentType)}
              sx={{ gap: 3 }}
            >
              <FormControlLabel
                value={ADJUSTMENT_TYPE.POSITIVE}
                control={<Radio />}
                label={t('finance.accounting.add.balance')}
              />
              <FormControlLabel
                value={ADJUSTMENT_TYPE.NEGATIVE}
                control={<Radio />}
                label={t('finance.accounting.remove.balance')}
              />
            </RadioGroup>
          </FormControl>

          <NumericInput
            fullWidth
            label={t('finance.accounting.amount')}
            value={amount}
            onChange={(value) => setAmount(value)}
            allowDecimals
            decimalPlaces={2}
            min={0}
            max={99999999.99}
            inputProps={{
              startAdornment: (
                <InputAdornment position="start">₺</InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label={t('finance.accounting.description')}
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('finance.accounting.description.placeholder')}
            required
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
          {loading ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualAdjustmentModal;
