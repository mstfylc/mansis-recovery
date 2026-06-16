import { Grid, Typography, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useCallback, useEffect, useState } from 'react';
import { companyProductService } from '@/data/companyProductService';
import ProductsTable from '@/content/Dashboards/Products/ProductsTable';
import PageHeader from './PageHeader';
import { Filters } from '@/types/Filters';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import CompanyProductDialog from '@/components/modals/CompanyProductDialog';
import DependencyErrorDialog from '@/components/modals/DependencyErrorDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Role } from '@/enums/role';
import {
  fetchCompanyProductSettings,
  canUserCreateProducts,
  CompanyProductSettings
} from '@/utils/companyProductPermissions';
import { CompanyProduct } from '@/types/CompanyProduct.interface';

type CompanyProductStatus = 'ACTIVE' | 'PASSIVE' | 'PENDING' | 'DELETED';

const ProductManagement = () => {
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [companySettings, setCompanySettings] =
    useState<CompanyProductSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Dependency error dialog state
  const [showDependencyError, setShowDependencyError] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState<any[]>([]);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<{
    products: CompanyProduct[];
    onSuccess?: () => void;
  } | null>(null);

  const { t } = useTranslation();
  const { role: userRole, company } = useUserViewMode();
  const userCompanyId = company?.id;

  const fetchProducts = async (params?: Filters) => {
    try {
      setLoading(true);

      const queryParams = {
        ...transformFiltersToApiParams(params),
        isForSale: true
      };

      const result = await companyProductService.getAll({
        ...queryParams,
        isForSale: true
      });
      setProducts(result.items);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = useCallback(async () => {
    if (!userCompanyId || userRole === Role.SUPER_ADMIN) {
      return; // Super admins don't need company restrictions
    }

    try {
      setSettingsLoading(true);
      const settings = await fetchCompanyProductSettings(userCompanyId);
      setCompanySettings(settings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, [userCompanyId, userRole]);

  const handleBulkDeleteProducts = async (
    selectedProducts: CompanyProduct[],
    onSuccess?: () => void,
    force: boolean = false
  ) => {
    try {
      setLoading(true);

      const productIds = selectedProducts.map((product) => product.id);
      const responseData = await companyProductService.bulkDeleteWithForce(
        productIds,
        force
      );

      const {
        deletedCount,
        skippedCount,
        forcedDeletion,
        dependenciesRemoved,
        attributeLinksRemoved
      } = responseData as {
        deletedCount: number;
        skippedCount: number;
        forcedDeletion: boolean;
        dependenciesRemoved: number;
        attributeLinksRemoved: number;
      };

      if (forcedDeletion && dependenciesRemoved > 0) {
        setSuccessMessage(
          t('product.bulk.delete.force.success.message', {
            deleted: deletedCount,
            dependencies: dependenciesRemoved
          })
        );
      } else if (attributeLinksRemoved > 0 && skippedCount > 0) {
        setSuccessMessage(
          t('product.bulk.delete.partial.with.links.success.message', {
            deleted: deletedCount,
            skipped: skippedCount,
            links: attributeLinksRemoved
          })
        );
      } else if (attributeLinksRemoved > 0) {
        setSuccessMessage(
          t('product.bulk.delete.with.links.success.message', {
            deleted: deletedCount,
            links: attributeLinksRemoved
          })
        );
      } else if (skippedCount > 0) {
        setSuccessMessage(
          t('product.bulk.delete.partial.success.message', {
            deleted: deletedCount,
            skipped: skippedCount
          })
        );
      } else {
        setSuccessMessage(
          t('product.bulk.delete.success.message', { count: deletedCount })
        );
      }
      setShowSuccess(true);
      onSuccess?.();

      // Clear pending bulk delete
      setPendingBulkDelete(null);
      setShowDependencyError(false);
    } catch (error: any) {
      console.error('Error during bulk deletion:', error);

      // Handle dependency error response
      if (
        error.response?.status === 400 &&
        error.response?.data?.details &&
        Array.isArray(error.response.data.details) &&
        !force
      ) {
        // Show dependency error dialog
        setDependencyDetails(error.response.data.details);
        setPendingBulkDelete({ products: selectedProducts, onSuccess });
        setShowDependencyError(true);
        return;
      }

      // Handle other errors
      const errorMessage =
        error.response?.data?.message || t('product.bulk.delete.error.message');
      setError(errorMessage);
      return;
    } finally {
      setLoading(false);
    }
    fetchProducts();
  };

  const handleForceDelete = async () => {
    if (!pendingBulkDelete) return;

    await handleBulkDeleteProducts(
      pendingBulkDelete.products,
      pendingBulkDelete.onSuccess,
      true // force = true
    );
  };

  const handleCloseDependencyError = () => {
    setShowDependencyError(false);
    setPendingBulkDelete(null);
    setDependencyDetails([]);
  };

  const handleBulkUpdateProductStatus = async (
    selectedProducts: CompanyProduct[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      // Use bulk status update endpoint
      const productIds = selectedProducts.map((product) => product.id);
      const result = await companyProductService.bulkUpdateStatus(
        productIds,
        status
      );
      const { updatedCount, skippedCount = 0 } = result;
      if (skippedCount > 0) {
        setSuccessMessage(
          t('product.bulk.status.update.partial.success.message', {
            updated: updatedCount,
            skipped: skippedCount,
            status: t(`status.${status.toLowerCase()}`)
          })
        );
      } else {
        setSuccessMessage(
          t('product.bulk.status.update.success.message', {
            count: updatedCount,
            status: t(`status.${status.toLowerCase()}`)
          })
        );
      }
      setShowSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error during bulk status update:', error);
      const errorMessage =
        error.response?.data?.message ||
        t('product.bulk.status.update.error.message');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
    fetchProducts();
  };

  const handleUpdateProduct = async (
    productId: number,
    updates: {
      name?: string;
      description?: string;
      basePrice?: number;
      costPrice?: number;
      pointValue?: number;
      status?: CompanyProductStatus;
      categoryId?: number;
      imageFile?: File;
      isMenu?: boolean;
      allowNegativeStock?: boolean;
      isStockTracked?: boolean;
      trackExpiry?: boolean;
      stockUnit?: string;
      companyId: number;
    }
  ) => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (updates.imageFile) {
        formData.append('image', updates.imageFile);
      }

      if (updates.name) formData.append('name', updates.name);
      if (updates.description !== undefined)
        formData.append('description', updates.description);
      if (updates.basePrice !== undefined)
        formData.append('basePrice', updates.basePrice.toString());
      if (updates.costPrice !== undefined)
        formData.append('costPrice', updates.costPrice.toString());
      if (updates.pointValue !== undefined)
        formData.append('pointValue', updates.pointValue.toString());
      if (updates.status) formData.append('status', updates.status);
      if (updates.categoryId !== undefined) {
        formData.append(
          'categoryId',
          updates.categoryId !== null ? updates.categoryId.toString() : ''
        );
      }
      if (updates.isMenu !== undefined) {
        formData.append('isMenu', updates.isMenu.toString());
      }
      if (updates.isStockTracked !== undefined) {
        formData.append('isStockTracked', updates.isStockTracked.toString());
      }
      if (updates.trackExpiry !== undefined) {
        formData.append('trackExpiry', updates.trackExpiry.toString());
      }
      if (updates.allowNegativeStock !== undefined) {
        formData.append(
          'allowNegativeStock',
          updates.allowNegativeStock.toString()
        );
      }
      if (updates.stockUnit) {
        formData.append('stockUnit', updates.stockUnit);
      }
      formData.append('companyId', updates.companyId.toString());

      await companyProductService.update(productId, formData);

      setSuccessMessage(t('product.update.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating product:', error);
      setError(t('company.products.update.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchProducts();
  };

  useEffect(() => {
    fetchCompanySettings();
  }, [userCompanyId, userRole, fetchCompanySettings]);

  const handleSaveNewProduct = async (product: {
    name: string;
    description: string;
    basePrice: string;
    costPrice?: string;
    pointValue?: number;
    categoryId: number;
    isMenu: boolean;
    allowNegativeStock: boolean;
    isStockTracked: boolean;
    trackExpiry: boolean;
    stockUnit: string;
    imageFile?: File;
    companyId: number;
  }) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('basePrice', product.basePrice);
      if (product.costPrice) {
        formData.append('costPrice', product.costPrice);
      }
      if (product.pointValue && product.pointValue > 0) {
        formData.append('pointValue', product.pointValue.toString());
      }
      formData.append('isMenu', product.isMenu.toString());
      formData.append(
        'allowNegativeStock',
        product.allowNegativeStock.toString()
      );
      formData.append('isStockTracked', product.isStockTracked.toString());
      formData.append('trackExpiry', product.trackExpiry.toString());
      formData.append('stockUnit', product.stockUnit);

      if (product.categoryId) {
        formData.append('categoryId', product.categoryId.toString());
      }

      formData.append('companyId', product.companyId.toString());

      if (product.imageFile) {
        formData.append('image', product.imageFile);
      }

      await companyProductService.create(formData);
      setError(undefined);
      setShowNewProductDialog(false);
      setShowSuccess(true);
      setSuccessMessage(t('product.create.success.message'));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setError(t('company.product.create.error.duplicate'));
      } else {
        setError(t('product.create.error.message'));
        console.error('Error creating product:', error);
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchProducts();
  };

  const handleDeleteConfirm = async (productId: number) => {
    setDeleteProductId(productId);
  };

  const handleDeleteCancel = () => {
    setDeleteProductId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteProductId) return;

    try {
      setLoading(true);
      await companyProductService.delete(deleteProductId);
      setSuccessMessage(t('product.delete.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error while deleting product:', error);
      return;
    } finally {
      setLoading(false);
      setDeleteProductId(null);
    }
    fetchProducts();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchProducts(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('product.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ProductsTable
            products={products}
            loading={loading}
            totalCount={totalCount}
            setShowNewProductDialog={setShowNewProductDialog}
            onDeleteProduct={handleDeleteConfirm}
            onBulkDeleteProducts={handleBulkDeleteProducts}
            onBulkUpdateStatus={handleBulkUpdateProductStatus}
            onUpdateProduct={handleUpdateProduct}
            onFilterChange={handleFilterChange}
            hideAddButton={
              !canUserCreateProducts(userRole as Role, companySettings) ||
              settingsLoading
            }
            pageKey="products"
          />
        </Grid>
      </Grid>
      <CompanyProductDialog
        open={showNewProductDialog}
        onClose={() => {
          setError(undefined);
          setShowNewProductDialog(false);
        }}
        onSave={handleSaveNewProduct}
        error={error}
      />
      <ConfirmDialog
        open={Boolean(deleteProductId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.product')}
        message={t('delete.product.question')}
      />
      <DependencyErrorDialog
        open={showDependencyError}
        onClose={handleCloseDependencyError}
        onForceDelete={handleForceDelete}
        dependencies={dependencyDetails}
        title={t('product.bulk.delete.dependency.error.title')}
        loading={loading}
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
    </>
  );
};

export default ProductManagement;
