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
import { categoryService } from '@/data/categoryService';
import { Category } from '@/types/Category.interface';

interface CategoryFilterProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  size?: 'small' | 'medium';
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  value,
  onChange,
  size = 'medium'
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await categoryService.getAllFlat({ getAll: true });
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : Number(selectedValue));
  };

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="category-filter-label">
        {t('filters.category')}
      </InputLabel>
      <Select
        labelId="category-filter-label"
        id="category-filter"
        value={value?.toString() || 'all'}
        label={t('filters.category')}
        onChange={handleChange}
        disabled={loading}
        data-testid="category-filter-select"
      >
        <MenuItem value="all">{t('filters.all.categories')}</MenuItem>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          categories.map((category) => (
            <MenuItem key={category.id} value={category.id.toString()}>
              {category.name}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default CategoryFilter;
