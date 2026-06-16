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
import { companyService } from '@/data/companyService';

interface Company {
  id: number;
  name: string;
}

interface CompanyFilterProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  size?: 'small' | 'medium';
}

const CompanyFilter: React.FC<CompanyFilterProps> = ({
  value,
  onChange,
  size = 'medium'
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const data = await companyService.getAllFlat({ getAll: true });
        setCompanies(data || []);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : Number(selectedValue));
  };

  return (
    <FormControl fullWidth size={size} sx={{ pb: 2 }}>
      <InputLabel id="company-filter-label">{t('filters.company')}</InputLabel>
      <Select
        labelId="company-filter-label"
        id="company-filter"
        value={value?.toString() || 'all'}
        label={t('filters.company')}
        onChange={handleChange}
        disabled={loading}
        data-testid="company-filter-select"
      >
        <MenuItem value="all">{t('filters.all.companies')}</MenuItem>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          companies.map((company) => (
            <MenuItem key={company.id} value={company.id.toString()}>
              {company.name}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default CompanyFilter;
