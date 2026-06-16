import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useState } from 'react';
import { Category } from '@/types/Category.interface';
import { Filters } from '@/types/Filters';
import { categoryService } from '@/data/categoryService';
import PageHeader from '@/content/Management/Categories/PageHeader';
import CategoriesTable from '@/content/Management/Categories/CategoriesTable';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import CategoryDialog from '@/components/modals/CategoryDialog';
import { useTranslation } from 'react-i18next';
import { CategoryStatus } from '@/enums/category-status';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const { t } = useTranslation();

  const fetchCategories = async (filters?: Filters) => {
    try {
      setLoading(true);
      const queryParams = transformFiltersToApiParams(filters);
      const data = await categoryService.getAll(queryParams);
      setCategories(data.items);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewCategory = async (category: {
    name: string;
    imageFile: File | null;
    companyId?: number;
    status?: string;
  }) => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (category.imageFile) {
        formData.append('image', category.imageFile);
      }
      formData.append('name', category.name);
      if (category.companyId) {
        formData.append('companyId', category.companyId.toString());
      }
      if (category.status) {
        formData.append('status', category.status);
      }

      await categoryService.create(formData);
      setError(undefined);
      setShowNewCategoryDialog(false);
      setShowSuccess(true);
      setSuccessMessage(t('category.create.success.message'));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setError(t('category.create.error.duplicate'));
      } else {
        setError(t('category.create.error.message'));
        console.error('Error creating category:', error);
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchCategories();
  };

  const handleDeleteConfirm = async (categoryId: number) => {
    setDeleteCategoryId(categoryId);
  };

  const handleDeleteCancel = () => {
    setDeleteCategoryId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteCategoryId) return;

    try {
      setLoading(true);
      await categoryService.delete(deleteCategoryId);
      setSuccessMessage(t('category.delete.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error while deleting category:', error);
      return;
    } finally {
      setLoading(false);
      setDeleteCategoryId(null);
    }
    fetchCategories();
  };

  const handleBulkDeleteCategories = async (
    selectedCategories: Category[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await categoryService.bulkDelete(
        selectedCategories.map((category) => category.id)
      );
      setSuccessMessage(t('category.bulk.delete.success.message'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      setError(t('category.bulk.delete.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchCategories();
  };

  const handleBulkUpdateCategoryStatus = async (
    selectedCategories: Category[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await categoryService.bulkUpdateStatus(
        selectedCategories.map((category) => category.id),
        status
      );

      const updatedCount = result?.updatedCount;
      setSuccessMessage(
        t('category.bulk.status.update.success.message', {
          count: updatedCount || selectedCategories.length
        })
      );
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk status update:', error);
      return;
    } finally {
      setLoading(false);
    }
    fetchCategories();
  };

  const handleUpdateCategory = async (
    categoryId: number,
    updates: {
      name?: string;
      status?: CategoryStatus;
      imageFile?: File | null;
      companyId?: number | null;
    }
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (updates.name) formData.append('name', updates.name);
      if (updates.status) formData.append('status', updates.status);
      if (updates.imageFile) formData.append('image', updates.imageFile);
      if (updates.companyId !== undefined && updates.companyId !== null)
        formData.append('companyId', updates.companyId.toString());

      await categoryService.update(categoryId, formData);

      setSuccessMessage(t('category.update.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(t('category.update.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchCategories();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchCategories(filters);
  };
  return (
    <>
      <Helmet>
        <title>{t('category.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CategoriesTable
            categories={categories}
            loading={loading}
            totalCount={totalCount}
            setShowNewCategoryDialog={setShowNewCategoryDialog}
            onDeleteCategory={handleDeleteConfirm}
            onBulkDeleteCategories={handleBulkDeleteCategories}
            onBulkUpdateStatus={handleBulkUpdateCategoryStatus}
            onUpdateCategory={handleUpdateCategory}
            onFilterChange={handleFilterChange}
            pageKey="categories"
          />
        </Grid>
      </Grid>
      <CategoryDialog
        open={showNewCategoryDialog}
        onClose={() => {
          setError(undefined);
          setShowNewCategoryDialog(false);
        }}
        onSave={handleSaveNewCategory}
        error={error}
      />
      <ConfirmDialog
        open={Boolean(deleteCategoryId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.category')}
        message={t('delete.category.question')}
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

export default CategoryManagement;
