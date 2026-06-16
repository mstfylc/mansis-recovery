import { useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Alert,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { Recipe, IngredientRow } from '@/types/Recipe.interface';
import { ProductAttribute } from '@/types/ProductAttribute.interface';
import { ModifierFormData } from '@/types/RecipeModifier.interface';
import { companyProductService } from '@/data/companyProductService';
import { StockUnit } from '@/types/stock';
import RecipeBasicInfoForm from './RecipeDialog/RecipeBasicInfoForm';
import RecipeTimingForm from './RecipeDialog/RecipeTimingForm';
import RecipeInstructionsForm from './RecipeDialog/RecipeInstructionsForm';
import RecipeIngredientsForm from './RecipeDialog/RecipeIngredientsForm';
import RecipeAttributeImpactForm from './RecipeDialog/RecipeAttributeImpactForm';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`recipe-tabpanel-${index}`}
      aria-labelledby={`recipe-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

type RecipeDialogProps = {
  open: boolean;
  onClose: () => void;
  recipe?: Recipe | null;
  onSave: (recipe: {
    description?: string;
    companyProductId: number;
    yieldQuantity: number;
    yieldUnit: StockUnit;
    prepTime?: number;
    cookTime?: number;
    instructions?: string;
    isActive: boolean;
    ingredients: Array<{
      ingredientProductId: number;
      quantity: number;
      unit: StockUnit;
      isOptional: boolean;
    }>;
    modifiers?: Array<{
      attributeOptionId: number;
      modifierType: string;
      scaleMultiplier?: number;
      addIngredientId?: number;
      addQuantity?: number;
      addUnit?: string;
      removeIngredientId?: number;
      substituteFromId?: number;
      substituteToId?: number;
      substituteQuantity?: number;
      substituteUnit?: string;
    }>;
  }) => Promise<any>;
};

const RecipeDialog = ({ open, onClose, onSave, recipe }: RecipeDialogProps) => {
  const [description, setDescription] = useState('');
  const [finishedProduct, setFinishedProduct] =
    useState<Partial<CompanyProduct> | null>(null);
  const [yieldQuantity, setYieldQuantity] = useState(0);
  const [yieldUnit, setYieldUnit] = useState<StockUnit>(StockUnit.PORTION);
  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    {
      id: '1',
      ingredient: null,
      quantity: 0,
      unit: StockUnit.GRAM,
      isOptional: false
    }
  ]);
  const [nextIngredientId, setNextIngredientId] = useState(2);
  const [tabValue, setTabValue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [ingredientProducts, setIngredientProducts] = useState<
    CompanyProduct[]
  >([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [modifiers, setModifiers] = useState<ModifierFormData[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const { t } = useTranslation();
  const isEditMode = !!recipe;

  const resetForm = useCallback(() => {
    setDescription('');
    setFinishedProduct(null);
    setYieldQuantity(0);
    setYieldUnit(StockUnit.PORTION);
    setPrepTime(0);
    setCookTime(0);
    setInstructions('');
    setIsActive(true);
    setIngredients([
      {
        id: '1',
        ingredient: null,
        quantity: 0,
        unit: undefined,
        isOptional: false
      }
    ]);
    setNextIngredientId(2);
    setValidationError(undefined);
    setTabValue(0);
    setModifiers([]);
    setAttributes([]);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setFetchingData(true);
      const [finishedResult, ingredientResult] = await Promise.all([
        companyProductService.getAllFlat({ getAll: true, isIngredient: false }),
        companyProductService.getAllFlat({ getAll: true, isIngredient: true })
      ]);

      setProducts(finishedResult || []);
      setIngredientProducts(ingredientResult || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setIngredientProducts([]);
    } finally {
      setFetchingData(false);
    }
  }, []);

  const fetchAttributes = useCallback(async (productId: number) => {
    try {
      const result = await companyProductService.getAttributes(productId);
      setAttributes(result || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setAttributes([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProducts();

      if (isEditMode && recipe) {
        setDescription(recipe.description || '');
        setFinishedProduct(recipe.finishedProduct || null);
        setYieldQuantity(recipe.yieldQuantity || 0);
        setYieldUnit((recipe.yieldUnit as StockUnit) || StockUnit.PORTION);
        setPrepTime(recipe.prepTime || 0);
        setCookTime(recipe.cookTime || 0);
        setInstructions(recipe.instructions || '');
        setIsActive(recipe.isActive ?? true);

        if (recipe.ingredients && recipe.ingredients.length > 0) {
          setIngredients(
            recipe.ingredients.map((ing, index) => ({
              id: String(index + 1),
              ingredient: ing.ingredient || null,
              quantity: ing.quantity || 0,
              unit: (ing.unit as StockUnit) || StockUnit.GRAM,
              isOptional: ing.isOptional ?? false
            }))
          );
          setNextIngredientId(recipe.ingredients.length + 1);
        }

        // Fetch attributes for the finished product
        if (recipe.finishedProduct?.id) {
          fetchAttributes(recipe.finishedProduct.id);
        }
      } else {
        resetForm();
      }
    }
  }, [open, recipe, isEditMode, fetchProducts, fetchAttributes, resetForm]);

  // Fetch attributes when finished product changes (create mode)
  useEffect(() => {
    if (open && !isEditMode && finishedProduct?.id) {
      fetchAttributes(finishedProduct.id);
    }
  }, [open, isEditMode, finishedProduct?.id, fetchAttributes]);

  const handleClose = () => {
    resetForm();
    setValidationError(undefined);
    onClose();
  };

  const ingredientsWithMissingPrices = ingredients.filter(
    (ing) => ing.ingredient && !ing.isOptional && !ing.ingredient.costPrice
  );

  const hasInvalidIngredients = ingredientsWithMissingPrices.length > 0;

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: String(nextIngredientId),
        ingredient: null,
        quantity: 0,
        unit: undefined,
        isOptional: false
      }
    ]);
    setNextIngredientId(nextIngredientId + 1);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  const handleIngredientChange = (
    id: string,
    field: keyof IngredientRow,
    value: any
  ) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.id === id) {
          const updated = { ...ing, [field]: value };
          if (field === 'ingredient' && value) {
            updated.unit = value.stockUnit;
          }
          return updated;
        }
        return ing;
      })
    );
  };

  const handleSave = async () => {
    if (loading) return;

    if (!finishedProduct) {
      setValidationError(
        t('recipes.form.finishedProduct') + ' ' + t('required')
      );
      return;
    }
    if (!yieldQuantity || yieldQuantity <= 0) {
      setValidationError(t('recipes.form.yieldQuantity') + ' ' + t('required'));
      return;
    }
    if (!yieldUnit) {
      setValidationError(t('recipes.form.yieldUnit') + ' ' + t('required'));
      return;
    }

    const validIngredients = ingredients.filter(
      (ing): ing is IngredientRow & { unit: StockUnit } =>
        !!ing.ingredient && !!ing.quantity && ing.quantity > 0 && !!ing.unit
    );

    if (validIngredients.length === 0) {
      setValidationError(t('recipes.form.atLeastOneIngredient'));
      return;
    }

    const invalidIngredients = validIngredients.filter(
      (ing) => !ing.isOptional && !ing.ingredient?.costPrice
    );

    if (invalidIngredients.length > 0) {
      const names = invalidIngredients
        .map((ing) => ing.ingredient?.name)
        .join(', ');
      setValidationError(`${t('recipes.validation.missing.price')}: ${names}`);
      return;
    }

    try {
      setLoading(true);
      setValidationError(undefined);

      const saveData = {
        description: description.trim() || undefined,
        companyProductId: finishedProduct.id!,
        yieldQuantity: yieldQuantity,
        yieldUnit: yieldUnit,
        prepTime: prepTime || undefined,
        cookTime: cookTime || undefined,
        instructions: instructions.trim() || undefined,
        isActive,
        ingredients: validIngredients.map((ing) => ({
          ingredientProductId: ing.ingredient!.id!,
          quantity: ing.quantity,
          unit: ing.unit,
          isOptional: ing.isOptional
        })),
        // Only include modifiers if we're creating (not editing) and there are modifiers
        ...(!isEditMode &&
          modifiers.length > 0 && {
            modifiers: modifiers.map((m) => ({
              attributeOptionId: m.attributeOptionId,
              modifierType: m.modifierType!,
              scaleMultiplier: m.scaleMultiplier,
              addIngredientId: m.addIngredientId,
              addQuantity: m.addQuantity,
              addUnit: m.addUnit,
              removeIngredientId: m.removeIngredientId,
              substituteFromId: m.substituteFromId,
              substituteToId: m.substituteToId,
              substituteQuantity: m.substituteQuantity,
              substituteUnit: m.substituteUnit
            }))
          })
      };

      await onSave(saveData);

      handleClose();
    } catch (error: any) {
      console.error('Error saving recipe:', error);

      // User-friendly error message
      let errorMessage = t('recipes.save.error');

      if (error?.response?.data?.message) {
        const backendMessage = error.response.data.message;
        // Don't show raw technical errors to user
        if (
          !backendMessage.includes('Prisma') &&
          !backendMessage.includes('Invalid `')
        ) {
          errorMessage = backendMessage;
        }
      }

      setValidationError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    finishedProduct &&
    yieldQuantity &&
    yieldQuantity > 0 &&
    yieldUnit &&
    ingredients.some(
      (ing) => ing.ingredient && ing.quantity && ing.quantity > 0 && ing.unit
    );

  const showAttributeImpactTab = attributes.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      className="recipe-dialog"
    >
      <DialogTitle>
        {isEditMode ? t('recipes.edit.title') : t('recipes.create.title')}
      </DialogTitle>
      <DialogContent>
        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
          >
            <Tab label={t('recipe.tab.basic')} />
            <Tab label={t('recipe.tab.timing')} />
            <Tab label={t('recipe.tab.instructions')} />
            <Tab label={t('recipe.tab.ingredients')} />
            {showAttributeImpactTab && (
              <Tab label={t('recipe.tab.attribute.impact')} />
            )}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <RecipeBasicInfoForm
            description={description}
            finishedProduct={finishedProduct}
            yieldQuantity={yieldQuantity}
            yieldUnit={yieldUnit}
            products={products}
            loading={loading}
            fetchingData={fetchingData}
            isActive={isActive}
            onDescriptionChange={setDescription}
            onFinishedProductChange={setFinishedProduct}
            onYieldQuantityChange={setYieldQuantity}
            onYieldUnitChange={setYieldUnit}
            onIsActiveChange={setIsActive}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <RecipeTimingForm
            prepTime={prepTime}
            cookTime={cookTime}
            loading={loading}
            onPrepTimeChange={setPrepTime}
            onCookTimeChange={setCookTime}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <RecipeInstructionsForm
            instructions={instructions}
            loading={loading}
            onInstructionsChange={setInstructions}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <RecipeIngredientsForm
            ingredients={ingredients}
            ingredientProducts={ingredientProducts}
            loading={loading}
            fetchingData={fetchingData}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
            onIngredientChange={handleIngredientChange}
          />
        </TabPanel>

        {showAttributeImpactTab && (
          <TabPanel value={tabValue} index={4}>
            <RecipeAttributeImpactForm
              recipeId={recipe?.id || null}
              attributes={attributes}
              ingredients={
                isEditMode && recipe?.ingredients
                  ? recipe.ingredients
                  : ingredients
                      .filter(
                        (ing) => ing.ingredient && ing.quantity && ing.unit
                      )
                      .map((ing) => ({
                        id: ing.ingredient!.id!,
                        recipeId: 0,
                        ingredientProductId: ing.ingredient!.id!,
                        ingredient: {
                          id: ing.ingredient!.id!,
                          name: ing.ingredient!.name!,
                          costPrice: ing.ingredient!.costPrice ?? undefined,
                          categoryId: ing.ingredient!.categoryId ?? undefined
                        },
                        quantity: ing.quantity,
                        unit: ing.unit!,
                        isOptional: ing.isOptional,
                        createdAt: new Date().toISOString()
                      }))
              }
              ingredientProducts={ingredientProducts}
              loading={loading || fetchingData}
              onModifiersChange={setModifiers}
            />
          </TabPanel>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Tooltip
          title={
            hasInvalidIngredients
              ? t('recipes.validation.cannot.save.missing.prices')
              : ''
          }
          arrow
        >
          <span>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading || !isFormValid || hasInvalidIngredients}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? t('saving') : t('save')}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default RecipeDialog;
