import React, { ChangeEvent, useMemo, useState, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import {
  Box,
  Card,
  CardHeader,
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
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  FormControl,
  Chip,
  Divider,
  Button,
  Container
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  SearchOutlined,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTranslation } from 'react-i18next';
import { debounce, prepareStockUnitLabel } from '@/utils/helpers';
import { Filters } from '@/types/Filters';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { BranchStock, StockUnit } from '@/types/stock';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { useTableFilters } from '@/hooks/useTableFilters';
import LocationFilter from '@/components/filters/LocationFilter';
import CategoryFilter from '@/components/filters/CategoryFilter';
import WarehouseFilter from '@/components/filters/WarehouseFilter';
import LowStockFilter from '@/components/filters/LowStockFilter';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import BatchDetailsTable from './BatchDetailsTable';

interface StockGroup {
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  categoryName?: string;
  branchName?: string;
  companyName?: string;
  totalQuantity: number;
  unit: StockUnit;
  batches: BranchStock[];
}

interface StockTableProps {
  stocks: BranchStock[];
  loading: boolean;
  totalCount: number;
  isConnected?: boolean;
  onFilterChange: (filters: Filters) => void;
  onInitializeStock: () => void;
  onAddStock: (stock: BranchStock) => void;
  onDeductStock: (stock: BranchStock) => void;
  onAdjustStock: (stock: BranchStock) => void;
  onTransferStock: (stock: BranchStock) => void;
  onBatchStatus: (stock: BranchStock) => void;
  onViewHistory: (stock: BranchStock) => void;
  onRefreshData: () => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const StockTableCollapsible = ({
  stocks = [],
  loading,
  isConnected = false,
  onFilterChange,
  onInitializeStock,
  onAddStock,
  onDeductStock,
  onAdjustStock,
  onTransferStock,
  onBatchStatus,
  onViewHistory,
  onRefreshData,
  rowsPerPageOptions = [10, 25, 50, 100],
  pageKey
}: StockTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);
  const { isBranchAdmin, isSuperAdmin, isCompanyAdmin, isAdminView } =
    useUserViewMode();

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {}
  );

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleBranchChange: handleBranchFilterChange,
    handleCompanyChange,
    handleCategoryChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      search: '',
      limit: 25,
      page: 0,
      branchId: undefined,
      warehouseId: undefined,
      categoryId: undefined,
      lowStockOnly: false
    },
    onFilterChange,
    pageKey
  });

  // Group stocks by product + warehouse
  const groupedStocks = useMemo((): StockGroup[] => {
    const groups: { [key: string]: StockGroup } = {};

    stocks.forEach((stock) => {
      const key = `${stock.companyProductId}-${stock.warehouseId}`;

      if (!groups[key]) {
        groups[key] = {
          productId: stock.companyProductId,
          productName: stock.companyProduct.name,
          warehouseId: stock.warehouseId,
          warehouseName: stock.warehouse.name,
          warehouseCode: stock.warehouse.code,
          categoryName: stock.companyProduct.category?.name,
          branchName: stock.branch?.name,
          companyName: stock.branch?.company?.name,
          totalQuantity: 0,
          unit: stock.companyProduct.stockUnit,
          batches: []
        };
      }

      groups[key].batches.push(stock);
      groups[key].totalQuantity += stock.quantity;
    });

    return Object.values(groups);
  }, [stocks]);

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

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleWarehouseChange = (warehouseId: number | null) => {
    setFilters((prev) => ({
      ...prev,
      warehouseId: warehouseId || undefined
    }));
  };

  const handleLowStockToggle = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      lowStockOnly: checked
    }));
  };

  const toggleRowExpansion = (key: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getStockStatusColor = (
    quantity: number,
    minThreshold?: number
  ): string => {
    if (quantity <= 0) return theme.palette.error.main;
    if (minThreshold && quantity <= minThreshold) {
      return theme.palette.warning.main;
    }
    return theme.palette.success.main;
  };

  const getStockStatusIcon = (quantity: number, minThreshold?: number) => {
    if (quantity <= 0) {
      return <ErrorIcon fontSize="small" />;
    }
    if (minThreshold && quantity <= minThreshold) {
      return <WarningIcon fontSize="small" />;
    }
    return <CheckCircleIcon fontSize="small" />;
  };

  const getStockStatusLabel = (
    quantity: number,
    minThreshold?: number
  ): string => {
    if (quantity <= 0) return t('stock.status.out');
    if (minThreshold && quantity <= minThreshold) {
      return t('stock.status.low');
    }
    return t('stock.status.normal');
  };

  const formatStockUnit = (unit: StockUnit): string => {
    return t(prepareStockUnitLabel(unit));
  };

  const tableHeaders = [
    {
      id: 'expand',
      label: '',
      align: 'center',
      width: '40px'
    },
    {
      id: 'product',
      label: t('stock.table.product'),
      align: 'left'
    },
    ...(!isBranchAdmin && isAdminView
      ? [
          {
            id: 'location',
            label: t('location'),
            align: 'left'
          }
        ]
      : []),
    {
      id: 'warehouse',
      label: t('stock.table.warehouse'),
      align: 'center'
    },
    {
      id: 'stock',
      label: t('stock.table.stock'),
      align: 'center'
    },
    {
      id: 'threshold',
      label: t('stock.table.threshold'),
      align: 'center'
    },
    {
      id: 'lastRestock',
      label: t('stock.table.last.restock'),
      align: 'center'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
  ];

  // FilterPopover options
  const filterOptions: FilterOption[] = [];

  if (isAdminView) {
    filterOptions.push({
      id: 'location',
      label: t('location'),
      component: (
        <LocationFilter
          companyId={filters.companyId}
          branchId={filters.branchId}
          onCompanyChange={handleCompanyChange}
          onBranchChange={handleBranchFilterChange}
        />
      )
    });
  }

  filterOptions.push({
    id: 'warehouse',
    label: t('warehouse'),
    component: (
      <WarehouseFilter
        value={filters.warehouseId}
        onChange={(warehouseId) => handleWarehouseChange(warehouseId || null)}
        branchId={filters.branchId}
        size="small"
      />
    )
  });

  filterOptions.push({
    id: 'category',
    label: t('category'),
    component: (
      <CategoryFilter
        value={filters.categoryId}
        onChange={handleCategoryChange}
        size="small"
      />
    )
  });

  filterOptions.push({
    id: 'lowStock',
    label: '',
    component: (
      <LowStockFilter
        value={filters.lowStockOnly || false}
        onChange={handleLowStockToggle}
      />
    )
  });

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        maxWidth: '90%'
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
            <CardHeader
              action={
                <Box display="flex" alignItems="center" width="100%">
                  <FormControl sx={{ minWidth: 200, mr: 2 }}>
                    <OutlinedInput
                      placeholder={`${t('search.products')}...`}
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

                  <Can I="create" a="Stock" ability={ability}>
                    <Button
                      variant="contained"
                      startIcon={<InventoryIcon />}
                      onClick={onInitializeStock}
                      sx={{ ml: 2 }}
                    >
                      {t('stock.initialize')}
                    </Button>
                  </Can>
                </Box>
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {t('stock.list')}
                  </Typography>
                  <Tooltip arrow title={t('refresh.list')}>
                    <IconButton
                      onClick={onRefreshData}
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
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header) => (
                      <TableCell
                        key={header.id}
                        align={header.align as 'left' | 'center' | 'right'}
                        sx={{
                          width: header.width,
                          fontWeight: 600
                        }}
                      >
                        {header.label}
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
                  ) : groupedStocks.length > 0 ? (
                    groupedStocks.map((group, index) => {
                      const groupKey = `${group.productId}-${group.warehouseId}`;
                      const isExpanded = expandedRows[groupKey];
                      const isLowStock = group.batches.some(
                        (b) => b.minThreshold && b.quantity <= b.minThreshold
                      );
                      const isOutOfStock = group.totalQuantity <= 0;

                      return (
                        <React.Fragment key={`group-${groupKey}-${index}`}>
                          {/* Parent Row */}
                          <TableRow
                            hover
                            onClick={() => toggleRowExpansion(groupKey)}
                            sx={{
                              backgroundColor: isOutOfStock
                                ? `${theme.palette.error.main}08`
                                : isLowStock
                                  ? `${theme.palette.warning.main}08`
                                  : 'transparent',
                              '&:hover': {
                                backgroundColor: isOutOfStock
                                  ? `${theme.palette.error.main}12`
                                  : isLowStock
                                    ? `${theme.palette.warning.main}12`
                                    : theme.palette.action.hover
                              },
                              cursor: 'pointer'
                            }}
                          >
                            <TableCell align="center">
                              <Tooltip
                                arrow
                                title={isExpanded ? t('collapse') : t('expand')}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpansion(groupKey);
                                  }}
                                >
                                  {isExpanded ? (
                                    <KeyboardArrowUpIcon fontSize="small" />
                                  ) : (
                                    <KeyboardArrowDownIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" fontWeight="bold">
                                {group.productName}
                              </Typography>
                              {group.categoryName && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {group.categoryName}
                                </Typography>
                              )}
                            </TableCell>
                            {(isSuperAdmin || isCompanyAdmin) && (
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  gutterBottom
                                  noWrap
                                >
                                  {group.branchName || '-'}
                                </Typography>
                                {isSuperAdmin && group.companyName && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    noWrap
                                  >
                                    {group.companyName}
                                  </Typography>
                                )}
                              </TableCell>
                            )}
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="medium">
                                {group.warehouseName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {group.warehouseCode}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                gap={0.5}
                                flexDirection="column"
                              >
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  gap={0.5}
                                >
                                  <Tooltip
                                    arrow
                                    title={getStockStatusLabel(
                                      group.totalQuantity,
                                      group.batches[0]?.minThreshold
                                    )}
                                    placement="top"
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: getStockStatusColor(
                                          group.totalQuantity,
                                          group.batches[0]?.minThreshold
                                        )
                                      }}
                                    >
                                      {getStockStatusIcon(
                                        group.totalQuantity,
                                        group.batches[0]?.minThreshold
                                      )}
                                    </Box>
                                  </Tooltip>
                                  <Typography variant="body2" fontWeight="bold">
                                    {group.totalQuantity}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {formatStockUnit(group.unit)}
                                  </Typography>
                                </Box>
                                {group.batches[0]?.companyProduct
                                  ?.trackExpiry && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {group.batches.length}{' '}
                                    {group.batches.length > 1
                                      ? t('stock.table.batches')
                                      : t('stock.table.batch')}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {group.batches[0]?.minThreshold
                                  ? `Min: ${group.batches[0].minThreshold}`
                                  : '-'}
                              </Typography>
                              {group.batches[0]?.maxThreshold && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Max: {group.batches[0].maxThreshold}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {(() => {
                                  const latestRestock = group.batches
                                    .filter((b) => b.lastRestockDate)
                                    .sort(
                                      (a, b) =>
                                        new Date(b.lastRestockDate!).getTime() -
                                        new Date(a.lastRestockDate!).getTime()
                                    )[0];
                                  return latestRestock?.lastRestockDate
                                    ? formatDateToDayMonthYearTime(
                                        new Date(latestRestock.lastRestockDate)
                                      )
                                    : '-';
                                })()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                display="flex"
                                gap={0.5}
                                justifyContent="center"
                              >
                                <Can I="create" a="Stock" ability={ability}>
                                  <Tooltip arrow title={t('stock.action.add')}>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddStock({
                                          ...group.batches[0],
                                          batchId: null,
                                          batch: undefined,
                                          totalQuantity: group.totalQuantity
                                        });
                                      }}
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Can>
                                <Tooltip
                                  arrow
                                  title={t('stock.action.history')}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewHistory({
                                        ...group.batches[0],
                                        batchId: null,
                                        batch: undefined,
                                        totalQuantity: group.totalQuantity
                                      });
                                    }}
                                  >
                                    <HistoryIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Batch Details Table */}
                          <BatchDetailsTable
                            batches={group.batches}
                            isExpanded={isExpanded}
                            unit={group.unit}
                            parentColSpan={tableHeaders.length}
                            onAddStock={onAddStock}
                            onDeductStock={onDeductStock}
                            onAdjustStock={onAdjustStock}
                            onTransferStock={onTransferStock}
                            onBatchStatus={onBatchStatus}
                          />
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('stock.not.found')}
                      colSpan={tableHeaders.length}
                    />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              p={2}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Chip
                label={
                  isConnected
                    ? t('stock.realtime.active')
                    : t('stock.realtime.inactive')
                }
                color={isConnected ? 'success' : 'default'}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
              <TablePagination
                component="div"
                count={groupedStocks.length || 0}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={filters.page || 0}
                rowsPerPage={filters.limit || 25}
                rowsPerPageOptions={rowsPerPageOptions}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StockTableCollapsible;
