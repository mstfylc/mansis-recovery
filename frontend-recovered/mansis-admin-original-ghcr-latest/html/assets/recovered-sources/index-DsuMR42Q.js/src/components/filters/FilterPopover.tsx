import React, { useState, ReactNode } from 'react';
import {
  Button,
  Popover,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

export interface FilterOption {
  id: string;
  label: string;
  component: ReactNode;
}

interface FilterPopoverProps {
  filterOptions: FilterOption[];
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onOpen?: () => void;
  activeFiltersCount?: number;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
  filterOptions,
  onApplyFilters,
  onResetFilters,
  onOpen,
  activeFiltersCount = 0
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { t } = useTranslation();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onOpen?.();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApply = () => {
    onApplyFilters();
    handleClose();
  };

  const handleReset = () => {
    onResetFilters();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'filter-popover' : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleClick}
        color={activeFiltersCount > 0 ? 'primary' : 'default'}
        sx={{ position: 'relative' }}
        data-testid="filter-button"
      >
        <FilterListIcon />
        {activeFiltersCount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}
          >
            {activeFiltersCount}
          </Box>
        )}
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            width: 320,
            p: 2,
            mt: 1
          }
        }}
        data-testid="filter-popover"
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6">{t('filters.title')}</Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2} sx={{ mb: 3 }}>
          {filterOptions.map((option) => (
            <Box key={option.id}>
              {option.id === 'date' && (
                <Typography variant="subtitle2" gutterBottom>
                  {option.label}
                </Typography>
              )}
              {option.component}
            </Box>
          ))}
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            data-testid="reset-filters-button"
          >
            {t('filters.reset')}
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            data-testid="apply-filters-button"
          >
            {t('filters.apply')}
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default FilterPopover;
