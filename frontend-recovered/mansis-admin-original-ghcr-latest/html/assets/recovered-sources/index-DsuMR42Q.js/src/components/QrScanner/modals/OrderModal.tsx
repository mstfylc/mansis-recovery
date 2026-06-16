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

interface OrderProduct {
  productId: number;
  productName: string;
  quantity: number;
}

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  amount: number;
  netAmount: number;
  createdAt: string;
  products: OrderProduct[];
}

const OrderModal = ({
  open,
  onClose,
  onApprove,
  amount,
  netAmount,
  createdAt,
  products
}: OrderModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('order.confirmation')}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {t('order.confirm.message')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('total.amount')}: {amount}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('net.amount')}: {netAmount}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t('created.at')}: {formatDateToDayMonthYearTime(createdAt)}
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          {t('products')}:
        </Typography>
        {products.map((product, index) => (
          <Typography key={index} variant="body2">
            {product.productName} x {product.quantity}
          </Typography>
        ))}
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

export default OrderModal;
