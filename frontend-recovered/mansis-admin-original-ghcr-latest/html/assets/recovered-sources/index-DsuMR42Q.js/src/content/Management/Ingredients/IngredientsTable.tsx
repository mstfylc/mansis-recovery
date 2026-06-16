import React, { useState, ChangeEvent } from 'react';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import {
  Box,
  Card,
  CardHeader,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
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
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { Add, SearchOutlined, CheckCircle, Cancel } from '@mui/icons-material';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import ImagePlaceholder from '@/components/images/ImagePlaceholder';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import NoDataFound from '@/components/NoDataFound';
import { useTableFilters } from '@/hooks/useTableFilters';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getCompanyProductStatusOptions } from '@/utils/statusOptions';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import StatusFilter from '@/components/filters/StatusFilter';
import LocationFilter from '@/components/filters/LocationFilter';
import StockUnitFilter from '@/components/filters/StockUnitFilter';
import { useUserViewMode } from '@/hooks/useUserViewMode';

interface IngredientsTableProps {
  ingredients: CompanyProduct[];
  loading: boolean;
  totalCount: number;
  setShowIngredientDialog: (show: boolean) => void;
  onDelete: (ingredientId: number) => void;
  onBulkDeleteIngredients?: (
    ingredients: CompanyProduct[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    ingredients: CompanyProduct[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onEdit: (ingredient: CompanyProduct) => void;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const IngredientsTable = ({
  ingredients,
  loading,
  totalCount,
  setShowIngredientDialog,
  onDelete,
  onBulkDeleteIngredients,
  onBulkUpdateStatus,
  onEdit,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: IngredientsTableProps) => {
  const [selectedIngredients, setSelectedIngredients] = useState<
    CompanyProduct[]
  >([]);
  const selectedBulkActions = selectedIngredients.length > 0;
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedIngredients, setStatusUpdateSelectedIngredients] =
    useState<CompanyProduct[]>([]);
  const { t } = useTranslation();
  const theme = useTheme();
  const { isSuperAdmin, isBranchAdmin, isAdminView } = useUserViewMode();
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
    handleCompanyChange,
    handleBranchChange,
    handleStockUnitChange,
    handleStockTrackedChange,
    handleTrackExpiryChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      status: undefined,
      companyId: undefined,
      search: '',
      limit: 10,
      page: 0,
      isIngredient: true // Always filter for ingredients
    },
    onFilterChange,
    pageKey
  });

  const handleSelectAllIngredients = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedIngredients(event.target.checked ? ingredients : []);
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

  const handleBulkDelete = async (ingredients: CompanyProduct[]) => {
    if (onBulkDeleteIngredients) {
      return onBulkDeleteIngredients(ingredients, () => {
        setSelectedIngredients([]);
      });
    }
  };

  const handleBulkStatusUpdate = async (ingredients: CompanyProduct[]) => {
    setStatusUpdateSelectedIngredients(ingredients);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedIngredients.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedIngredients, status, () => {
        setSelectedIngredients([]);
        setStatusUpdateSelectedIngredients([]);
      });
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: true,
    disabled: selectedIngredients.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('ingredients.bulk.delete.confirm.message'),
    variant: 'contained'
  };

  const statusUpdateButton = onBulkUpdateStatus
    ? ({
        label: 'change.status',
        icon: <EditTwoToneIcon />,
        color: 'primary',
        onClick: handleBulkStatusUpdate,
        showCondition: true,
        disabled: selectedIngredients.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(onBulkDeleteIngredients && deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : [])
  ];

  const selectedSomeIngredients =
    selectedIngredients.length > 0 &&
    selectedIngredients.length < ingredients.length;
  const selectedAllIngredients =
    selectedIngredients.length === ingredients.length;

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          size="small"
        />
      )
    },
    ...(!isBranchAdmin && isAdminView
      ? [
          {
            id: 'location',
            label: t('filters.location'),
            component: (
              <LocationFilter
                companyId={filters.companyId}
                branchId={filters.branchId}
                onCompanyChange={handleCompanyChange}
                onBranchChange={handleBranchChange}
                size="small"
              />
            )
          }
        ]
      : []),
    {
      id: 'stockUnit',
      label: t('filters.stock.unit'),
      component: (
        <StockUnitFilter
          value={filters.stockUnit}
          onChange={handleStockUnitChange}
          size="small"
        />
      )
    },
    {
      id: 'stockTracked',
      label: '',
      component: (
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.isStockTracked === true}
              onChange={(_e, checked) => handleStockTrackedChange(checked)}
              size="small"
            />
          }
          label={t('filters.stock.tracked')}
        />
      )
    },
    {
      id: 'trackExpiry',
      label: '',
      component: (
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.trackExpiry ?? false}
              onChange={(e) => handleTrackExpiryChange(e.target.checked)}
              size="small"
            />
          }
          label={t('filters.batch.tracked')}
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
      id: 'image',
      label: t('image'),
      align: 'center'
    },
    {
      id: 'name',
      label: t('ingredients.table.name'),
      align: 'left'
    },
    {
      id: 'category',
      label: t('category'),
      align: 'left'
    },
    {
      id: 'cost',
      label: t('cost'),
      align: 'left'
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'company',
            label: t('company'),
            align: 'left'
          }
        ]
      : []),
    {
      id: 'stockUnit',
      label: t('stock.unit'),
      align: 'center'
    },
    {
      id: 'stockTracked',
      label: t('stock.tracked'),
      align: 'center'
    },
    {
      id: 'batchTracked',
      label: t('batch.tracked'),
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
              <Box flex={1} p={2} className="ingredient-bulk-actions">
                <BulkActions<CompanyProduct>
                  selected={selectedIngredients}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                className="ingredient-filters"
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

                    <Button
                      className="ingredient-add-button"
                      startIcon={<Add />}
                      onClick={() => setShowIngredientDialog(true)}
                      sx={{
                        minWidth: 140,
                        ml: 2
                      }}
                      variant="contained"
                      color="primary"
                    >
                      <Typography>{t('ingredients.create.button')}</Typography>
                    </Button>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('ingredients.table.title')}
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length}>
                        <Box p={2} display="flex" justifyContent="center">
                          <CircularProgress />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : ingredients.length > 0 ? (
                    ingredients.map((ingredient) => {
                      const isIngredientSelected = selectedIngredients.some(
                        (i) => i.id === ingredient.id
                      );
                      return (
                        <TableRow
                          hover
                          key={ingredient.id}
                          selected={isIngredientSelected}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              color="primary"
                              checked={isIngredientSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) =>
                                handleSelectOneIngredient(event, ingredient.id)
                              }
                              value={isIngredientSelected}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ mx: 0, px: 0 }}
                            className="ingredient-image"
                          >
                            {ingredient.file?.url ? (
                              <CustomImageComponent
                                imageUrl={ingredient.file.url}
                                alt={ingredient.name}
                                onClick={handleImageClick}
                                width={54}
                                height={54}
                              />
                            ) : (
                              <Tooltip title={t('edit.ingredient')} arrow>
                                <Box onClick={() => onEdit(ingredient)}>
                                  <ImagePlaceholder width={54} height={54} />
                                </Box>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {ingredient.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {ingredient.category?.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                            >
                              {ingredient.costPrice
                                ? `${ingredient.costPrice.toFixed(2)} ${t('tl')}`
                                : '-'}
                            </Typography>
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {ingredient.company?.name || '-'}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell align="center">
                            {ingredient.stockUnit ? (
                              <Chip
                                size="small"
                                label={t(
                                  `stock.unit.${ingredient.stockUnit.toLowerCase()}`
                                )}
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {ingredient.isStockTracked ? (
                              <CheckCircle
                                sx={{ color: theme.colors.success.main }}
                              />
                            ) : (
                              <Cancel sx={{ color: theme.colors.error.main }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {ingredient.trackExpiry ? (
                              <CheckCircle
                                sx={{ color: theme.colors.success.main }}
                              />
                            ) : (
                              <Cancel sx={{ color: theme.colors.error.main }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={t(
                                `status.${ingredient.status?.toLowerCase()}`
                              )}
                              color={
                                ingredient.status === 'ACTIVE'
                                  ? 'success'
                                  : 'default'
                              }
                            />
                          </TableCell>

                          <TableCell
                            className="ingredient-actions"
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tooltip title={t('edit.ingredient')} arrow>
                              <IconButton
                                onClick={() => onEdit(ingredient)}
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
                            <Tooltip title={t('delete.ingredient')} arrow>
                              <IconButton
                                onClick={() => onDelete(ingredient.id)}
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
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('ingredients.no.data')}
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
          setStatusUpdateSelectedIngredients([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedIngredients}
        statusOptions={getCompanyProductStatusOptions()}
        title={t('bulk.status.update.ingredients.title')}
        description={t('bulk.status.update.ingredients.description')}
        itemDisplayProperty="name"
        currentStatusProperty="status"
      />
      <ImagePreviewModal
        open={imagePreviewOpen}
        imageUrl={previewImageUrl}
        onClose={() => setImagePreviewOpen(false)}
      />
    </Container>
  );
};

export default IngredientsTable;
