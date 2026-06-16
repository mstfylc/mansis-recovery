import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PurchaseType } from '@/enums/purchase-type';

interface PurchaseTypeFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
}

const PurchaseTypeFilter: React.FC<PurchaseTypeFilterProps> = ({
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
      <InputLabel id="purchase-type-filter-label">
        {t('filters.purchase.type')}
      </InputLabel>
      <Select
        labelId="purchase-type-filter-label"
        id="purchase-type-filter"
        value={value || 'all'}
        onChange={handleChange}
        label={t('filters.purchase.type')}
        data-testid="purchase-type-filter"
      >
        <MenuItem value="all">{t('filters.all')}</MenuItem>
        <MenuItem value={PurchaseType.CASH}>{t('purchase.type.cash')}</MenuItem>
        <MenuItem value={PurchaseType.WALLET}>
          {t('purchase.type.wallet')}
        </MenuItem>
        <MenuItem value={PurchaseType.CAMPAIGN}>
          {t('purchase.type.campaign')}
        </MenuItem>
        <MenuItem value={PurchaseType.CARD}>{t('purchase.type.card')}</MenuItem>
        <MenuItem value={PurchaseType.DIRECT}>
          {t('purchase.type.direct')}
        </MenuItem>
        <MenuItem value={PurchaseType.MEMBERSHIP}>
          {t('purchase.type.membership')}
        </MenuItem>
        <MenuItem value={PurchaseType.PHYSICAL_CARD}>
          {t('purchase.type.physical.card')}
        </MenuItem>
        <MenuItem value={PurchaseType.LOYALTY_POINTS}>
          {t('purchase.type.loyalty.points')}
        </MenuItem>
        <MenuItem value={PurchaseType.LOYALTY_POINTS_HYBRID}>
          {t('purchase.type.loyalty.points.hybrid')}
        </MenuItem>
        <MenuItem value={PurchaseType.MIXED}>
          {t('purchase.type.mixed')}
        </MenuItem>
      </Select>
    </FormControl>
  );
};

export default PurchaseTypeFilter;
