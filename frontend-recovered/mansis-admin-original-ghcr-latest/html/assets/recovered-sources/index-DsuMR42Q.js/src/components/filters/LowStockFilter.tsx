import React from 'react';
import { FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LowStockFilterProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

const LowStockFilter: React.FC<LowStockFilterProps> = ({
  value,
  onChange,
  label
}) => {
  const { t } = useTranslation();

  return (
    <FormControlLabel
      control={
        <Switch
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          color="warning"
          data-testid="low-stock-filter-switch"
        />
      }
      label={label || t('stock.filter.low.only')}
    />
  );
};

export default LowStockFilter;
