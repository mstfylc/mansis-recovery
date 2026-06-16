import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as stockService from '../../data/stockService';
import type { BranchStock } from '../../types/stock';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { getStockErrorMessage } from '@/utils/errorHandlers';
import StyledDatePicker from '@/components/date&time/StyledDatePicker';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';

interface AddStockDialogProps {
  open: boolean;
  onClose: () => void;
  stock: BranchStock;
  onSuccess: (message: string, severity: 'success' | 'error') => void;
}

const AddStockDialog = ({
  open,
  onClose,
  stock,
  onSuccess
}: AddStockDialogProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [manufacturingDate, setManufacturingDate] = useState<Date | null>(null);
  const [supplierBatchNo, setSupplierBatchNo] = useState('');
  const [supplierInfo, setSupplierInfo] = useState('');
  const [notes, setNotes] = useState('');

  const isBatchTracked = stock.companyProduct.trackExpiry;

  // Reset form when dialog opens or stock changes
  useEffect(() => {
    if (open) {
      setQuantity('');
      setReason('');
      setExpiryDate(null);
      setManufacturingDate(null);
      setSupplierBatchNo('');
      setSupplierInfo('');
      setNotes('');
    }
  }, [open, stock?.id]);

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      onSuccess(t('stock.invalid.quantity'), 'error');
      return;
    }

    if (isBatchTracked && !expiryDate && !stock.batchId) {
      onSuccess(t('stock.expiry.date.required'), 'error');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        branchId: stock.branchId,
        productId: stock.companyProductId,
        quantity: qty,
        reason: reason || undefined,
        warehouseId: stock.warehouseId
      };

      if (isBatchTracked) {
        // Sub-row'dan geldiysek (batchId varsa), o batch'e ekle
        if (stock.batchId) {
          payload.batchId = stock.batchId;
        } else {
          // Parent row'dan geldiysek, yeni batch oluştur (SKT gerekli)
          payload.expiryDate = expiryDate;
          payload.manufacturingDate = manufacturingDate;
          payload.supplierBatchNo = supplierBatchNo || undefined;
          payload.supplierInfo = supplierInfo || undefined;
          payload.notes = notes || undefined;
        }
      }

      await stockService.addStock(payload);

      onSuccess(t('stock.added.successfully'), 'success');
      onClose();
      setQuantity('');
      setReason('');
      setExpiryDate(null);
      setManufacturingDate(null);
      setSupplierBatchNo('');
      setSupplierInfo('');
      setNotes('');
    } catch (error: any) {
      onSuccess(getStockErrorMessage(error, t), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('add.stock')}</DialogTitle>
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
              {stock.quantity}{' '}
              {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
            </strong>
          </Typography>

          <TextField
            label={t('quantity.to.add')}
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
            placeholder={t('stock.reason.example.add')}
          />

          {isBatchTracked && stock.batchId && stock.batch && (
            <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="info.main" fontWeight="medium">
                {t('stock.adding.to.existing.batch')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('batch.number')}: {stock.batch.batchNumber}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                {t('expiry.date')}:{' '}
                {formatDateToDayMonthYear(stock.batch.expiryDate)}
              </Typography>
            </Box>
          )}

          {isBatchTracked && !stock.batchId && (
            <>
              <StyledDatePicker
                label={t('expiry.date')}
                selected={expiryDate}
                onChange={(date) => setExpiryDate(date)}
                required
              />

              <StyledDatePicker
                label={t('manufacturing.date.optional')}
                selected={manufacturingDate}
                onChange={(date) => setManufacturingDate(date)}
              />

              <TextField
                label={t('supplier.batch.no.optional')}
                value={supplierBatchNo}
                onChange={(e) => setSupplierBatchNo(e.target.value)}
                fullWidth
                helperText={t('stock.supplier.batch.no.help')}
              />

              <TextField
                label={t('supplier.info.optional')}
                value={supplierInfo}
                onChange={(e) => setSupplierInfo(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />

              <TextField
                label={t('notes.optional')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </>
          )}

          {quantity && !isNaN(parseFloat(quantity)) && (
            <Typography variant="body2" color="primary">
              {t('new.stock')}:{' '}
              <strong>
                {stock.quantity + parseFloat(quantity)}{' '}
                {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
              </strong>
            </Typography>
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
          color="success"
          disabled={loading || !quantity}
        >
          {loading ? t('adding') : t('add.stock')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStockDialog;
