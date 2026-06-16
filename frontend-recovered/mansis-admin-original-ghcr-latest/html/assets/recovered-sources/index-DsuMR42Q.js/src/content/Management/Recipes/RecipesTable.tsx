import React, { useState, ChangeEvent, useContext } from 'react';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import { useNavigate } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { Recipe } from '@/types/Recipe.interface';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import NoDataFound from '@/components/NoDataFound';
import { useTableFilters } from '@/hooks/useTableFilters';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import StatusFilter from '@/components/filters/StatusFilter';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';

interface RecipesTableProps {
  recipes: Recipe[];
  loading: boolean;
  totalCount: number;
  setShowRecipeDialog: (show: boolean) => void;
  onDelete: (recipeId: number) => void;
  onBulkDeleteRecipes?: (
    recipes: Recipe[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    recipes: Recipe[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onEdit: (recipe: Recipe) => void;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const RecipesTable = ({
  recipes,
  loading,
  totalCount,
  setShowRecipeDialog,
  onDelete,
  onBulkDeleteRecipes,
  onBulkUpdateStatus,
  onEdit,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: RecipesTableProps) => {
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const selectedBulkActions = selectedRecipes.length > 0;
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedRecipes, setStatusUpdateSelectedRecipes] =
    useState<Recipe[]>([]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isSuperAdmin } = useUserViewMode();

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      status: undefined,
      search: '',
      limit: 10,
      page: 0
    },
    onFilterChange,
    pageKey
  });

  const handleSelectAllRecipes = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedRecipes(event.target.checked ? recipes : []);
  };

  const handleSelectOneRecipe = (
    _event: ChangeEvent<HTMLInputElement>,
    recipeId: number
  ): void => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    if (!selectedRecipes.find((r) => r.id === recipeId)) {
      setSelectedRecipes((prevSelected) => [...prevSelected, recipe]);
    } else {
      setSelectedRecipes((prevSelected) =>
        prevSelected.filter((r) => r.id !== recipeId)
      );
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
    onFilterChange({
      ...filters,
      page: newPage
    });
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newLimit = parseInt(event.target.value);
    setFilters((prev) => ({
      ...prev,
      limit: newLimit,
      page: 0
    }));
    onFilterChange({
      ...filters,
      page: 0,
      limit: newLimit
    });
  };

  const handleBulkDelete = async (recipes: Recipe[]) => {
    if (onBulkDeleteRecipes) {
      return onBulkDeleteRecipes(recipes, () => {
        setSelectedRecipes([]);
      });
    }
  };

  const handleBulkStatusUpdate = async () => {
    setStatusUpdateSelectedRecipes(selectedRecipes);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateSave = async (status: string) => {
    if (onBulkUpdateStatus) {
      await onBulkUpdateStatus(statusUpdateSelectedRecipes, status, () => {
        setSelectedRecipes([]);
        setStatusUpdateSelectedRecipes([]);
      });
    }
  };

  const recipeStatusOptions = [
    { value: 'ACTIVE', label: 'status.active' },
    { value: 'PASSIVE', label: 'status.passive' }
  ];

  const ability = useContext(AbilityContext);

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'Recipe'),
    disabled: selectedRecipes.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('recipes.bulk.delete.confirm.message'),
    variant: 'contained'
  };

  const statusUpdateButton = onBulkUpdateStatus
    ? ({
        label: 'change.status',
        icon: <EditTwoToneIcon />,
        color: 'primary',
        onClick: handleBulkStatusUpdate,
        showCondition: ability.can(Action.Update, 'Recipe'),
        disabled: selectedRecipes.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(onBulkDeleteRecipes && deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : [])
  ];

  const selectedSomeRecipes =
    selectedRecipes.length > 0 && selectedRecipes.length < recipes.length;
  const selectedAllRecipes = selectedRecipes.length === recipes.length;

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleViewDetails = (recipeId: number) => {
    navigate(`/management/recipes/${recipeId}`);
  };

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          size="small"
          options={[
            { id: 'all', name: t('all') },
            { id: 'active', name: t('active') },
            { id: 'passive', name: t('passive') }
          ]}
        />
      )
    }
  ];

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left',
      padding: 'checkbox'
    },
    {
      id: 'product',
      label: t('recipes.table.product'),
      align: 'left'
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'location',
            label: t('location'),
            align: 'left'
          }
        ]
      : []),
    {
      id: 'ingredients',
      label: t('recipes.table.ingredients'),
      align: 'center'
    },
    {
      id: 'yield',
      label: t('recipes.table.yield'),
      align: 'center'
    },
    {
      id: 'createdAt',
      label: t('created.at'),
      align: 'center'
    },
    {
      id: 'status',
      label: t('status'),
      align: 'center'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
  ];

  return (
    <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
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
              <Box flex={1} p={2} className="recipe-bulk-actions">
                <BulkActions<Recipe>
                  selected={selectedRecipes}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                className="recipe-filters"
                action={
                  <Box display="flex" alignItems="center" width="100%">
                    <FormControl sx={{ minWidth: 200, mr: 2 }}>
                      <OutlinedInput
                        placeholder={`${t('search')}...`}
                        defaultValue={filters.search}
                        onChange={(e) => handleSearch(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        }
                        size="small"
                      />
                    </FormControl>

                    <FilterPopover
                      filterOptions={filterOptions}
                      onApplyFilters={handleApplyFilters}
                      onResetFilters={handleResetFilters}
                      activeFiltersCount={getActiveFiltersCount()}
                    />

                    <Can I="create" a="Recipe" ability={ability}>
                      <Button
                        className="recipe-add-button"
                        startIcon={<Add />}
                        onClick={() => setShowRecipeDialog(true)}
                        sx={{
                          minWidth: 140,
                          ml: 2
                        }}
                        variant="contained"
                        color="primary"
                      >
                        <Typography>{t('recipes.create.button')}</Typography>
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('recipes.table.title')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={() => {
                          onFilterChange({
                            ...filters
                          });
                        }}
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
                            checked={selectedAllRecipes}
                            indeterminate={selectedSomeRecipes}
                            onChange={handleSelectAllRecipes}
                          />
                        ) : (
                          header.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length}>
                        <Box p={2} display="flex" justifyContent="center">
                          <CircularProgress />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : recipes.length > 0 ? (
                    recipes.map((recipe) => {
                      const isRecipeSelected = selectedRecipes.some(
                        (r) => r.id === recipe.id
                      );
                      return (
                        <TableRow
                          hover
                          key={recipe.id}
                          selected={isRecipeSelected}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              color="primary"
                              checked={isRecipeSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneRecipe(event, recipe.id)}
                              value={isRecipeSelected}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {recipe.finishedProduct?.name || '-'}
                            </Typography>
                            {recipe.finishedProduct?.category && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {recipe.finishedProduct.category.name}
                              </Typography>
                            )}
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {recipe.finishedProduct?.company?.name || '-'}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell align="center">
                            {recipe._count?.ingredients || 0}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={
                                recipe.yieldQuantity +
                                ' ' +
                                t(prepareStockUnitLabel(recipe.yieldUnit))
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {formatDateToDayMonthYearTime(recipe.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={t(
                                recipe.isActive
                                  ? 'status.active'
                                  : 'status.passive'
                              )}
                              color={recipe.isActive ? 'success' : 'default'}
                            />
                          </TableCell>

                          <TableCell
                            className="recipe-actions"
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Can I="read" a="Recipe" ability={ability}>
                              <Tooltip title={t('view.details')} arrow>
                                <IconButton
                                  onClick={() => handleViewDetails(recipe.id)}
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.info.lighter
                                    },
                                    color: theme.palette.info.main
                                  }}
                                  color="inherit"
                                  size="small"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                            <Can I="update" a="Recipe" ability={ability}>
                              <Tooltip title={t('edit.recipe')} arrow>
                                <IconButton
                                  onClick={() => onEdit(recipe)}
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.primary.lighter
                                    },
                                    color: theme.palette.primary.main
                                  }}
                                  color="inherit"
                                  size="small"
                                >
                                  <EditTwoToneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                            <Can I="delete" a="Recipe" ability={ability}>
                              <Tooltip title={t('delete.recipe')} arrow>
                                <IconButton
                                  onClick={() => onDelete(recipe.id)}
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.error.lighter
                                    },
                                    color: theme.palette.error.main
                                  }}
                                  color="inherit"
                                  size="small"
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
                      message={t('recipes.no.data')}
                      colSpan={tableHeaders.length}
                    />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box p={2}>
              <TablePagination
                component="div"
                count={totalCount || 0}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={filters.page || 0}
                rowsPerPage={filters.limit || 10}
                rowsPerPageOptions={rowsPerPageOptions}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedRecipes([]);
        }}
        onConfirm={handleStatusUpdateSave}
        selectedItems={statusUpdateSelectedRecipes}
        statusOptions={recipeStatusOptions}
        title={t('recipes.bulk.status.update.title')}
        description={t('recipes.bulk.status.update.description')}
        itemDisplayProperty={(item) => item.finishedProduct?.name || ''}
        currentStatusProperty="isActive"
      />
    </Container>
  );
};

export default RecipesTable;
