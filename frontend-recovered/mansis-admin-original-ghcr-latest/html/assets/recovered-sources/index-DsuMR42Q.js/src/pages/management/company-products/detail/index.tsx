import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  CardMedia,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton
} from '@mui/material';
import { Store as StoreIcon, Info as InfoIcon } from '@mui/icons-material';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { companyProductService } from '@/data/companyProductService';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import ProductTypeLabel from '@/components/ProductTypeLabel';
import PageHeader from './PageHeader';
import BranchOverridesTab from './tabs/BranchOverridesTab';
import MenuItemsTab from './tabs/MenuItemsTab';
import AttributesTab from './tabs/AttributesTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`company-product-tabpanel-${index}`}
      aria-labelledby={`company-product-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CompanyProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<CompanyProduct | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchProductDetail = React.useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await companyProductService.getById(Number(productId));

      setProduct(result);
    } catch (err: any) {
      console.error('Error fetching product detail:', err);
      setError(
        err.response?.data?.message || t('error.failed.to.load.product')
      );
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || t('error.product.not.found')}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${product.name} - ${t('product.detail')}`}</title>
      </Helmet>

      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Paper sx={{ width: '100%' }}>
          {/* Product Overview Card */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                  {product.file?.url ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.file.url}
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        color: 'grey.500'
                      }}
                    >
                      <StoreIcon sx={{ fontSize: 48 }} />
                    </Box>
                  )}
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Typography variant="h6">
                      {t('product.overview')}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={t(
                          `product.status.${product.status.toLowerCase()}`
                        )}
                        color={
                          product.status === 'ACTIVE' ? 'success' : 'default'
                        }
                      />
                      <ProductTypeLabel isMenu={product.isMenu} />
                    </Stack>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        {t('name')}
                      </Typography>
                      <Typography variant="body2">{product.name}</Typography>
                    </Grid>
                    {product.description && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          {t('description')}
                        </Typography>
                        <Typography variant="body2">
                          {product.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('base.price')}
                      </Typography>
                      <Typography variant="body2">
                        ₺{product.basePrice.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('cost.price')}
                      </Typography>
                      <Typography variant="body2">
                        {product.costPrice != null
                          ? `₺${product.costPrice.toFixed(2)}`
                          : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {t('product.point.value')}
                        </Typography>
                        <Tooltip
                          title={t('product.point.value.detail.tooltip', {
                            points: product.pointValue || 0
                          })}
                          placement="top"
                        >
                          <IconButton size="small" sx={{ p: 0 }}>
                            <InfoIcon
                              sx={{ fontSize: 14, color: 'text.secondary' }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2">
                        {product.pointValue != null && product.pointValue > 0
                          ? `${product.pointValue} ${t('points')}`
                          : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('category')}
                      </Typography>
                      <Typography variant="body2">
                        {product.category?.name || t('no.category')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('created.at')}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateToDayMonthYearTime(product.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('last.updated')}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateToDayMonthYearTime(product.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Grid>
            </Grid>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="product detail tabs"
            >
              <Tab label={t('branch.overrides')} id="company-product-tab-0" />
              <Tab label={t('attributes')} id="company-product-tab-1" />
              {product.isMenu && (
                <Tab label={t('menu.items')} id="company-product-tab-2" />
              )}
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <BranchOverridesTab
              product={product}
              onRefresh={fetchProductDetail}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <AttributesTab product={product} />
          </TabPanel>

          {product.isMenu && (
            <TabPanel value={activeTab} index={2}>
              <MenuItemsTab product={product} />
            </TabPanel>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default CompanyProductDetail;
