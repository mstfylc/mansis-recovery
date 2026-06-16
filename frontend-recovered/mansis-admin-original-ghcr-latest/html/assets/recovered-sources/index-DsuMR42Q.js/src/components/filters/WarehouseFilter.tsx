import React, { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as warehouseService from '@/data/warehouseService';
import { Warehouse } from '@/types/stock';

interface WarehouseFilterProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  branchId?: number;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

const WarehouseFilter: React.FC<WarehouseFilterProps> = ({
  value,
  onChange,
  branchId,
  size = 'medium',
  disabled = false
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!branchId) {
        setWarehouses([]);
        return;
      }

      setLoading(true);
      try {
        const response = await warehouseService.getWarehousesByBranch(branchId);
        setWarehouses(response || []);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        setWarehouses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [branchId]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : Number(selectedValue));
  };

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="warehouse-filter-label">
        {t('select.warehouse')}
      </InputLabel>
      <Select
        labelId="warehouse-filter-label"
        id="warehouse-filter"
        value={value?.toString() || 'all'}
        label={t('select.warehouse')}
        onChange={handleChange}
        disabled={disabled || loading || !branchId || warehouses.length === 0}
        data-testid="warehouse-filter-select"
      >
        <MenuItem value="all">{t('all.warehouses')}</MenuItem>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          warehouses.map((warehouse) => (
            <MenuItem key={warehouse.id} value={warehouse.id.toString()}>
              {warehouse.name} ({warehouse.code})
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default WarehouseFilter;
