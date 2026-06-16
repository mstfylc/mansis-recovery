import React from 'react';
import { TextField, InputAdornment, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PriceRangeFilterProps {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  size?: 'small' | 'medium';
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  size = 'medium'
}) => {
  const { t } = useTranslation();

  const handleMinPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Only allow numbers and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onMinPriceChange(value);
    }
  };

  const handleMaxPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Only allow numbers and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onMaxPriceChange(value);
    }
  };

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        fullWidth
        size={size}
        label={t('filters.price.min')}
        value={minPrice}
        onChange={handleMinPriceChange}
        InputProps={{
          startAdornment: <InputAdornment position="start">₺</InputAdornment>
        }}
        inputProps={{
          'data-testid': 'min-price-input',
          inputMode: 'decimal'
        }}
      />
      <TextField
        fullWidth
        size={size}
        label={t('filters.price.max')}
        value={maxPrice}
        onChange={handleMaxPriceChange}
        InputProps={{
          startAdornment: <InputAdornment position="start">₺</InputAdornment>
        }}
        inputProps={{
          'data-testid': 'max-price-input',
          inputMode: 'decimal'
        }}
      />
    </Stack>
  );
};

export default PriceRangeFilter;
