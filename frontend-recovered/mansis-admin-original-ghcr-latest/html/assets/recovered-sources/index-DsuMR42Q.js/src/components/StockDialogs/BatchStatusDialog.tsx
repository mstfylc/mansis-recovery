import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { BranchStock } from '@/types/stock';
import { BatchStatus } from '@/types/batch';
import * as batchService from '@/data/batchService';
import * as stockService from '@/data/stockService';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { getStockErrorMessage } from '@/utils/errorHandlers';

type BatchAction = 'QUARANTINED' | 'RECALLED' | 'DISPOSED';

interface BatchStatusDialogProps {
  open: boolean;
  onClose: () => void;
  stock: BranchStock | null;
  onSuccess: (message: string, severity: 'success' | 'error') => void;
}

const BatchStatusDialog = ({
  open,
  onClose,
  stock,
  onSuccess
}: BatchStatusDialogProps) => {
  const { t } = useTranslation();
  const [action, setAction] = useState<BatchAction>('QUARANTINED');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine available actions based on current batch status
  const availableActions = useMemo(() => {
    if (!stock?.batch) return [];

    const currentStatus = stock.batch.status;

    switch (currentStatus) {
      case 'ACTIVE':
      case 'NEAR_EXPIRY':
        // Can quarantine or recall
        return ['QUARANTINED', 'RECALLED'] as BatchAction[];
      case 'QUARANTINED':
      case 'EXPIRED':
        // Can dispose
        return ['DISPOSED'] as BatchAction[];
      case 'RECALLED':
        // Can dispose
        return ['DISPOSED'] as BatchAction[];
      default:
        return [];
    }
  }, [stock?.batch]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && availableActions.length > 0) {
      setAction(availableActions[0]);
      setReason('');
      setNotes('');
    }
  }, [open, availableActions]);

  if (!stock || !stock.batch) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      onSuccess(t('batch.reason.required'), 'error');
      return;
    }

    setLoading(true);
    try {
      if (action === 'DISPOSED') {
        // Use dispose API - this also zeroes the stock
        await stockService.disposeBatch({
          batchId: stock.batch!.id,
          reason: reason.trim(),
          notes: notes.trim() || undefined
        });
        onSuccess(t('batch.disposed.successfully'), 'success');
      } else {
        // Use status update API
        await batchService.updateBatchStatus(stock.batch!.id, {
          status:
            action === 'QUARANTINED'
              ? BatchStatus.QUARANTINED
              : BatchStatus.RECALLED,
          reason: reason.trim()
        });

        const successMessage =
          action === 'QUARANTINED'
            ? t('batch.quarantined.successfully')
            : t('batch.recalled.successfully');
        onSuccess(successMessage, 'success');
      }

      onClose();
    } catch (error: unknown) {
      onSuccess(getStockErrorMessage(error, t), 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (actionType: BatchAction) => {
    switch (actionType) {
      case 'QUARANTINED':
        return t('batch.action.quarantine');
      case 'RECALLED':
        return t('batch.recall');
      case 'DISPOSED':
        return t('batch.action.dispose');
    }
  };

  const getWarningMessage = () => {
    switch (action) {
      case 'QUARANTINED':
        return t('batch.quarantine.warning');
      case 'RECALLED':
        return t('batch.recall.warning');
      case 'DISPOSED':
        return t('batch.dispose.warning.detail');
    }
  };

  const getWarningSeverity = () => {
    switch (action) {
      case 'QUARANTINED':
        return 'warning' as const;
      case 'RECALLED':
      case 'DISPOSED':
        return 'error' as const;
    }
  };

  const getReasonLabel = () => {
    switch (action) {
      case 'QUARANTINED':
        return t('batch.quarantine.reason.label');
      case 'RECALLED':
        return t('batch.recall.reason.label');
      case 'DISPOSED':
        return t('batch.dispose.reason.label');
    }
  };

  const getReasonPlaceholder = () => {
    switch (action) {
      case 'QUARANTINED':
        return t('batch.quarantine.reason.placeholder');
      case 'RECALLED':
        return t('batch.recall.reason.placeholder');
      case 'DISPOSED':
        return t('batch.dispose.reason.placeholder');
    }
  };

  const getConfirmButtonText = () => {
    if (loading) return t('processing');
    switch (action) {
      case 'QUARANTINED':
        return t('batch.quarantine.confirm');
      case 'RECALLED':
        return t('batch.recall.confirm');
      case 'DISPOSED':
        return t('batch.dispose.confirm');
    }
  };

  const getDialogTitle = () => {
    if (availableActions.length === 1) {
      return getActionLabel(availableActions[0]);
    }
    return t('batch.status.change');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Batch Info */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('batch.info')}
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('product')}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stock.companyProduct.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('batch.number')}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stock.batch.batchNumber}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('current.stock')}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stock.quantity}{' '}
                  {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('expiry.date')}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatDateToDayMonthYear(new Date(stock.batch.expiryDate))}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('current.status')}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {t(`batch.status.${stock.batch.status}`)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Action Selection - only show if multiple options */}
          {availableActions.length > 1 && (
            <FormControl fullWidth>
              <InputLabel>{t('batch.action')}</InputLabel>
              <Select
                value={action}
                onChange={(e) => setAction(e.target.value as BatchAction)}
                label={t('batch.action')}
              >
                {availableActions.map((act) => (
                  <MenuItem key={act} value={act}>
                    {getActionLabel(act)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Warning */}
          <Alert severity={getWarningSeverity()}>{getWarningMessage()}</Alert>

          {/* Reason */}
          <TextField
            label={getReasonLabel()}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            placeholder={getReasonPlaceholder()}
            autoFocus
          />

          {/* Notes - only for DISPOSED */}
          {action === 'DISPOSED' && (
            <TextField
              label={t('notes.optional')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder={t('batch.dispose.notes.placeholder')}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={getWarningSeverity()}
          disabled={loading || !reason.trim()}
        >
          {getConfirmButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchStatusDialog;
