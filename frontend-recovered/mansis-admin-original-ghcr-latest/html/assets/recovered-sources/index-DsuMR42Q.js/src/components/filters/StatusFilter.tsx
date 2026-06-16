import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface StatusOption {
  id: string;
  name: string;
}

interface StatusFilterProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  options?: StatusOption[];
  minWidth?: number;
  size?: 'small' | 'medium';
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  options,
  minWidth = 150,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const labelId = 'status-filter-label';

  const defaultStatusOptions: StatusOption[] = [
    {
      id: 'all',
      name: t('all')
    },
    {
      id: 'active',
      name: t('active')
    },
    {
      id: 'pending',
      name: t('pending')
    },
    {
      id: 'deleted',
      name: t('deleted')
    },
    {
      id: 'passive',
      name: t('passive')
    }
  ];

  if (!options) options = defaultStatusOptions;

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value === 'all' ? undefined : e.target.value;
    onChange(value);
  };

  const inputLabelSize = size === 'medium' ? 'normal' : 'small';

  return (
    <FormControl sx={{ minWidth: minWidth }}>
      <InputLabel id={labelId} size={inputLabelSize}>
        {t('filter.by.status')}
      </InputLabel>
      <Select
        labelId={labelId}
        value={value || 'all'}
        onChange={handleStatusChange}
        size={size}
        label={t('filter.by.status')}
      >
        {options.map((status) => (
          <MenuItem key={status.id} value={status.id}>
            {status.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StatusFilter;
