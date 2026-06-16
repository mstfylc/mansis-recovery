import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/Ingredients/PageHeader';
import IngredientsTable from '@/content/Management/Ingredients/IngredientsTable';
import IngredientDialog from '@/components/modals/IngredientDialog';
import { useState } from 'react';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { Filters } from '@/types/Filters';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { ingredientService } from '@/data/ingredientService';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const IngredientManagement = () => {
  const [ingredients, setIngredients] = useState<CompanyProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showIngredientDialog, setShowIngredientDialog] = useState(false);
  const [editIngredient, setEditIngredient] = useState<CompanyProduct | null>(
    null
  );
  const [deleteIngredientId, setDeleteIngredientId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();

  const fetchIngredients = async (filters?: Filters) => {
    try {
      setLoading(true);
      const apiParams = transformFiltersToApiParams(filters);
      const response = await ingredientService.getAll(apiParams);
      setIngredients(response.items);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setError(t('ingredients.fetch.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIngredient = async (ingredientData: {
    name: string;
    description: string;
    basePrice: string;
    costPrice?: string;
    categoryId: number;
    status: 'ACTIVE' | 'PASSIVE' | 'PENDING' | 'DELETED';
    companyId: number;
    isForSale?: boolean;
    allowNegativeStock: boolean;
    isStockTracked: boolean;
    trackExpiry: boolean;
    stockUnit: string;
    imageFile?: File;
  }) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', ingredientData.name);
      formData.append('description', ingredientData.description);
      formData.append('basePrice', ingredientData.basePrice);
      formData.append('categoryId', ingredientData.categoryId.toString());
      formData.append('companyId', ingredientData.companyId.toString());
      formData.append(
        'allowNegativeStock',
        ingredientData.allowNegativeStock.toString()
      );
      formData.append(
        'isStockTracked',
        ingredientData.isStockTracked.toString()
      );
      formData.append('trackExpiry', ingredientData.trackExpiry.toString());
      formData.append('stockUnit', ingredientData.stockUnit);

      if (ingredientData.costPrice) {
        formData.append('costPrice', ingredientData.costPrice);
      }

      if (ingredientData.isForSale !== undefined) {
        formData.append('isForSale', ingredientData.isForSale.toString());
      }

      if (editIngredient) {
        formData.append('status', ingredientData.status);
      }

      if (ingredientData.imageFile) {
        formData.append('image', ingredientData.imageFile);
      }

      if (editIngredient) {
        await ingredientService.update(editIngredient.id, formData);
        setSuccessMessage(t('ingredients.update.success'));
      } else {
        await ingredientService.create(formData);
        setSuccessMessage(t('ingredients.create.success'));
      }

      setError(undefined);
      setShowIngredientDialog(false);
      setEditIngredient(null);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error saving ingredient:', error);
      setError(t('ingredients.save.error'));
      return;
    } finally {
      setLoading(false);
    }
    fetchIngredients();
  };

  const handleDeleteConfirm = async (ingredientId: number) => {
    setDeleteIngredientId(ingredientId);
  };

  const handleDeleteCancel = () => {
    setDeleteIngredientId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteIngredientId) return;

    try {
      setLoading(true);
      await ingredientService.delete(deleteIngredientId);
      setSuccessMessage(t('ingredients.delete.success'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      setError(t('ingredients.delete.error'));
      return;
    } finally {
      setLoading(false);
      setDeleteIngredientId(null);
    }
    fetchIngredients();
  };

  const handleBulkDeleteIngredients = async (
    selectedIngredients: CompanyProduct[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const ids = selectedIngredients.map((ingredient) => ingredient.id);
      await ingredientService.bulkDelete(ids);
      setSuccessMessage(t('ingredients.bulk.delete.success'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      setError(t('ingredients.bulk.delete.error'));
      return;
    } finally {
      setLoading(false);
    }
    fetchIngredients();
  };

  const handleBulkUpdateIngredientStatus = async (
    selectedIngredients: CompanyProduct[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const ids = selectedIngredients.map((ingredient) => ingredient.id);
      await ingredientService.bulkUpdateStatus(ids, status);
      setSuccessMessage(
        t('ingredients.bulk.status.update.success.message', {
          count: ids.length,
          status: t(`status.${status.toLowerCase()}`)
        })
      );
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk status update:', error);
      setError(t('ingredients.bulk.status.update.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchIngredients();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchIngredients(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('ingredients.management.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <IngredientsTable
            ingredients={ingredients}
            loading={loading}
            totalCount={totalCount}
            setShowIngredientDialog={setShowIngredientDialog}
            onDelete={handleDeleteConfirm}
            onBulkDeleteIngredients={handleBulkDeleteIngredients}
            onBulkUpdateStatus={handleBulkUpdateIngredientStatus}
            onEdit={(ingredient: CompanyProduct) => {
              setEditIngredient(ingredient);
              setShowIngredientDialog(true);
            }}
            onFilterChange={handleFilterChange}
            pageKey="ingredients"
          />
        </Grid>
      </Grid>
      <IngredientDialog
        open={showIngredientDialog}
        onClose={() => {
          setError(undefined);
          setShowIngredientDialog(false);
          setEditIngredient(null);
        }}
        onSave={handleSaveIngredient}
        error={error}
        ingredient={editIngredient}
      />
      <ConfirmDialog
        open={Boolean(deleteIngredientId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('ingredients.delete.confirm.title')}
        message={t('ingredients.delete.confirm.message')}
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

export default IngredientManagement;
