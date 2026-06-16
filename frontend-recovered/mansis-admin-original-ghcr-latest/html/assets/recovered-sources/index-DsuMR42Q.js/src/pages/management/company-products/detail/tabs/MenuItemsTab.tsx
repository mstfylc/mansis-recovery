import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Launch as LaunchIcon, FastfoodTwoTone } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CompanyProduct } from '@/types/CompanyProduct.interface';

interface MenuItemsTabProps {
  product: CompanyProduct;
}

const MenuItemsTab: React.FC<MenuItemsTabProps> = ({ product }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigateToMenuManagement = () => {
    // Navigate to the existing menu management page
    navigate('/management/company-products/menus', {
      state: { selectedMenuId: product.id }
    });
  };

  if (!product.isMenu) {
    return <Alert severity="info">{t('not.a.menu.product')}</Alert>;
  }

  return (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <FastfoodTwoTone sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />

      <Typography variant="h6" gutterBottom>
        {t('menu.items.management')}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        {t('menu.items.management.description')}
      </Typography>

      <Button
        variant="contained"
        size="small"
        startIcon={<LaunchIcon />}
        onClick={handleNavigateToMenuManagement}
      >
        {t('manage.menu.items')}
      </Button>
    </Box>
  );
};

export default MenuItemsTab;
