import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProductTypeFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
}

const ProductTypeFilter: React.FC<ProductTypeFilterProps> = ({
  value,
  onChange,
  minWidth = 150,
  size = 'medium'
}) => {
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : selectedValue);
  };

  const inputLabelSize = size === 'medium' ? 'normal' : 'small';

  return (
    <FormControl variant="outlined" sx={{ minWidth }} size={size}>
      <InputLabel id="product-type-filter-label" size={inputLabelSize}>
        {t('filter.by.product.type')}
      </InputLabel>
      <Select
        labelId="product-type-filter-label"
        id="product-type-filter"
        value={value || 'all'}
        onChange={handleChange}
        label={t('filter.by.product.type')}
        data-testid="product-type-filter"
      >
        <MenuItem value="all">{t('filters.all')}</MenuItem>
        <MenuItem value="menu">{t('menu')}</MenuItem>
        <MenuItem value="product">{t('product')}</MenuItem>
      </Select>
    </FormControl>
  );
};

export default ProductTypeFilter;
