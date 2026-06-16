import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { StockUnit } from '@/types/stock';

interface StockUnitFilterProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
}

const StockUnitFilter: React.FC<StockUnitFilterProps> = ({
  value,
  onChange,
  minWidth = 150,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const labelId = 'stock-unit-filter-label';

  const stockUnitOptions = [
    {
      id: 'all',
      name: t('all')
    },
    {
      id: StockUnit.PIECE,
      name: t('stock.unit.piece')
    },
    {
      id: StockUnit.KG,
      name: t('stock.unit.kg')
    },
    {
      id: StockUnit.GRAM,
      name: t('stock.unit.gram')
    },
    {
      id: StockUnit.LITER,
      name: t('stock.unit.liter')
    },
    {
      id: StockUnit.ML,
      name: t('stock.unit.ml')
    },
    {
      id: StockUnit.PORTION,
      name: t('stock.unit.portion')
    }
  ];

  const handleStockUnitChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value === 'all' ? undefined : e.target.value;
    onChange(value);
  };

  const inputLabelSize = size === 'medium' ? 'normal' : 'small';

  return (
    <FormControl sx={{ minWidth: minWidth }}>
      <InputLabel id={labelId} size={inputLabelSize}>
        {t('filters.stock.unit')}
      </InputLabel>
      <Select
        labelId={labelId}
        value={value || 'all'}
        onChange={handleStockUnitChange}
        size={size}
        label={t('filters.stock.unit')}
      >
        {stockUnitOptions.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StockUnitFilter;
