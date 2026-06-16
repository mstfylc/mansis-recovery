import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  TRANSACTION_TYPE,
  TransactionType
} from '@/types/AccountingLedger.interface';

interface TransactionTypeFilterProps {
  value?: TransactionType;
  onChange: (value: TransactionType | undefined) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
}

const TransactionTypeFilter: React.FC<TransactionTypeFilterProps> = ({
  value,
  onChange,
  minWidth = 180,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const labelId = 'transaction-type-filter-label';

  const transactionTypeOptions = [
    {
      id: 'all',
      name: t('all'),
      value: undefined
    },
    {
      id: TRANSACTION_TYPE.REVENUE,
      name: t('finance.accounting.type.revenue'),
      value: TRANSACTION_TYPE.REVENUE
    },
    {
      id: TRANSACTION_TYPE.WITHDRAWAL,
      name: t('finance.accounting.type.withdrawal'),
      value: TRANSACTION_TYPE.WITHDRAWAL
    },
    {
      id: TRANSACTION_TYPE.MANUAL_ADJUSTMENT,
      name: t('finance.accounting.type.manual'),
      value: TRANSACTION_TYPE.MANUAL_ADJUSTMENT
    },
    {
      id: TRANSACTION_TYPE.REFUND,
      name: t('finance.accounting.type.refund'),
      value: TRANSACTION_TYPE.REFUND
    }
  ];

  const handleChange = (e: SelectChangeEvent<string>) => {
    const selectedValue =
      e.target.value === 'all'
        ? undefined
        : (e.target.value as TransactionType);
    onChange(selectedValue);
  };

  const inputLabelSize = size === 'medium' ? 'normal' : 'small';

  return (
    <FormControl sx={{ minWidth: minWidth }}>
      <InputLabel id={labelId} size={inputLabelSize}>
        {t('finance.accounting.filter.transaction.type')}
      </InputLabel>
      <Select
        labelId={labelId}
        value={value || 'all'}
        onChange={handleChange}
        size={size}
        label={t('finance.accounting.filter.transaction.type')}
      >
        {transactionTypeOptions.map((option) => (
          <MenuItem key={option.id} value={option.value || 'all'}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TransactionTypeFilter;
