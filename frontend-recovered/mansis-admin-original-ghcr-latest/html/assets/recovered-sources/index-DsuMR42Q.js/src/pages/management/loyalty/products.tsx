import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useState } from 'react';
import { loyaltyService } from '@/data/loyaltyService';
import {
  BranchLoyaltyProduct,
  CreateBranchLoyaltyProductDto,
  UpdateBranchLoyaltyProductDto
} from '@/types/Loyalty.interface';
import { Filters } from '@/types/Filters';
import PageHeader from '@/content/Management/Loyalty/PageHeader';
import LoyaltyProductsTable from '@/content/Management/Loyalty/LoyaltyProductsTable';
import LoyaltyProductDialog from '@/content/Management/Loyalty/LoyaltyProductDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const LoyaltyProductsManagement = () => {
  const { t } = useTranslation();

  const [products, setProducts] = useState<BranchLoyaltyProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [deleteBranchId, setDeleteBranchId] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<BranchLoyaltyProduct | null>(null);

  const [lastFilters, setLastFilters] = useState<Filters | undefined>();

  const fetchProducts = async (filters?: Filters) => {
    try {
      setLoading(true);
      const params = transformFiltersToApiParams(filters);
      const result = await loyaltyService.getProducts(params);
      setProducts(result.items);
      setTotalCount(result.total);
    } catch (error: any) {
      console.error('Error fetching loyalty products:', error);
      setError(
        error.response?.data?.message || t('loyalty.products.error.fetch')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (product: BranchLoyaltyProduct) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleCreateProduct = async (dto: CreateBranchLoyaltyProductDto) => {
    if (!dto.branchId) {
      setError(t('branch.required'));
      return;
    }

    try {
      setLoading(true);
      await loyaltyService.createProduct(dto.branchId, {
        companyProductId: dto.companyProductId,
        pointCost: dto.pointCost
      });
      setSuccessMessage(t('loyalty.products.add.success'));
      setShowSuccess(true);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error creating loyalty product:', err);
      if (err.response?.data?.message?.includes('already exists')) {
        setError(t('loyalty.products.error.duplicate'));
      } else {
        setError(
          err.response?.data?.message || t('loyalty.products.error.save')
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
    fetchProducts(lastFilters);
  };

  const handleUpdateProduct = async (
    productId: number,
    branchId: number,
    dto: UpdateBranchLoyaltyProductDto
  ) => {
    try {
      setLoading(true);
      await loyaltyService.updateProduct(branchId, productId, dto);
      setSuccessMessage(t('loyalty.products.update.success'));
      setShowSuccess(true);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error updating loyalty product:', err);
      setError(err.response?.data?.message || t('loyalty.products.error.save'));
      throw err;
    } finally {
      setLoading(false);
    }
    fetchProducts(lastFilters);
  };

  const handleDeleteConfirm = (productId: number, branchId?: number) => {
    setDeleteProductId(productId);
    setDeleteBranchId(branchId ?? null);
  };

  const handleDeleteCancel = () => {
    setDeleteProductId(null);
    setDeleteBranchId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteBranchId || !deleteProductId) return;

    try {
      setLoading(true);
      await loyaltyService.deleteProduct(deleteBranchId, deleteProductId);
      setSuccessMessage(t('loyalty.products.delete.success'));
      setShowSuccess(true);
    } catch (err: any) {
      console.error('Error deleting loyalty product:', err);
      setError(t('loyalty.products.error.delete'));
    } finally {
      setLoading(false);
      setDeleteProductId(null);
      setDeleteBranchId(null);
    }
    fetchProducts(lastFilters);
  };

  const handleBulkDeleteProducts = async (
    selectedProducts: BranchLoyaltyProduct[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await loyaltyService.bulkDeleteProducts(
        selectedProducts.map((p) => p.id)
      );
      setSuccessMessage(t('loyalty.products.delete.success'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error during bulk deletion:', err);
      setError(t('loyalty.products.error.delete'));
    } finally {
      setLoading(false);
    }
    fetchProducts(lastFilters);
  };

  const handleFilterChange = (filters: Filters) => {
    setLastFilters(filters);
    fetchProducts(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('loyalty.products.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <LoyaltyProductsTable
            products={products}
            loading={loading}
            totalCount={totalCount}
            onDeleteProduct={handleDeleteConfirm}
            onBulkDeleteProducts={handleBulkDeleteProducts}
            onOpenAddDialog={handleOpenAddDialog}
            onOpenEditDialog={handleOpenEditDialog}
            onFilterChange={handleFilterChange}
            pageKey="loyalty-products"
          />
        </Grid>
      </Grid>

      <LoyaltyProductDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        editingProduct={editingProduct}
        existingProducts={products}
        onCreateProduct={handleCreateProduct}
        onUpdateProduct={handleUpdateProduct}
      />

      <ConfirmDialog
        open={Boolean(deleteProductId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('loyalty.products.delete.confirm.title')}
        message={t('loyalty.products.delete.confirm.message')}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <MuiAlert
          variant="filled"
          severity="success"
          onClose={() => setShowSuccess(false)}
        >
          <Typography>{successMessage}</Typography>
        </MuiAlert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(undefined)}
      >
        <MuiAlert
          variant="filled"
          severity="error"
          onClose={() => setError(undefined)}
        >
          <Typography>{error}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default LoyaltyProductsManagement;
