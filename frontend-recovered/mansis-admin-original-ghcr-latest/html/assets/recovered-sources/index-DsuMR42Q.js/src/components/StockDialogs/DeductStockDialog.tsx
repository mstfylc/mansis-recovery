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
  Alert,
  Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as stockService from '../../data/stockService';
import type { BranchStock } from '../../types/stock';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { getStockErrorMessage } from '@/utils/errorHandlers';

interface DeductStockDialogProps {
  open: boolean;
  onClose: () => void;
  stock: BranchStock;
  onSuccess: (message: string, severity: 'success' | 'error') => void;
}

const DeductStockDialog = ({
  open,
  onClose,
  stock,
  onSuccess
}: DeductStockDialogProps) => {
  const { t } = useTranslation();

  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens or stock changes
  useEffect(() => {
    if (open) {
      setQuantity('');
      setReason('');
    }
  }, [open, stock?.id]);

  const newQuantity =
    quantity && !isNaN(parseFloat(quantity))
      ? stock.quantity - parseFloat(quantity)
      : stock.quantity;
  const willGoNegative = newQuantity < 0;
  const isBatchTracked = stock.companyProduct.trackExpiry;
  const isBatchDeduct = !!stock.batchId; // Sub-row'dan mı yoksa parent'tan mı?
  const allowNegativeStock = stock.companyProduct.allowNegativeStock;

  // Batch bazlı çıkışta o batch'teki miktardan fazla çıkarılamaz
  // Parent row'dan çıkışta allowNegativeStock kontrolü yapılır
  const isDeductBlocked = isBatchDeduct
    ? willGoNegative // Batch bazında kesinlikle negatif olamaz
    : willGoNegative && !allowNegativeStock; // Toplam için allowNegativeStock kontrolü

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      onSuccess(t('stock.invalid.quantity'), 'error');
      return;
    }

    setLoading(true);
    try {
      await stockService.deductStock({
        branchId: stock.branchId,
        productId: stock.companyProductId,
        quantity: qty,
        reason: reason || undefined,
        warehouseId: stock.warehouseId
      });

      onSuccess(t('stock.deducted.successfully'), 'success');
      onClose();
      setQuantity('');
      setReason('');
    } catch (error: any) {
      onSuccess(getStockErrorMessage(error, t), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('deduct.stock')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid>
            <Typography variant="body2" color="text.secondary">
              {t('product')}: <strong>{stock.companyProduct.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('warehouse')}: <strong>{stock.warehouse.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('current.stock')}:{' '}
              <strong>
                {stock.quantity}{' '}
                {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
              </strong>
            </Typography>
          </Grid>

          {isBatchTracked && (
            <Alert severity="info">{t('stock.deduct.fefo.info')}</Alert>
          )}

          <TextField
            label={t('quantity.to.deduct')}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 0, step: 'any' }}
            autoFocus
          />

          <TextField
            label={t('reason.optional')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder={t('stock.reason.example.deduct')}
          />

          {quantity && !isNaN(parseFloat(quantity)) && (
            <>
              <Typography
                variant="body2"
                color={willGoNegative ? 'error' : 'primary'}
              >
                {t('new.stock')}:{' '}
                <strong>
                  {newQuantity}{' '}
                  {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
                </strong>
              </Typography>
              {willGoNegative && isBatchDeduct && (
                <Alert severity="error">{t('stock.batch.insufficient')}</Alert>
              )}
              {willGoNegative && !isBatchDeduct && !allowNegativeStock && (
                <Alert severity="error">
                  {t('stock.insufficient.negative.not.allowed')}
                </Alert>
              )}
              {willGoNegative && !isBatchDeduct && allowNegativeStock && (
                <Alert severity="warning">{t('stock.negative.warning')}</Alert>
              )}
            </>
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
          color="warning"
          disabled={loading || !quantity || isDeductBlocked}
        >
          {loading ? t('deducting') : t('deduct.stock')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeductStockDialog;
