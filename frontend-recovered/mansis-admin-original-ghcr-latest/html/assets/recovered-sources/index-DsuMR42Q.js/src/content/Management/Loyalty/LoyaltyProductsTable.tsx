import React, { useState, ChangeEvent, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
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
import { BranchLoyaltyProduct } from '@/types/Loyalty.interface';

import { Add, SearchOutlined } from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import StatusLabel from '@/components/StatusLabel';
import { useTranslation } from 'react-i18next';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import StatusFilter from '@/components/filters/StatusFilter';
import LocationFilter from '@/components/filters/LocationFilter';
import { useUserViewMode } from '@/hooks/useUserViewMode';

interface LoyaltyProductsTableProps {
  products: BranchLoyaltyProduct[];
  loading: boolean;
  totalCount: number;
  onDeleteProduct: (productId: number, branchId?: number) => void;
  onBulkDeleteProducts?: (
    products: BranchLoyaltyProduct[],
    onSuccess?: () => void
  ) => Promise<void>;
  onOpenAddDialog: () => void;
  onOpenEditDialog: (product: BranchLoyaltyProduct) => void;
  onFilterChange: (filters: Filters) => void;
  pageKey?: string;
}

const LoyaltyProductsTable = ({
  products = [],
  loading,
  totalCount,
  onDeleteProduct,
  onBulkDeleteProducts,
  onOpenAddDialog,
  onOpenEditDialog,
  onFilterChange,
  pageKey
}: LoyaltyProductsTableProps) => {
  const [selectedProducts, setSelectedProducts] = useState<
    BranchLoyaltyProduct[]
  >([]);
  const [rowsPerPageOptions] = useState<number[]>([10, 30, 50, 100]);
  const ability = useContext(AbilityContext);
  const canDeleteLoyalty = ability.can(Action.Delete, 'Loyalty');
  const selectedBulkActions = canDeleteLoyalty && selectedProducts.length > 0;
  const selectedSomeProducts =
    selectedProducts.length > 0 && selectedProducts.length < products.length;
  const selectedAllProducts =
    products.length > 0 && selectedProducts.length === products.length;
  const theme = useTheme();

  const canManageLoyalty = ability.can(Action.Manage, 'Loyalty');

  const { isSuperAdmin, isCompanyAdmin, isAdminView } = useUserViewMode();
  const showCompanyColumn = isSuperAdmin;
  const showBranchColumn = (isSuperAdmin || isCompanyAdmin) && isAdminView;

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
    handleBranchChange,
    handleCompanyChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      status: undefined,
      companyId: undefined,
      branchId: undefined,
      search: '',
      limit: 10,
      page: 0
    },
    onFilterChange,
    pageKey
  });

  const { t } = useTranslation();

  const tableHeaders = [
    ...(canDeleteLoyalty
      ? [{ id: 'checkbox', label: '', align: 'left', padding: 'checkbox' }]
      : []),
    { id: 'name', label: t('product.name'), align: 'left' },
    { id: 'category', label: t('category'), align: 'left' },
    ...(showBranchColumn || showCompanyColumn
      ? [{ id: 'location', label: t('location'), align: 'left' }]
      : []),
    { id: 'status', label: t('status'), align: 'center' },
    { id: 'basePrice', label: t('base.price'), align: 'center' },
    { id: 'pointCost', label: t('loyalty.point.cost'), align: 'center' },
    ...(canManageLoyalty
      ? [{ id: 'actions', label: t('actions'), align: 'center' }]
      : [])
  ];

  const handleSelectAllProducts = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    if (!canDeleteLoyalty) return;
    setSelectedProducts(event.target.checked ? products : []);
  };

  const handleSelectOneProduct = (
    event: ChangeEvent<HTMLInputElement> | null,
    productId: number
  ): void => {
    if (event) event.stopPropagation();
    if (!canDeleteLoyalty) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (!selectedProducts.find((p) => p.id === productId)) {
      setSelectedProducts((prev) => [...prev, product]);
    } else {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    onFilterChange({ ...filters, page: newPage });
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newLimit = parseInt(event.target.value);
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 0 }));
    onFilterChange({ ...filters, page: 0, limit: newLimit });
  };

  const handleBulkDelete = async (items: BranchLoyaltyProduct[]) => {
    if (onBulkDeleteProducts) {
      return onBulkDeleteProducts(items, () => {
        setSelectedProducts([]);
      });
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'Loyalty'),
    disabled: selectedProducts.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('confirm.bulk.delete.question'),
    variant: 'contained'
  };

  const allButtons = [deleteButton];

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Status filter uses isActive boolean as active/passive
  const statusOptions = [
    { id: 'all', name: t('all') },
    { id: 'active', name: t('active') },
    { id: 'passive', name: t('passive') }
  ];

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          options={statusOptions}
          size="small"
        />
      )
    },
    ...(isAdminView
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
      : [])
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
              <Box flex={1} p={2}>
                <BulkActions<BranchLoyaltyProduct>
                  selected={selectedProducts}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
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

                    <Can I="create" a="Loyalty" ability={ability}>
                      <Button
                        startIcon={<Add />}
                        onClick={onOpenAddDialog}
                        sx={{ ml: 1 }}
                        variant="contained"
                        color="primary"
                      >
                        <Typography>{t('loyalty.products.add')}</Typography>
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('loyalty.products.title')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={() => onFilterChange({ ...filters })}
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
                            checked={selectedAllProducts}
                            indeterminate={selectedSomeProducts}
                            onChange={handleSelectAllProducts}
                            onClick={(event) => event.stopPropagation()}
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
                  ) : products.length > 0 ? (
                    products.map((product) => {
                      const isProductSelected = selectedProducts.some(
                        (p) => p.id === product.id
                      );
                      return (
                        <TableRow
                          hover
                          key={product.id}
                          selected={isProductSelected}
                        >
                          {canDeleteLoyalty && (
                            <TableCell
                              padding="checkbox"
                              onClick={handleSelectClick}
                            >
                              <Checkbox
                                color="primary"
                                checked={isProductSelected}
                                onChange={(
                                  event: ChangeEvent<HTMLInputElement>
                                ) => handleSelectOneProduct(event, product.id)}
                                value={isProductSelected}
                                onClick={handleSelectClick}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography fontWeight="medium">
                              {product.product?.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.product?.category?.name || '-'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          {(showBranchColumn || showCompanyColumn) && (
                            <TableCell>
                              <Typography fontWeight="bold">
                                {product.branch?.name || '-'}
                              </Typography>
                              {showCompanyColumn && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {product.branch?.company?.name || '-'}
                                </Typography>
                              )}
                            </TableCell>
                          )}
                          <TableCell align="center">
                            <StatusLabel
                              status={product.isActive ? 'ACTIVE' : 'PASSIVE'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="medium">
                              {product.product?.basePrice?.toFixed(2) || '0.00'}{' '}
                              ₺
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${product.pointCost} ${t('points')}`}
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          {canManageLoyalty && (
                            <TableCell
                              align="center"
                              onClick={handleSelectClick}
                            >
                              <Can I="update" a="Loyalty" ability={ability}>
                                <Tooltip title={t('edit')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenEditDialog(product);
                                    }}
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
                              <Can I="delete" a="Loyalty" ability={ability}>
                                <Tooltip title={t('delete')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteProduct(
                                        product.id,
                                        product.branchId
                                      );
                                    }}
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
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.product.found')}
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
    </Container>
  );
};

export default LoyaltyProductsTable;
