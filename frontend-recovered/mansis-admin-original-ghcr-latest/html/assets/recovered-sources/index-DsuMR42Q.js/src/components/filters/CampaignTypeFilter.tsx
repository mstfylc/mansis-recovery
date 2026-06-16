import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CampaignType } from '@/enums/campaign-type';

interface CampaignTypeFilterProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
}

const CampaignTypeFilter: React.FC<CampaignTypeFilterProps> = ({
  value,
  onChange,
  minWidth = 150,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const labelId = 'campaign-type-filter-label';

  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value === 'all' ? undefined : e.target.value;
    onChange(value);
  };

  const inputLabelSize = size === 'medium' ? 'normal' : 'small';

  return (
    <FormControl sx={{ minWidth: minWidth }}>
      <InputLabel id={labelId} size={inputLabelSize}>
        {t('filter.by.type')}
      </InputLabel>
      <Select
        labelId={labelId}
        value={value || 'all'}
        onChange={handleTypeChange}
        size={size}
        label={t('filter.by.type')}
      >
        <MenuItem value="all">{t('all')}</MenuItem>
        {Object.values(CampaignType).map((type) => {
          const translationKey = type.toLowerCase().replace('_', '.');
          return (
            <MenuItem key={type} value={type}>
              {t(translationKey)}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default CampaignTypeFilter;
