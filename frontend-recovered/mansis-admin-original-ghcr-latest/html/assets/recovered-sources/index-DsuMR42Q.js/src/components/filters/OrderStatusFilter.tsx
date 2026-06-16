import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { OrderStatus } from '@/enums/order-status';

interface OrderStatusFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
}

const OrderStatusFilter: React.FC<OrderStatusFilterProps> = ({
  value,
  onChange,
  minWidth = 200,
  size = 'medium'
}) => {
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : selectedValue);
  };

  return (
    <FormControl variant="outlined" sx={{ minWidth }} size={size}>
      <InputLabel id="order-status-filter-label">
        {t('filters.order.status')}
      </InputLabel>
      <Select
        labelId="order-status-filter-label"
        id="order-status-filter"
        value={value || 'all'}
        onChange={handleChange}
        label={t('filters.order.status')}
        data-testid="order-status-filter"
      >
        <MenuItem value="all">{t('filters.all')}</MenuItem>
        <MenuItem value={OrderStatus.PREPARING}>
          {t('order.status.preparing')}
        </MenuItem>
        <MenuItem value={OrderStatus.READY}>{t('order.status.ready')}</MenuItem>
        <MenuItem value={OrderStatus.DELIVERED}>
          {t('order.status.delivered')}
        </MenuItem>
        <MenuItem value={OrderStatus.CANCELED}>
          {t('order.status.canceled')}
        </MenuItem>
        <MenuItem value={OrderStatus.REFUNDED}>
          {t('order.status.refunded')}
        </MenuItem>
      </Select>
    </FormControl>
  );
};

export default OrderStatusFilter;
