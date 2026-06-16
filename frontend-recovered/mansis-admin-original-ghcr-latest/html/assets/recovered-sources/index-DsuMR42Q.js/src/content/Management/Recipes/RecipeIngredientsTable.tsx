import React, { useState, ChangeEvent, useContext } from 'react';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import {
  Box,
  Card,
  CardHeader,
  Checkbox,
  Container,
  Divider,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Grid,
  Typography,
  Tooltip,
  IconButton,
  Button,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  Chip,
  TextField,
  MenuItem,
  Select
} from '@mui/material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { Add, SearchOutlined } from '@mui/icons-material';
import { debounce, prepareStockUnitLabel } from '@/utils/helpers';
import { useTranslation } from 'react-i18next';
import NoDataFound from '@/components/NoDataFound';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { ingredientService } from '@/data/ingredientService';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { RecipeIngredient } from '@/types/Recipe.interface';

interface RecipeIngredientsTableProps {
  ingredients: RecipeIngredient[];
  loading: boolean;
  onAddIngredient: (ingredient: Partial<RecipeIngredient>) => Promise<void>;
  onUpdateIngredient: (
    ingredientId: number,
    data: Partial<RecipeIngredient>
  ) => Promise<void>;
  onDeleteIngredient: (ingredientId: number) => Promise<void>;
  onBulkDeleteIngredients: (
    ingredients: RecipeIngredient[],
    onSuccess?: () => void
  ) => Promise<void>;
  onRefresh: () => void;
  rowsPerPageOptions?: number[];
}

const RecipeIngredientsTable = ({
  ingredients,
  loading,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onBulkDeleteIngredients,
  onRefresh,
  rowsPerPageOptions = [10, 30, 50, 100]
}: RecipeIngredientsTableProps) => {
  const [selectedIngredients, setSelectedIngredients] = useState<
    RecipeIngredient[]
  >([]);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(
    null
  );
  const [deletingIngredientId, setDeletingIngredientId] = useState<
    number | null
  >(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editData, setEditData] = useState<Partial<RecipeIngredient>>({});
  const [availableIngredients, setAvailableIngredients] = useState<
    CompanyProduct[]
  >([]);

  const selectedBulkActions = selectedIngredients.length > 0;
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const fetchIngredients = async () => {
    try {
      const response = await ingredientService.getAll({ getAll: true });
      setAvailableIngredients(response.items);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setAvailableIngredients([]);
    }
  };

  const handleSelectAllIngredients = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedIngredients(event.target.checked ? filteredIngredients : []);
  };

  const handleSelectOneIngredient = (
    _event: ChangeEvent<HTMLInputElement>,
    ingredientId: number
  ): void => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) return;

    if (!selectedIngredients.find((i) => i.id === ingredientId)) {
      setSelectedIngredients((prevSelected) => [...prevSelected, ingredient]);
    } else {
      setSelectedIngredients((prevSelected) =>
        prevSelected.filter((i) => i.id !== ingredientId)
      );
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBulkDelete = async (ingredients: RecipeIngredient[]) => {
    return onBulkDeleteIngredients(ingredients, () => {
      setSelectedIngredients([]);
    });
  };

  const handleSearch = debounce((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, 500);

  const handleStartEdit = (ingredient: RecipeIngredient) => {
    setEditingIngredientId(ingredient.id);
    const selectedIngredient = availableIngredients.find(
      (ing) => ing.id === ingredient.ingredientProductId
    );
    setEditData({
      ingredientProductId: ingredient.ingredientProductId,
      quantity: ingredient.quantity,
      unit: selectedIngredient?.stockUnit || ingredient.unit,
      isOptional: ingredient.isOptional
    });
  };

  const handleCancelEdit = () => {
    setEditingIngredientId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (editingIngredientId && editData) {
      await onUpdateIngredient(editingIngredientId, editData);
      setEditingIngredientId(null);
      setEditData({});
    }
  };

  const handleStartAddNew = async () => {
    if (availableIngredients.length === 0) {
      await fetchIngredients();
    }
    setIsAddingNew(true);
    setEditData({
      ingredientProductId: undefined,
      quantity: 1,
      unit: undefined,
      isOptional: false
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setEditData({});
  };

  const handleSaveNew = async () => {
    if (editData.ingredientProductId && editData.quantity && editData.unit) {
      await onAddIngredient(editData);
      setIsAddingNew(false);
      setEditData({});
    }
  };

  const handleDeleteClick = (ingredientId: number) => {
    setDeletingIngredientId(ingredientId);
  };

  const handleDeleteConfirm = async () => {
    if (deletingIngredientId) {
      await onDeleteIngredient(deletingIngredientId);
      setDeletingIngredientId(null);
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'Recipe'),
    disabled: selectedIngredients.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('recipes.bulk.delete.ingredients.confirm'),
    variant: 'contained'
  };

  const allButtons = [deleteButton];

  // Client-side filtering for search
  const filteredIngredients = ingredients.filter((ing) =>
    ing.ingredient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination
  const paginatedIngredients = filteredIngredients.slice(
    page * limit,
    page * limit + limit
  );

  const selectedSomeIngredients =
    selectedIngredients.length > 0 &&
    selectedIngredients.length < filteredIngredients.length;
  const selectedAllIngredients =
    filteredIngredients.length > 0 &&
    selectedIngredients.length === filteredIngredients.length;

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'center',
      padding: 'checkbox'
    },
    {
      id: 'ingredient',
      label: t('recipes.form.ingredient'),
      align: 'left'
    },
    {
      id: 'quantity',
      label: t('recipes.form.quantity'),
      align: 'center'
    },
    {
      id: 'unit',
      label: t('recipes.form.unit'),
      align: 'center'
    },
    {
      id: 'optional',
      label: t('recipes.form.optional'),
      align: 'center'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
  ];

  const renderEditableRow = (
    ingredient?: RecipeIngredient,
    isNew: boolean = false
  ) => {
    return (
      <TableRow key={isNew ? 'new-ingredient' : `edit-${ingredient?.id}`}>
        <TableCell padding="checkbox">
          {!isNew && <Checkbox disabled />}
        </TableCell>
        <TableCell>
          <Select
            size="small"
            fullWidth
            value={editData.ingredientProductId || ''}
            onChange={(e) => {
              const selectedId = Number(e.target.value);
              const selectedIngredient = availableIngredients.find(
                (ing) => ing.id === selectedId
              );
              setEditData({
                ...editData,
                ingredientProductId: selectedId,
                unit: selectedIngredient?.stockUnit
              });
            }}
            disabled={!isNew}
          >
            {availableIngredients.map((ing) => (
              <MenuItem key={ing.id} value={ing.id}>
                {ing.name}
              </MenuItem>
            ))}
          </Select>
        </TableCell>
        <TableCell align="center">
          <TextField
            size="small"
            type="number"
            value={editData.quantity || ''}
            onChange={(e) =>
              setEditData({ ...editData, quantity: Number(e.target.value) })
            }
            sx={{ width: 100 }}
          />
        </TableCell>
        <TableCell align="center">
          {editData.unit ? (
            <Chip
              size="small"
              label={t(prepareStockUnitLabel(editData.unit))}
              color="primary"
              variant="outlined"
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              -
            </Typography>
          )}
        </TableCell>
        <TableCell align="center">
          <Checkbox
            checked={editData.isOptional || false}
            onChange={(e) =>
              setEditData({ ...editData, isOptional: e.target.checked })
            }
          />
        </TableCell>
        <TableCell align="center">
          <Tooltip title={t('save')} arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={isNew ? handleSaveNew : handleSaveEdit}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('cancel')} arrow>
            <IconButton
              size="small"
              onClick={isNew ? handleCancelAddNew : handleCancelEdit}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Container disableGutters maxWidth={false} sx={{ maxWidth: '100%' }}>
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="stretch"
        spacing={3}
      >
        <Grid item xs={12}>
          <Card>
            {selectedBulkActions && (
              <Box flex={1} p={2}>
                <BulkActions<RecipeIngredient>
                  selected={selectedIngredients}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                action={
                  <Box display="flex" alignItems="center" gap={2}>
                    <FormControl sx={{ minWidth: 200 }}>
                      <OutlinedInput
                        size="small"
                        placeholder={`${t('search')}...`}
                        defaultValue={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        }
                      />
                    </FormControl>

                    <Can I="create" a="Recipe" ability={ability}>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleStartAddNew}
                        disabled={isAddingNew}
                      >
                        {t('recipes.add.ingredient')}
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('recipes.form.ingredients')} (
                      {filteredIngredients.length})
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={onRefresh}
                        sx={{
                          ml: 1,
                          '&:hover': {
                            background: theme.colors.primary.lighter
                          },
                          color: theme.palette.primary.main
                        }}
                      >
                        <RefreshTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            )}
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header) => (
                      <TableCell
                        key={header.id}
                        align={header.align as 'left' | 'center' | 'right'}
                        padding={
                          header.padding as 'checkbox' | 'none' | 'normal'
                        }
                      >
                        {header.id === 'checkbox' ? (
                          <Checkbox
                            color="primary"
                            checked={selectedAllIngredients}
                            indeterminate={selectedSomeIngredients}
                            onChange={handleSelectAllIngredients}
                          />
                        ) : (
                          header.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isAddingNew && renderEditableRow(undefined, true)}
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length}>
                        <Box p={2} display="flex" justifyContent="center">
                          <CircularProgress />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : paginatedIngredients.length > 0 ? (
                    paginatedIngredients.map((ingredient) => {
                      const isIngredientSelected = selectedIngredients.some(
                        (i) => i.id === ingredient.id
                      );
                      const isEditing = editingIngredientId === ingredient.id;

                      if (isEditing) {
                        return renderEditableRow(ingredient, false);
                      }

                      return (
                        <TableRow
                          hover
                          key={ingredient.id}
                          selected={isIngredientSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isIngredientSelected}
                              onChange={(event) =>
                                handleSelectOneIngredient(event, ingredient.id)
                              }
                              value={isIngredientSelected}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {ingredient.ingredient?.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {ingredient.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={t(prepareStockUnitLabel(ingredient.unit))}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {ingredient.isOptional ? (
                              <Chip
                                size="small"
                                label={t('yes')}
                                color="info"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                size="small"
                                label={t('no')}
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Can I="update" a="Recipe" ability={ability}>
                              <Tooltip title={t('edit')} arrow>
                                <IconButton
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.primary.lighter
                                    },
                                    color: theme.palette.primary.main
                                  }}
                                  color="inherit"
                                  size="small"
                                  onClick={() => handleStartEdit(ingredient)}
                                >
                                  <EditTwoToneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                            <Can I="delete" a="Recipe" ability={ability}>
                              <Tooltip title={t('delete')} arrow>
                                <IconButton
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.error.lighter
                                    },
                                    color: theme.palette.error.main
                                  }}
                                  color="inherit"
                                  size="small"
                                  onClick={() =>
                                    handleDeleteClick(ingredient.id)
                                  }
                                >
                                  <DeleteTwoTone fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('recipes.no.ingredients')}
                      colSpan={tableHeaders.length}
                    />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box p={2}>
              <TablePagination
                component="div"
                count={filteredIngredients.length}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={page}
                rowsPerPage={limit}
                rowsPerPageOptions={rowsPerPageOptions}
                labelRowsPerPage={t('rows.per.page')}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingIngredientId)}
        onClose={() => setDeletingIngredientId(null)}
        onConfirm={handleDeleteConfirm}
        title={t('confirm.delete')}
        message={t('recipes.ingredient.delete.confirm.message')}
        confirmButtonText={t('delete')}
        confirmButtonColor="error"
      />
    </Container>
  );
};

export default RecipeIngredientsTable;
