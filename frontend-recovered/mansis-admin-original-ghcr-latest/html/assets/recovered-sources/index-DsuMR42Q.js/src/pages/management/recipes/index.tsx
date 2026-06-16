import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/Recipes/PageHeader';
import RecipesTable from '@/content/Management/Recipes/RecipesTable';
import RecipeDialog from '@/components/modals/RecipeDialog';
import { useState } from 'react';
import { recipeService } from '@/data/recipeService';
import { Recipe } from '@/types/Recipe.interface';
import { Filters } from '@/types/Filters';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const RecipeManagement = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();

  const fetchRecipes = async (filters?: Filters) => {
    try {
      setLoading(true);
      const params = { ...transformFiltersToApiParams(filters) };

      // Convert status to isActive for recipe endpoint
      if (params.status) {
        if (params.status === 'active') {
          params.isActive = true;
        } else if (params.status === 'passive') {
          params.isActive = false;
        }
        delete params.status;
      }

      const result = await recipeService.getAll(params);
      setRecipes(result.items);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipeData: {
    description?: string;
    companyProductId: number;
    yieldQuantity: number;
    yieldUnit: string;
    prepTime?: number;
    cookTime?: number;
    instructions?: string;
    isActive: boolean;
    ingredients: Array<{
      ingredientProductId: number;
      quantity: number;
      unit: string;
      isOptional: boolean;
    }>;
  }) => {
    try {
      setLoading(true);

      if (editRecipe) {
        await recipeService.update(editRecipe.id, recipeData as any);
        setSuccessMessage(t('recipes.update.success'));
      } else {
        const result = await recipeService.create(recipeData as any);
        setSuccessMessage(t('recipes.create.success'));
        setShowRecipeDialog(false);
        setShowSuccess(true);
        await fetchRecipes();
        return result;
      }

      setShowRecipeDialog(false);
      setShowSuccess(true);
      await fetchRecipes();
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async (recipeId: number) => {
    setDeleteRecipeId(recipeId);
  };

  const handleDeleteCancel = () => {
    setDeleteRecipeId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteRecipeId) return;

    try {
      setLoading(true);
      await recipeService.delete(deleteRecipeId);
      setSuccessMessage(t('recipes.delete.success'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return;
    } finally {
      setLoading(false);
      setDeleteRecipeId(null);
    }
    fetchRecipes();
  };

  const handleBulkDeleteRecipes = async (
    selectedRecipes: Recipe[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await recipeService.bulkDeleteByIds(
        selectedRecipes.map((recipe) => recipe.id)
      );
      setSuccessMessage(t('recipes.bulk.delete.success'));
      setShowSuccess(true);
      onSuccess?.();
      await fetchRecipes();
    } catch (error) {
      console.error('Error during bulk deletion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateStatus = async (
    selectedRecipes: Recipe[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await recipeService.bulkUpdateStatus(
        selectedRecipes.map((recipe) => recipe.id),
        status === 'ACTIVE'
      );
      setSuccessMessage(t('recipes.bulk.status.update.success'));
      setShowSuccess(true);
      onSuccess?.();
      await fetchRecipes();
    } catch (error) {
      console.error('Error during bulk status update:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: Filters) => {
    fetchRecipes(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('recipes.management.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <RecipesTable
            recipes={recipes}
            loading={loading}
            totalCount={totalCount}
            setShowRecipeDialog={setShowRecipeDialog}
            onDelete={handleDeleteConfirm}
            onBulkDeleteRecipes={handleBulkDeleteRecipes}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onEdit={(recipe: Recipe) => {
              setEditRecipe(recipe);
              setShowRecipeDialog(true);
            }}
            onFilterChange={handleFilterChange}
            pageKey="recipes"
          />
        </Grid>
      </Grid>
      <RecipeDialog
        open={showRecipeDialog}
        onClose={() => {
          setShowRecipeDialog(false);
          setEditRecipe(null);
        }}
        onSave={handleSaveRecipe}
        recipe={editRecipe}
      />
      <ConfirmDialog
        open={Boolean(deleteRecipeId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('recipes.delete.confirm.title')}
        message={t('recipes.delete.confirm.message')}
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

export default RecipeManagement;
