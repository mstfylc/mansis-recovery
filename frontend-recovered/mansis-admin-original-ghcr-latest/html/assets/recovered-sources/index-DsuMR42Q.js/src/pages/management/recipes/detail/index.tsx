import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  CardContent,
  Divider,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { recipeService } from '@/data/recipeService';
import { Recipe } from '@/types/Recipe.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import PageHeader from './PageHeader';
import { prepareStockUnitLabel } from '@/utils/helpers';
import RecipeIngredientsTable from '@/content/Management/Recipes/RecipeIngredientsTable';

const RecipeDetail: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showError, setShowError] = useState(false);

  const fetchRecipeDetail = React.useCallback(async () => {
    if (!recipeId) return;

    try {
      setLoading(true);
      setError(null);

      const recipe = await recipeService.getById(Number(recipeId));
      setRecipe(recipe);
    } catch (err: any) {
      console.error('Error fetching recipe detail:', err);
      setError(err.response?.data?.message || t('error.failed.to.load.recipe'));
    } finally {
      setLoading(false);
    }
  }, [recipeId, t]);

  const fetchRecipeIngredients = React.useCallback(async () => {
    if (!recipeId) return;

    try {
      setIngredientsLoading(true);
      const recipe = await recipeService.getById(Number(recipeId));
      setRecipe((prev) =>
        prev ? { ...prev, ingredients: recipe.ingredients } : null
      );
    } catch (err: any) {
      console.error('Error fetching recipe ingredients:', err);
      setErrorMessage(
        err.response?.data?.message || t('error.failed.to.load.ingredients')
      );
      setShowError(true);
    } finally {
      setIngredientsLoading(false);
    }
  }, [recipeId, t]);

  useEffect(() => {
    fetchRecipeDetail();
  }, [fetchRecipeDetail]);

  const handleAddIngredient = async (ingredientData: any) => {
    if (!recipeId) return;

    try {
      setIngredientsLoading(true);
      await recipeService.addIngredient(Number(recipeId), ingredientData);
      setSuccessMessage(t('recipes.ingredient.added.success'));
      setShowSuccess(true);
      await fetchRecipeIngredients();
    } catch (err: any) {
      console.error('Error adding ingredient:', err);
      setErrorMessage(
        err.response?.data?.message || t('error.failed.to.add.ingredient')
      );
      setShowError(true);
    } finally {
      setIngredientsLoading(false);
    }
  };

  const handleUpdateIngredient = async (ingredientId: number, data: any) => {
    if (!recipeId) return;

    try {
      setIngredientsLoading(true);
      await recipeService.updateIngredient(
        Number(recipeId),
        ingredientId,
        data
      );
      setSuccessMessage(t('recipes.ingredient.updated.success'));
      setShowSuccess(true);
      await fetchRecipeIngredients();
    } catch (err: any) {
      console.error('Error updating ingredient:', err);
      setErrorMessage(
        err.response?.data?.message || t('error.failed.to.update.ingredient')
      );
      setShowError(true);
    } finally {
      setIngredientsLoading(false);
    }
  };

  const handleDeleteIngredient = async (ingredientId: number) => {
    if (!recipeId) return;

    try {
      setIngredientsLoading(true);
      await recipeService.deleteIngredient(Number(recipeId), ingredientId);
      setSuccessMessage(t('recipes.ingredient.deleted.success'));
      setShowSuccess(true);
      await fetchRecipeIngredients();
    } catch (err: any) {
      console.error('Error deleting ingredient:', err);
      setErrorMessage(
        err.response?.data?.message || t('error.failed.to.delete.ingredient')
      );
      setShowError(true);
    } finally {
      setIngredientsLoading(false);
    }
  };

  const handleBulkDeleteIngredients = async (
    ingredients: any[],
    onSuccess?: () => void
  ) => {
    if (!recipeId) return;

    try {
      setIngredientsLoading(true);
      await recipeService.bulkDeleteIngredients(
        Number(recipeId),
        ingredients.map((ing) => ing.id)
      );
      setSuccessMessage(t('recipes.ingredients.deleted.success'));
      setShowSuccess(true);
      await fetchRecipeIngredients();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error bulk deleting ingredients:', err);
      setErrorMessage(
        err.response?.data?.message || t('error.failed.to.delete.ingredients')
      );
      setShowError(true);
    } finally {
      setIngredientsLoading(false);
    }
  };

  const handleRefreshIngredients = () => {
    fetchRecipeIngredients();
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

  if (error || !recipe) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || t('error.recipe.not.found')}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${recipe.finishedProduct?.name} - ${t('recipe.detail')}`}</title>
      </Helmet>

      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Paper sx={{ width: '100%' }}>
          {/* Recipe Overview Card */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Grid container spacing={2}>
                    <Grid item xs={10}>
                      <Typography variant="caption" color="text.secondary">
                        {t('recipes.form.finishedProduct')}
                      </Typography>
                      <Typography variant="body2">
                        {recipe.finishedProduct?.name}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      sx={{ display: 'flex', justifyContent: 'flex-end' }}
                    >
                      <Chip
                        size="small"
                        label={t(
                          recipe.isActive ? 'status.active' : 'status.inactive'
                        )}
                        color={recipe.isActive ? 'success' : 'default'}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        {t('recipes.form.finishedProduct')}
                      </Typography>
                      <Typography variant="body2">
                        {recipe.finishedProduct?.name || '-'}
                      </Typography>
                      {recipe.finishedProduct?.category && (
                        <Typography variant="caption" color="text.secondary">
                          {recipe.finishedProduct.category.name}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        {t('recipes.form.yieldQuantity')}
                      </Typography>
                      <Typography variant="body2">
                        {recipe.yieldQuantity}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        {t('recipes.form.yieldUnit')}
                      </Typography>
                      <Typography variant="body2">
                        <Chip
                          size="small"
                          label={t(prepareStockUnitLabel(recipe.yieldUnit))}
                        />
                      </Typography>
                    </Grid>
                    {recipe.prepTime && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          {t('recipes.form.prepTime')}
                        </Typography>
                        <Typography variant="body2">
                          {recipe.prepTime} {t('minutes')}
                        </Typography>
                      </Grid>
                    )}
                    {recipe.cookTime && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          {t('recipes.form.cookTime')}
                        </Typography>
                        <Typography variant="body2">
                          {recipe.cookTime} {t('minutes')}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        {t('created.at')}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateToDayMonthYearTime(recipe.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        {t('last.updated')}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateToDayMonthYearTime(recipe.updatedAt)}
                      </Typography>
                    </Grid>
                    {recipe.description && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          {t('recipes.form.description')}
                        </Typography>
                        <Typography variant="body2">
                          {recipe.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {recipe.instructions && (
            <>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('recipes.form.instructions')}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {recipe.instructions}
                </Typography>
              </Box>
              <Divider />
            </>
          )}

          {recipe.estimatedCost !== undefined && (
            <>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('recipes.cost.information')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('recipes.cost.total')}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₺{recipe.estimatedCost.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('recipes.cost.per.unit')}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₺{recipe.costPerYieldUnit?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      / {recipe.yieldQuantity}{' '}
                      {t(prepareStockUnitLabel(recipe.yieldUnit))}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider />
            </>
          )}
        </Paper>

        {/* Ingredients Section - Separate Component */}
        <Box sx={{ mt: 3 }}>
          <RecipeIngredientsTable
            ingredients={recipe.ingredients || []}
            loading={ingredientsLoading}
            onAddIngredient={handleAddIngredient}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onBulkDeleteIngredients={handleBulkDeleteIngredients}
            onRefresh={handleRefreshIngredients}
          />
        </Box>
      </Container>

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
          {successMessage}
        </MuiAlert>
      </Snackbar>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <MuiAlert
          variant="filled"
          severity="error"
          onClose={() => setShowError(false)}
        >
          {errorMessage}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default RecipeDetail;
