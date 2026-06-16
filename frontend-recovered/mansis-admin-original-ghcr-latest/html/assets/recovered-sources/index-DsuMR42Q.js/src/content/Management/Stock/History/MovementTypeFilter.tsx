import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { StockMovementType } from '@/types/stock';
import { ALL_STOCK_MOVEMENT_TYPES } from '@/types/stock';

interface MovementTypeFilterProps {
  value: StockMovementType | '';
  onChange: (type: StockMovementType | '') => void;
  size?: 'small' | 'medium';
}

const MovementTypeFilter = ({
  value,
  onChange,
  size = 'small'
}: MovementTypeFilterProps) => {
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent<StockMovementType | ''>) => {
    onChange(event.target.value as StockMovementType | '');
  };

  return (
    <FormControl fullWidth size={size}>
      <Select value={value} onChange={handleChange} displayEmpty>
        <MenuItem value="">{t('movement.type.all')}</MenuItem>
        {ALL_STOCK_MOVEMENT_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {t(`movement.type.${type}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MovementTypeFilter;
