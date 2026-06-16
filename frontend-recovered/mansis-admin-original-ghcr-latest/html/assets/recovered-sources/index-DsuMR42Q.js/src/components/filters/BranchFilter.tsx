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
import { branchService } from '@/data/branchService';

interface Branch {
  id: number;
  name: string;
  company?: {
    id: number;
    name: string;
  };
}

interface BranchFilterProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  size?: 'small' | 'medium';
  showCompanyName?: boolean;
}

const BranchFilter: React.FC<BranchFilterProps> = ({
  value,
  onChange,
  size = 'medium',
  showCompanyName = true
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const data = await branchService.getAllFlat({ getAll: true });
        setBranches(data || []);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : Number(selectedValue));
  };

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="branch-filter-label">{t('filters.location')}</InputLabel>
      <Select
        labelId="branch-filter-label"
        id="branch-filter"
        value={value?.toString() || 'all'}
        label={t('filters.location')}
        onChange={handleChange}
        disabled={loading}
        data-testid="branch-filter-select"
      >
        <MenuItem value="all">{t('filters.all.locations')}</MenuItem>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          branches.map((branch) => (
            <MenuItem key={branch.id} value={branch.id.toString()}>
              {branch.name}
              {showCompanyName && branch.company && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'gray',
                    marginLeft: '8px'
                  }}
                >
                  ({branch.company.name})
                </span>
              )}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default BranchFilter;
