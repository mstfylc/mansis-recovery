import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Checkbox,
  IconButton,
  Chip,
  Typography,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { IngredientRow } from '@/types/Recipe.interface';
import NumericInput from '../../NumericInput';

interface RecipeIngredientsFormProps {
  ingredients: IngredientRow[];
  ingredientProducts: CompanyProduct[];
  loading: boolean;
  fetchingData: boolean;
  onAddIngredient: () => void;
  onRemoveIngredient: (id: string) => void;
  onIngredientChange: (
    id: string,
    field: keyof IngredientRow,
    value: any
  ) => void;
}

const RecipeIngredientsForm = ({
  ingredients,
  ingredientProducts,
  loading,
  fetchingData,
  onAddIngredient,
  onRemoveIngredient,
  onIngredientChange
}: RecipeIngredientsFormProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Box sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {t('recipes.form.ingredients')} *
        </Box>
        <Button
          startIcon={<AddIcon />}
          onClick={onAddIngredient}
          disabled={loading}
          size="small"
        >
          {t('recipes.form.addIngredient')}
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="35%">{t('recipes.form.ingredient')}</TableCell>
              <TableCell width="20%">{t('recipes.form.quantity')}</TableCell>
              <TableCell width="20%">{t('recipes.form.unit')}</TableCell>
              <TableCell width="15%">{t('recipes.form.optional')}</TableCell>
              <TableCell width="10%">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingredients.map((ing) => {
              const hasMissingPrice =
                ing.ingredient && !ing.isOptional && !ing.ingredient.costPrice;

              return (
                <TableRow
                  key={ing.id}
                  sx={{
                    bgcolor: hasMissingPrice ? 'warning.light' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {hasMissingPrice && (
                        <Tooltip
                          title={t('recipes.validation.missing.price.tooltip')}
                        >
                          <WarningIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Autocomplete
                          size="small"
                          options={ingredientProducts}
                          getOptionLabel={(option) => option.name || ''}
                          value={ing.ingredient}
                          onChange={(_, newValue) =>
                            onIngredientChange(ing.id, 'ingredient', newValue)
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={t('recipes.form.selectIngredient')}
                              disabled={fetchingData || loading}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {fetchingData ? (
                                      <CircularProgress size={16} />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                )
                              }}
                            />
                          )}
                          disabled={loading}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <NumericInput
                      size="small"
                      value={ing.quantity}
                      onChange={(value) =>
                        onIngredientChange(ing.id, 'quantity', value)
                      }
                      disabled={loading}
                      allowDecimals
                      decimalPlaces={2}
                      min={0}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    {ing.ingredient && ing.unit ? (
                      <Chip
                        size="small"
                        label={t(`stock.unit.${ing.unit.toLowerCase()}`)}
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: 32
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={ing.isOptional}
                      onChange={(e) =>
                        onIngredientChange(
                          ing.id,
                          'isOptional',
                          e.target.checked
                        )
                      }
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveIngredient(ing.id)}
                      disabled={loading || ingredients.length === 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RecipeIngredientsForm;
