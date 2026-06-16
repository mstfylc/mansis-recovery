import React, { useState, ChangeEvent, useEffect } from 'react';
import { debounce } from '@/utils/helpers';
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
  Button,
  Tooltip,
  IconButton,
  CircularProgress,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import BulkActions from '@/components/BulkActions';
import StatusLabel from '@/components/StatusLabel';
import ProductTypeLabel from '@/components/ProductTypeLabel';
import StatusFilter from '@/components/filters/StatusFilter';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import ImagePlaceholder from '@/components/images/ImagePlaceholder';
import DateFilterBar from '@/components/filters/DateFilterBar';
import { DateRange } from '@/types/DateRange.interface';
import CompanyProductDialog from '@/components/modals/CompanyProductDialog';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import CategoryFilter from '@/components/filters/CategoryFilter';
import LocationFilter from '@/components/filters/LocationFilter';
import PriceRangeFilter from '@/components/filters/PriceRangeFilter';
import ProductTypeFilter from '@/components/filters/ProductTypeFilter';
import { useTableFilters } from '@/hooks/useTableFilters';

import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import NoDataFound from '@/components/NoDataFound';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { user$ } from '@/store/userStore';
import { format } from 'date-fns';
import { Role } from '@/enums/role';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getCompanyProductStatusOptions } from '@/utils/statusOptions';
import { useNavigate } from 'react-router-dom';

type CompanyProductStatus = 'ACTIVE' | 'PASSIVE' | 'PENDING' | 'DELETED';

interface ProductsTableProps {
  products: CompanyProduct[];
  loading: boolean;
  totalCount: number;
  setShowNewProductDialog?: (show: boolean) => void;
  onDeleteProduct?: (productId: number) => void;
  onBulkDeleteProducts?: (
    products: CompanyProduct[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    products: CompanyProduct[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateProduct?: (
    productId: number,
    updates: {
      status?: CompanyProductStatus;
      basePrice?: number;
      name?: string;
      description?: string;
      categoryId?: number;
      imageFile?: File;
      isMenu?: boolean;
      allowNegativeStock?: boolean;
      isStockTracked?: boolean;
      trackExpiry?: boolean;
      stockUnit?: string;
      companyId: number;
    }
  ) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  customActions?: (product: CompanyProduct) => React.ReactNode | null;
  tableTitle?: string;
  hideAddButton?: boolean;
  addButtonText?: string;
  customButtons?: any[];
  notApplyPadding?: boolean;
  hideDeleteButton?: boolean;
  rowsPerPageOptions?: number[];
  limit?: number;
  hideColumns?: string[];
  onSelectedProductsChange?: (products: CompanyProduct[]) => void;
  pageKey?: string;
}

const ProductsTable = ({
  products,
  loading,
  totalCount,
  onFilterChange,
  setShowNewProductDialog,
  onDeleteProduct,
  onBulkDeleteProducts,
  onBulkUpdateStatus,
  onUpdateProduct,
  customActions,
  tableTitle,
  hideAddButton = false,
  addButtonText,
  customButtons = [],
  notApplyPadding = false,
  hideDeleteButton = false,
  rowsPerPageOptions = [10, 30, 50, 100],
  limit: initialLimit,
  hideColumns = [],
  onSelectedProductsChange,
  pageKey
}: ProductsTableProps) => {
  const [selectedProducts, setSelectedProducts] = useState<CompanyProduct[]>(
    []
  );
  const selectedBulkActions = selectedProducts.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(initialLimit || 10);
  const globalUserState = user$.get();
  const userRole = globalUserState.role;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CompanyProduct | null>(
    null
  );
  const [editError, setEditError] = useState<string | undefined>(undefined);
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedProducts, setStatusUpdateSelectedProducts] =
    useState<CompanyProduct[]>([]);

  const isSuperAdmin = userRole === Role.SUPER_ADMIN;
  const currentBranch = globalUserState.currentBranch;
  const isAdminView = !currentBranch;
  const showLocationColumn = isSuperAdmin && isAdminView;

  useEffect(() => {
    if (onSelectedProductsChange) {
      onSelectedProductsChange(selectedProducts);
    }
  }, [selectedProducts, onSelectedProductsChange]);

  // State for price range filter
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const {
    filters,
    handleSearch: debouncedSearch,
    handleStatusChange,
    handleCategoryChange,
    handleCompanyChange,
    handleDateRangeChange: handleDateChange,
    handleProductTypeChange,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      limit,
      page
    },
    onFilterChange,
    pageKey
  });

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
      label: t('name'),
      align: 'left'
    },
    {
      id: 'type',
      label: t('type'),
      align: 'center'
    },
    {
      id: 'category',
      label: t('category'),
      align: 'left'
    },
    {
      id: 'price',
      label: t('price'),
      align: 'left'
    },
    ...(showLocationColumn
      ? [
          {
            id: 'location',
            label: t('location'),
            align: 'left'
          }
        ]
      : []),
    {
      id: 'status',
      label: t('status'),
      align: 'center'
    },
    {
      id: 'createdAt',
      label: t('created.at'),
      align: 'left'
    },
    {
      id: 'updatedAt',
      label: t('updated.at'),
      align: 'left'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
  ].filter((header) => !hideColumns.includes(header.id));

  const handleSelectAllProducts = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    setSelectedProducts(event.target.checked ? products : []);
  };

  const handleSelectOneProduct = (
    event: ChangeEvent<HTMLInputElement> | null,
    productId: number
  ): void => {
    if (event) {
      event.stopPropagation();
    }

    const product = products.find((u) => u.id === productId);
    if (!product) return;

    if (!selectedProducts.find((u) => u.id === productId)) {
      setSelectedProducts((prevSelected) => [...prevSelected, product]);
    } else {
      setSelectedProducts((prevSelected) =>
        prevSelected.filter((u) => u.id !== productId)
      );
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setPage(newPage);
    onFilterChange({
      ...filters,
      page: newPage,
      limit
    });
  };

  const handleLimitChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const newLimit = parseInt(event.target.value);
    setLimit(newLimit);
    setPage(0);
    onFilterChange({
      ...filters,
      page: 0,
      limit: newLimit
    });
  };

  const selectedSomeProducts =
    selectedProducts.length > 0 && selectedProducts.length < products.length;
  const selectedAllProducts = selectedProducts.length === products.length;
  const theme = useTheme();

  const handleBulkDelete = async (products: CompanyProduct[]) => {
    return onBulkDeleteProducts?.(products, () => {
      setSelectedProducts([]);
    });
  };

  const handleBulkStatusUpdate = (products: CompanyProduct[]) => {
    setStatusUpdateSelectedProducts(products);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedProducts.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedProducts, status, () => {
        setSelectedProducts([]);
        setStatusUpdateSelectedProducts([]);
      });
    }
  };

  const handleSearch = debounce((value: string) => {
    debouncedSearch(value);
  }, 500);

  const handleEditClick = (product: CompanyProduct) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleViewDetails = (product: CompanyProduct) => {
    navigate(`/management/company-products/${product.id}`);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedProduct(null);
    setEditError(undefined);
  };

  const handleSave = async (productData: {
    name: string;
    description: string;
    basePrice: string;
    costPrice?: string;
    pointValue?: number;
    categoryId?: number;
    imageFile?: File;
    status: CompanyProductStatus;
    isMenu: boolean;
    companyId: number;
    allowNegativeStock: boolean;
    isStockTracked: boolean;
    trackExpiry: boolean;
    stockUnit: string;
  }) => {
    if (!selectedProduct) return;

    try {
      const updatesToSave = {
        name: productData.name,
        description: productData.description,
        basePrice: parseFloat(productData.basePrice) || 0,
        costPrice: productData.costPrice
          ? parseFloat(productData.costPrice)
          : undefined,
        pointValue: productData.pointValue,
        categoryId: productData.categoryId,
        status: productData.status,
        isMenu: productData.isMenu,
        companyId: productData.companyId,
        allowNegativeStock: productData.allowNegativeStock,
        isStockTracked: productData.isStockTracked,
        trackExpiry: productData.trackExpiry,
        stockUnit: productData.stockUnit,
        ...(productData.imageFile && { imageFile: productData.imageFile })
      };

      await onUpdateProduct?.(selectedProduct.id, updatesToSave);
      handleDialogClose();
    } catch (error) {
      console.error('Error updating product: ', error);
      setEditError(t('products.update.error.message'));
    }
  };

  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const handleImageClick = (imageUrl: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewModalOpen(true);
    }
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  const deleteButton = hideDeleteButton
    ? null
    : {
        label: 'delete',
        icon: <DeleteTwoTone />,
        color: 'error',
        onClick: handleBulkDelete,
        showCondition: true,
        disabled: selectedProducts.length === 0,
        position: 'left',
        showConfirmDialog: true,
        confirmTitle: t('confirm.bulk.delete'),
        confirmMessage: t('confirm.bulk.delete.question'),
        variant: 'contained'
      };

  const statusUpdateButton = onBulkUpdateStatus
    ? {
        label: 'change.status',
        icon: <EditTwoToneIcon />,
        color: 'primary',
        onClick: handleBulkStatusUpdate,
        showCondition: true,
        disabled: selectedProducts.length === 0,
        position: 'left',
        variant: 'contained'
      }
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : []),
    ...customButtons
  ];

  const handleDateRangeChange = (dateRange: DateRange | null): void => {
    if (dateRange === null) {
      handleDateChange(undefined, undefined);
      return;
    }

    const timezone =
      user$.currentBranch.get()?.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    handleDateChange(
      format(dateRange.startDate, 'yyyy-MM-dd'),
      format(dateRange.endDate, 'yyyy-MM-dd'),
      timezone
    );
  };

  // Filter options for the popover
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
    {
      id: 'date',
      label: t('filters.date.range'),
      component: (
        <DateFilterBar
          onChange={handleDateRangeChange}
          filterLabel={t('filters.date.range')}
          compact
          showClearButton
          noFilterLabel={t('filters.date.all')}
          initialDateRange={
            filters.startDate && filters.endDate
              ? {
                  startDate: new Date(filters.startDate),
                  endDate: new Date(filters.endDate)
                }
              : undefined
          }
        />
      )
    },
    {
      id: 'type',
      label: t('filters.product.type'),
      component: (
        <ProductTypeFilter
          value={filters.type}
          onChange={handleProductTypeChange}
          size="small"
        />
      )
    },
    {
      id: 'category',
      label: t('filters.category'),
      component: (
        <CategoryFilter
          value={filters.categoryId}
          onChange={handleCategoryChange}
          size="small"
        />
      )
    },
    {
      id: 'location',
      label: t('filters.location'),
      component: (
        <LocationFilter
          companyId={filters.companyId}
          onBranchChange={() => {}}
          onCompanyChange={handleCompanyChange}
          size="small"
          hideBranchFilter={true}
        />
      )
    },
    {
      id: 'price',
      label: t('filters.price'),
      component: (
        <PriceRangeFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          size="small"
        />
      )
    }
  ];

  const handleApplyWithPrice = () => {
    // Update price filter before applying
    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;
    // Apply all filters including price
    onFilterChange({
      ...filters,
      price: { min, max },
      page: 0
    });
  };

  const handleResetAll = () => {
    // Reset price inputs
    setMinPrice('');
    setMaxPrice('');
    // Reset all filters
    handleResetFilters();
  };

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        maxWidth: notApplyPadding ? '100%' : '90%',
        p: notApplyPadding ? 0 : undefined
      }}
    >
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
              <Box flex={1} p={2} className="product-bulk-actions">
                <BulkActions<CompanyProduct>
                  selected={selectedProducts}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                action={
                  <Box
                    display="flex"
                    alignItems="center"
                    width="100%"
                    className="product-filters"
                  >
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
                      onApplyFilters={handleApplyWithPrice}
                      onResetFilters={handleResetAll}
                      activeFiltersCount={getActiveFiltersCount()}
                    />

                    {!hideAddButton && (
                      <Button
                        sx={{ ml: 2 }}
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setShowNewProductDialog?.(true)}
                        className="product-add-button"
                      >
                        {addButtonText || t('new.product')}
                      </Button>
                    )}
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {tableTitle || t('product.list')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={() => {
                          onFilterChange({
                            ...filters,
                            page,
                            limit
                          });
                        }}
                        sx={{
                          ml: 1,
                          '&:hover': {
                            background: theme.colors.primary.lighter
                          },
                          color: theme.palette.primary.main
                        }}
                        className="product-refresh"
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
                        (u) => u.id === product.id
                      );
                      return (
                        <TableRow
                          hover
                          key={product.id}
                          selected={isProductSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isProductSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneProduct(event, product.id)}
                              value={isProductSelected}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ mx: 0, px: 0 }}
                            className="product-image"
                          >
                            {product.file?.url ? (
                              <CustomImageComponent
                                imageUrl={product.file.url}
                                alt={product.name}
                                onClick={handleImageClick}
                                width={54}
                                height={54}
                              />
                            ) : (
                              <Tooltip title={t('edit.product')} arrow>
                                <Box onClick={() => handleEditClick(product)}>
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
                              {product.name}
                            </Typography>
                          </TableCell>

                          {!hideColumns.includes('type') && (
                            <TableCell align="center">
                              <ProductTypeLabel isMenu={product.isMenu} />
                            </TableCell>
                          )}

                          {!hideColumns.includes('category') && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {product.category?.name || '-'}
                              </Typography>
                            </TableCell>
                          )}

                          {!hideColumns.includes('price') && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {product.basePrice
                                  ? `${product.basePrice} TL`
                                  : '-'}
                              </Typography>
                            </TableCell>
                          )}

                          {showLocationColumn && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {product.company?.name || '-'}
                              </Typography>
                            </TableCell>
                          )}

                          {!hideColumns.includes('status') && (
                            <TableCell align="center">
                              <StatusLabel status={product?.status} />
                            </TableCell>
                          )}

                          {!hideColumns.includes('createdAt') && (
                            <TableCell>
                              {formatDateToDayMonthYearTime(product?.createdAt)}
                            </TableCell>
                          )}

                          {!hideColumns.includes('updatedAt') && (
                            <TableCell>
                              {formatDateToDayMonthYearTime(product?.updatedAt)}
                            </TableCell>
                          )}

                          {!hideColumns.includes('actions') && (
                            <TableCell
                              align="center"
                              className="product-actions"
                            >
                              {customActions ? (
                                customActions(product)
                              ) : (
                                <>
                                  <Tooltip title={t('view.details')} arrow>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(product);
                                      }}
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
                                  <Tooltip title={t('edit.product')} arrow>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(product);
                                      }}
                                      sx={{
                                        '&:hover': {
                                          background:
                                            theme.colors.primary.lighter
                                        },
                                        color: theme.palette.primary.main
                                      }}
                                      color="inherit"
                                      size="small"
                                    >
                                      <EditTwoToneIcon
                                        sx={{
                                          color: (theme) =>
                                            theme.palette.primary.main,
                                          fontSize: 20,
                                          '&:hover': {
                                            transform: 'scale(1.1)',
                                            transition: 'transform 0.2s'
                                          }
                                        }}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={t('delete.product')} arrow>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteProduct?.(product.id);
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
                                </>
                              )}
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
                page={totalCount ? page : 0}
                rowsPerPage={limit}
                rowsPerPageOptions={rowsPerPageOptions}
                className="product-pagination"
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
      <ImagePreviewModal
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        imageUrl={previewImageUrl}
        alt={selectedProduct?.name || 'Product image'}
      />

      <CompanyProductDialog
        open={editDialogOpen}
        onClose={handleDialogClose}
        onSave={handleSave}
        product={selectedProduct}
        error={editError}
      />
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedProducts([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedProducts}
        statusOptions={getCompanyProductStatusOptions()}
        title={t('bulk.status.update.products.title')}
        description={t('bulk.status.update.products.description')}
        itemDisplayProperty="name"
        currentStatusProperty="status"
      />
    </Container>
  );
};

export default ProductsTable;
