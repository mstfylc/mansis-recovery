import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { StockUnit } from '@/types/stock';
import {
  ProductAttribute,
  ProductAttributeOption
} from '@/types/ProductAttribute.interface';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { RecipeIngredient } from '@/types/Recipe.interface';
import {
  RecipeModifier,
  ModifierType,
  MODIFIER_TYPES,
  ModifierFormData
} from '@/types/RecipeModifier.interface';
import { recipeService } from '@/data/recipeService';
import NumericInput from '../../NumericInput';

interface RecipeAttributeImpactFormProps {
  recipeId: number | null;
  attributes: ProductAttribute[];
  ingredients: RecipeIngredient[];
  ingredientProducts: CompanyProduct[];
  loading: boolean;
  onModifiersChange?: (modifiers: ModifierFormData[]) => void;
}

const RecipeAttributeImpactForm = ({
  recipeId,
  attributes,
  ingredients,
  ingredientProducts,
  loading: parentLoading,
  onModifiersChange
}: RecipeAttributeImpactFormProps) => {
  const { t } = useTranslation();
  const [modifiers, setModifiers] = useState<RecipeModifier[]>([]);
  const [modifierForms, setModifierForms] = useState<
    Map<number, ModifierFormData>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadModifiers = useCallback(async () => {
    if (!recipeId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await recipeService.getModifiers(recipeId);
      setModifiers(data);

      // Initialize forms for existing modifiers
      const forms = new Map<number, ModifierFormData>();
      data.forEach((modifier) => {
        forms.set(modifier.attributeOptionId, {
          id: modifier.id,
          attributeOptionId: modifier.attributeOptionId,
          modifierType: modifier.modifierType,
          scaleMultiplier: modifier.scaleMultiplier || undefined,
          addIngredientId: modifier.addIngredientId || undefined,
          addQuantity: modifier.addQuantity || undefined,
          addUnit: modifier.addUnit || undefined,
          removeIngredientId: modifier.removeIngredientId || undefined,
          substituteFromId: modifier.substituteFromId || undefined,
          substituteToId: modifier.substituteToId || undefined,
          substituteQuantity: modifier.substituteQuantity || undefined,
          substituteUnit: modifier.substituteUnit || undefined
        });
      });
      setModifierForms(forms);
    } catch (err: any) {
      console.error('Failed to load modifiers:', err);
      setError(
        err.response?.data?.message || t('recipe.modifier.error.load.failed')
      );
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (recipeId) {
      loadModifiers();
    }
  }, [recipeId, loadModifiers]);

  const getModifierForOption = (optionId: number): ModifierFormData => {
    return (
      modifierForms.get(optionId) || {
        attributeOptionId: optionId,
        modifierType: ''
      }
    );
  };

  const updateModifierForm = (
    optionId: number,
    updates: Partial<ModifierFormData>
  ) => {
    const currentForm = getModifierForOption(optionId);
    const newForms = new Map(modifierForms);
    newForms.set(optionId, { ...currentForm, ...updates });
    setModifierForms(newForms);

    if (onModifiersChange) {
      const validModifiers = Array.from(newForms.values()).filter((m) => {
        if (!m.modifierType) return false;

        if (m.modifierType === 'SCALE_RECIPE' && !m.scaleMultiplier) {
          return false;
        }
        if (
          m.modifierType === 'ADD_INGREDIENT' &&
          (!m.addIngredientId || !m.addQuantity || !m.addUnit)
        ) {
          return false;
        }
        if (m.modifierType === 'REMOVE_INGREDIENT' && !m.removeIngredientId) {
          return false;
        }
        if (
          m.modifierType === 'SUBSTITUTE_INGREDIENT' &&
          (!m.substituteFromId ||
            !m.substituteToId ||
            !m.substituteQuantity ||
            !m.substituteUnit)
        ) {
          return false;
        }

        return true;
      });

      onModifiersChange(validModifiers);
    }
  };

  const handleSaveModifier = async (option: ProductAttributeOption) => {
    if (!recipeId) return;

    const formData = getModifierForOption(option.id);
    if (!formData.modifierType) {
      setError(t('recipe.modifier.error.select.type'));
      return;
    }

    // Validate required fields based on type
    if (formData.modifierType === 'SCALE_RECIPE' && !formData.scaleMultiplier) {
      setError(t('recipe.modifier.error.scale.required'));
      return;
    }
    if (
      formData.modifierType === 'ADD_INGREDIENT' &&
      (!formData.addIngredientId || !formData.addQuantity || !formData.addUnit)
    ) {
      setError(t('recipe.modifier.error.add.fields.required'));
      return;
    }
    if (
      formData.modifierType === 'REMOVE_INGREDIENT' &&
      !formData.removeIngredientId
    ) {
      setError(t('recipe.modifier.error.remove.required'));
      return;
    }
    if (
      formData.modifierType === 'SUBSTITUTE_INGREDIENT' &&
      (!formData.substituteFromId ||
        !formData.substituteToId ||
        !formData.substituteQuantity ||
        !formData.substituteUnit)
    ) {
      setError(t('recipe.modifier.error.substitute.required'));
      return;
    }

    setSaving(option.id);
    setError(null);
    try {
      if (formData.id) {
        // Update existing
        const updated = await recipeService.updateModifier(
          recipeId,
          formData.id,
          {
            modifierType: formData.modifierType as ModifierType,
            scaleMultiplier: formData.scaleMultiplier,
            addIngredientId: formData.addIngredientId,
            addQuantity: formData.addQuantity,
            addUnit: formData.addUnit,
            removeIngredientId: formData.removeIngredientId,
            substituteFromId: formData.substituteFromId,
            substituteToId: formData.substituteToId,
            substituteQuantity: formData.substituteQuantity,
            substituteUnit: formData.substituteUnit
          }
        );
        setModifiers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
      } else {
        // Create new
        const created = await recipeService.createModifier(recipeId, {
          recipeId,
          attributeOptionId: option.id,
          modifierType: formData.modifierType as ModifierType,
          scaleMultiplier: formData.scaleMultiplier,
          addIngredientId: formData.addIngredientId,
          addQuantity: formData.addQuantity,
          addUnit: formData.addUnit,
          removeIngredientId: formData.removeIngredientId,
          substituteFromId: formData.substituteFromId,
          substituteToId: formData.substituteToId,
          substituteQuantity: formData.substituteQuantity,
          substituteUnit: formData.substituteUnit
        });
        setModifiers((prev) => [...prev, created]);
        updateModifierForm(option.id, { id: created.id });
      }
    } catch (err: any) {
      console.error('Failed to save modifier:', err);
      setError(
        err.response?.data?.message || t('recipe.modifier.error.save.failed')
      );
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteModifier = async (option: ProductAttributeOption) => {
    if (!recipeId) return;

    const formData = getModifierForOption(option.id);
    if (!formData.id) return;

    setSaving(option.id);
    setError(null);
    try {
      await recipeService.deleteModifier(recipeId, formData.id);
      setModifiers((prev) => prev.filter((m) => m.id !== formData.id));
      const newForms = new Map(modifierForms);
      newForms.delete(option.id);
      setModifierForms(newForms);
    } catch (err: any) {
      console.error('Failed to delete modifier:', err);
      setError(
        err.response?.data?.message || t('recipe.modifier.error.delete.failed')
      );
    } finally {
      setSaving(null);
    }
  };

  /**
   * Memoized check for multiple scale modifiers
   * Only recalculates when modifierForms changes
   */
  const hasMultipleScales = useMemo(() => {
    let scaleCount = 0;
    modifierForms.forEach((form) => {
      if (form.modifierType === 'SCALE_RECIPE') scaleCount++;
    });
    return scaleCount > 1;
  }, [modifierForms]);

  const getSubstituteUnit = (
    formData: ModifierFormData
  ): string | undefined => {
    return (
      formData.substituteUnit ||
      ingredientProducts.find((p) => p.id === formData.substituteToId)
        ?.stockUnit
    );
  };

  if (parentLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (attributes.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('recipe.attribute.impact.no.attributes')}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {hasMultipleScales && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {t('recipe.modifier.validation.multiple.scale')}
          </Typography>
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('recipe.attribute.impact.description')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 2
        }}
      >
        {attributes.map((attribute) => (
          <Card
            key={attribute.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 2,
              height: 'fit-content'
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {attribute.name}
                </Typography>
                {attribute.options && (
                  <Chip
                    label={`${
                      modifiers.filter((m) =>
                        attribute.options?.some(
                          (opt) => opt.id === m.attributeOptionId
                        )
                      ).length
                    }/${attribute.options.length} ${t('recipe.modifier.configured')}`}
                    size="small"
                    color={
                      modifiers.filter((m) =>
                        attribute.options?.some(
                          (opt) => opt.id === m.attributeOptionId
                        )
                      ).length === attribute.options.length
                        ? 'success'
                        : 'default'
                    }
                    variant="outlined"
                  />
                )}
              </Box>
              <Stack spacing={3}>
                {attribute.options?.map((option) => {
                  const formData = getModifierForOption(option.id);
                  const isSaving = saving === option.id;
                  const hasModifier = !!formData.id;

                  return (
                    <Box
                      key={option.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {option.name}
                        </Typography>
                        {recipeId && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={
                                isSaving ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <SaveIcon />
                                )
                              }
                              onClick={() => handleSaveModifier(option)}
                              disabled={isSaving || !formData.modifierType}
                            >
                              {hasModifier ? t('update') : t('save')}
                            </Button>
                            {hasModifier && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteModifier(option)}
                                disabled={isSaving}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </Box>

                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>{t('recipe.modifier.type')}</InputLabel>
                        <Select
                          value={formData.modifierType}
                          label={t('recipe.modifier.type')}
                          onChange={(e) =>
                            updateModifierForm(option.id, {
                              modifierType: e.target.value as ModifierType
                            })
                          }
                        >
                          {MODIFIER_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {t(`recipe.modifier.type.${type.toLowerCase()}`)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {formData.modifierType === 'SCALE_RECIPE' && (
                        <NumericInput
                          label={t('recipe.modifier.scale.multiplier')}
                          value={formData.scaleMultiplier || 1}
                          onChange={(value) =>
                            updateModifierForm(option.id, {
                              scaleMultiplier: value
                            })
                          }
                          min={0.1}
                          max={10}
                          allowDecimals={true}
                          decimalPlaces={2}
                          fullWidth
                          size="small"
                        />
                      )}

                      {formData.modifierType === 'ADD_INGREDIENT' && (
                        <Stack spacing={2}>
                          <Autocomplete
                            size="small"
                            options={ingredientProducts}
                            getOptionLabel={(option) => option.name || ''}
                            value={
                              ingredientProducts.find(
                                (p) => p.id === formData.addIngredientId
                              ) || null
                            }
                            onChange={(_, newValue) =>
                              updateModifierForm(option.id, {
                                addIngredientId: newValue?.id,
                                addUnit: newValue?.stockUnit as StockUnit
                              })
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={t('recipe.modifier.add.ingredient')}
                              />
                            )}
                          />
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 2,
                              alignItems: 'center'
                            }}
                          >
                            <NumericInput
                              label={t('recipe.modifier.add.quantity')}
                              value={formData.addQuantity || 0}
                              onChange={(value) =>
                                updateModifierForm(option.id, {
                                  addQuantity: value
                                })
                              }
                              min={0}
                              allowDecimals={true}
                              decimalPlaces={3}
                              fullWidth
                              size="small"
                            />
                            {formData.addUnit && (
                              <Chip
                                label={t(
                                  prepareStockUnitLabel(formData.addUnit)
                                )}
                                size="small"
                                sx={{ minWidth: 80 }}
                              />
                            )}
                          </Box>
                        </Stack>
                      )}

                      {formData.modifierType === 'REMOVE_INGREDIENT' && (
                        <FormControl fullWidth size="small">
                          <InputLabel>
                            {t('recipe.modifier.remove.ingredient')}
                          </InputLabel>
                          <Select
                            value={formData.removeIngredientId || ''}
                            label={t('recipe.modifier.remove.ingredient')}
                            onChange={(e) =>
                              updateModifierForm(option.id, {
                                removeIngredientId: Number(e.target.value)
                              })
                            }
                          >
                            {ingredients.map((ing) => (
                              <MenuItem key={ing.id} value={ing.id}>
                                {ing.ingredient?.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {formData.modifierType === 'SUBSTITUTE_INGREDIENT' && (
                        <Stack spacing={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>
                              {t('recipe.modifier.substitute.from')}
                            </InputLabel>
                            <Select
                              value={formData.substituteFromId || ''}
                              label={t('recipe.modifier.substitute.from')}
                              onChange={(e) =>
                                updateModifierForm(option.id, {
                                  substituteFromId: Number(e.target.value)
                                })
                              }
                            >
                              {ingredients.map((ing) => (
                                <MenuItem key={ing.id} value={ing.id}>
                                  {ing.ingredient?.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 2,
                              alignItems: 'flex-start'
                            }}
                          >
                            <Autocomplete
                              size="small"
                              options={ingredientProducts}
                              getOptionLabel={(option) => option.name || ''}
                              value={
                                ingredientProducts.find(
                                  (p) => p.id === formData.substituteToId
                                ) || null
                              }
                              onChange={(_, newValue) =>
                                updateModifierForm(option.id, {
                                  substituteToId: newValue?.id,
                                  substituteUnit:
                                    newValue?.stockUnit as StockUnit
                                })
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label={t('recipe.modifier.substitute.to')}
                                />
                              )}
                              sx={{ flex: 1 }}
                            />
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                flex: 1
                              }}
                            >
                              <NumericInput
                                label={t('recipe.modifier.substitute.quantity')}
                                value={formData.substituteQuantity || 0}
                                onChange={(value) =>
                                  updateModifierForm(option.id, {
                                    substituteQuantity: value
                                  })
                                }
                                min={0}
                                allowDecimals={true}
                                decimalPlaces={3}
                                fullWidth
                                size="small"
                              />
                              {getSubstituteUnit(formData) && (
                                <Chip
                                  label={t(
                                    prepareStockUnitLabel(
                                      getSubstituteUnit(formData)!
                                    )
                                  )}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                  sx={{ minWidth: 80 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Stack>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default RecipeAttributeImpactForm;
