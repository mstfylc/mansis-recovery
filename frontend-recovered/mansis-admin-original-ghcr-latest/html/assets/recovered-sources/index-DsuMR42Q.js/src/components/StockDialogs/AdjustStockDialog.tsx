import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as stockService from '../../data/stockService';
import type { BranchStock } from '../../types/stock';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { getStockErrorMessage } from '@/utils/errorHandlers';
import NumericInput from '@/components/NumericInput';

interface AdjustStockDialogProps {
  open: boolean;
  onClose: () => void;
  stock: BranchStock;
  onSuccess: (message: string, severity: 'success' | 'error') => void;
}

const AdjustStockDialog = ({
  open,
  onClose,
  stock,
  onSuccess
}: AdjustStockDialogProps) => {
  const { t } = useTranslation();

  const currentQuantity = stock.totalQuantity || stock.quantity;

  const [newQuantity, setNewQuantity] = useState<string>(
    currentQuantity.toString()
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [minThreshold, setMinThreshold] = useState<number>(
    stock.minThreshold || 0
  );
  const [maxThreshold, setMaxThreshold] = useState<number>(
    stock.maxThreshold || 0
  );
  const [loadingThreshold, setLoadingThreshold] = useState(false);
  const [currentThreshold, setCurrentThreshold] = useState<{
    min: number;
    max: number;
  } | null>(null);

  useEffect(() => {
    const fetchThreshold = async () => {
      if (!open) return;

      setLoadingThreshold(true);
      try {
        const threshold = await stockService.getProductThreshold(
          stock.branchId,
          stock.companyProductId,
          stock.warehouseId
        );

        if (threshold) {
          setCurrentThreshold({
            min: threshold.minThreshold || 0,
            max: threshold.maxThreshold || 0
          });
          setMinThreshold(threshold.minThreshold || 0);
          setMaxThreshold(threshold.maxThreshold || 0);
        } else {
          // Fallback to BranchStock thresholds
          setCurrentThreshold({
            min: stock.minThreshold || 0,
            max: stock.maxThreshold || 0
          });
        }
      } catch (error) {
        console.error('Error fetching threshold:', error);
        setCurrentThreshold({
          min: stock.minThreshold || 0,
          max: stock.maxThreshold || 0
        });
      } finally {
        setLoadingThreshold(false);
      }
    };

    fetchThreshold();
  }, [open, stock]);

  useEffect(() => {
    if (open) {
      const qty = stock.totalQuantity || stock.quantity;
      setNewQuantity(qty.toString());
      setReason(''); // Reset reason when dialog opens
    }
  }, [open, stock.totalQuantity, stock.quantity]);

  const difference = !isNaN(parseFloat(newQuantity))
    ? parseFloat(newQuantity) - currentQuantity
    : 0;

  const handleSubmit = async () => {
    const qty = parseFloat(newQuantity);
    if (isNaN(qty)) {
      onSuccess(t('stock.invalid.quantity'), 'error');
      return;
    }

    if (!reason.trim()) {
      onSuccess(t('stock.reason.required'), 'error');
      return;
    }

    setLoading(true);
    try {
      await stockService.adjustStock({
        branchId: stock.branchId,
        productId: stock.companyProductId,
        newQuantity: qty,
        reason: reason,
        warehouseId: stock.warehouseId,
        batchId: stock.batchId || undefined
      });

      const thresholdChanged =
        minThreshold !== (currentThreshold?.min || 0) ||
        maxThreshold !== (currentThreshold?.max || 0);

      if (thresholdChanged) {
        try {
          await stockService.setProductThreshold({
            branchId: stock.branchId,
            companyProductId: stock.companyProductId,
            warehouseId: stock.warehouseId,
            minThreshold: minThreshold > 0 ? minThreshold : null,
            maxThreshold: maxThreshold > 0 ? maxThreshold : null
          });
        } catch (thresholdError) {
          console.error('Error updating threshold:', thresholdError);
        }
      }

      onSuccess(t('stock.adjusted.successfully'), 'success');
      onClose();
      setNewQuantity(currentQuantity.toString());
      setReason('');
      setMinThreshold(0);
      setMaxThreshold(0);
    } catch (error: any) {
      onSuccess(getStockErrorMessage(error, t), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('adjust.stock')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('product')}: <strong>{stock.companyProduct.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('warehouse')}: <strong>{stock.warehouse.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('current.stock')}:{' '}
            <strong>
              {currentQuantity}{' '}
              {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
            </strong>
          </Typography>

          <TextField
            label={t('new.quantity')}
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            fullWidth
            required
            inputProps={{ step: 'any' }}
            autoFocus
          />

          <TextField
            label={t('reason.required')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            placeholder={t('stock.reason.example.adjust')}
            helperText={t('stock.adjust.reason.placeholder')}
          />

          {!isNaN(parseFloat(newQuantity)) && difference !== 0 && (
            <Typography
              variant="body2"
              color={difference > 0 ? 'success.main' : 'error.main'}
            >
              {t('difference')}:{' '}
              <strong>
                {difference > 0 ? '+' : ''}
                {difference}{' '}
                {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
              </strong>
            </Typography>
          )}

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('stock.thresholds.optional')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <NumericInput
              label={t('min.threshold.optional')}
              value={minThreshold}
              onChange={setMinThreshold}
              fullWidth
              allowDecimals
              decimalPlaces={2}
              min={0}
              helperText={
                loadingThreshold ? t('loading') : t('stock.min.threshold.help')
              }
              disabled={loadingThreshold}
            />

            <NumericInput
              label={t('max.threshold.optional')}
              value={maxThreshold}
              onChange={setMaxThreshold}
              fullWidth
              allowDecimals
              decimalPlaces={2}
              min={0}
              helperText={
                loadingThreshold ? t('loading') : t('stock.max.threshold.help')
              }
              disabled={loadingThreshold}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !newQuantity || !reason.trim()}
        >
          {loading ? t('adjusting') : t('adjust.stock')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdjustStockDialog;
