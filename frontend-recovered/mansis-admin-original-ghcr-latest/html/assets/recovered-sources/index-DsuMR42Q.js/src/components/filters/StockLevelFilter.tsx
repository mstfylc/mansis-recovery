import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { StockLevel } from '@/types/stock';

interface StockLevelFilterProps {
  value: StockLevel;
  onChange: (value: StockLevel) => void;
  size?: 'small' | 'medium';
}

const StockLevelFilter: React.FC<StockLevelFilterProps> = ({
  value,
  onChange,
  size = 'medium'
}) => {
  const { t } = useTranslation();

  const stockLevelOptions = [
    { value: StockLevel.ALL, label: t('warehouseDetails.filters.allStocks') },
    {
      value: StockLevel.CRITICAL,
      label: t('warehouseDetails.filters.critical')
    },
    { value: StockLevel.LOW, label: t('warehouseDetails.filters.lowStock') },
    {
      value: StockLevel.OPTIMAL,
      label: t('warehouseDetails.filters.optimal')
    }
  ];

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as StockLevel);
  };

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="stock-level-filter-label">
        {t('warehouseDetails.stockLevel')}
      </InputLabel>
      <Select
        labelId="stock-level-filter-label"
        id="stock-level-filter"
        value={value}
        label={t('warehouseDetails.stockLevel')}
        onChange={handleChange}
      >
        {stockLevelOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StockLevelFilter;
