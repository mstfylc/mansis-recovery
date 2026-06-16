import {
  FC,
  useState,
  useEffect,
  ChangeEvent,
  useCallback,
  useContext
} from 'react';
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
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  FormControl,
  Chip,
  Divider,
  Button
} from '@mui/material';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import {
  SearchOutlined,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTranslation } from 'react-i18next';
import { debounce, prepareStockUnitLabel } from '@/utils/helpers';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { BranchStock, StockUnit, StockLevel } from '@/types/stock';
import {
  getWarehouseStocks,
  exportWarehouseStocks
} from '@/data/warehouseService';
import CategoryFilter from '@/components/filters/CategoryFilter';
import StockLevelFilter from '@/components/filters/StockLevelFilter';
import { downloadFromUrl } from '@/utils/helpers';
import { useTableFilters } from '@/hooks/useTableFilters';
import { Filters } from '@/types/Filters';

interface WarehouseStocksTableProps {
  warehouseId: number;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const WarehouseStocksTable: FC<WarehouseStocksTableProps> = ({
  warehouseId,
  rowsPerPageOptions = [10, 25, 50, 100],
  pageKey
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const [stocks, setStocks] = useState<BranchStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const handleFilterChange = (filters: Filters) => {
    fetchStocks(filters);
  };

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleCategoryChange,
    handleStockLevelChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      search: '',
      page: 0,
      limit: 25,
      categoryId: undefined,
      stockLevel: StockLevel.ALL
    },
    onFilterChange: handleFilterChange,
    pageKey
  });

  const fetchStocks = useCallback(
    async (filtersToUse: Filters = filters) => {
      try {
        setLoading(true);

        const params: any = {
          page: filtersToUse.page,
          limit: filtersToUse.limit
        };

        if (filtersToUse.search) params.search = filtersToUse.search;
        if (filtersToUse.categoryId)
          params.categoryId = filtersToUse.categoryId;
        if (
          filtersToUse.stockLevel &&
          filtersToUse.stockLevel !== StockLevel.ALL
        )
          params.stockLevel = filtersToUse.stockLevel;

        const response = await getWarehouseStocks(warehouseId, params);

        setStocks(response.items || []);
        setTotalCount(response.total || 0);
      } catch (error) {
        console.error('Error fetching warehouse stocks:', error);
        setStocks([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warehouseId]
  );

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handlePageChange = (_event: unknown, newPage: number): void => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
    handleFilterChange({
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
    handleFilterChange({
      ...filters,
      limit: newLimit,
      page: 0
    });
  };

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleExportExcel = async () => {
    try {
      const params: {
        categoryId?: number;
        stockLevel?: StockLevel;
      } = {};

      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.stockLevel && filters.stockLevel !== StockLevel.ALL)
        params.stockLevel = filters.stockLevel as StockLevel;

      const { url, filename } = await exportWarehouseStocks(
        warehouseId,
        params
      );

      downloadFromUrl(url, filename);
    } catch (error) {
      console.error('Error exporting warehouse stocks:', error);
    }
  };

  const getStockStatusColor = (stock: BranchStock): string => {
    if (stock.quantity <= 0) return theme.palette.error.main;
    if (stock.minThreshold && stock.quantity <= stock.minThreshold) {
      return theme.palette.warning.main;
    }
    return theme.palette.success.main;
  };

  const getStockStatusIcon = (stock: BranchStock) => {
    if (stock.quantity <= 0) {
      return <ErrorIcon fontSize="small" />;
    }
    if (stock.minThreshold && stock.quantity <= stock.minThreshold) {
      return <WarningIcon fontSize="small" />;
    }
    return <CheckCircleIcon fontSize="small" />;
  };

  const getStockStatusLabel = (stock: BranchStock): string => {
    if (stock.quantity <= 0) return t('stock.status.out');
    if (stock.minThreshold && stock.quantity <= stock.minThreshold) {
      return t('stock.status.low');
    }
    return t('stock.status.normal');
  };

  const formatStockUnit = (unit: StockUnit): string => {
    return t(prepareStockUnitLabel(unit));
  };

  const tableHeaders = [
    {
      id: 'product',
      label: t('stock.table.product'),
      align: 'left'
    },
    {
      id: 'category',
      label: t('category'),
      align: 'left'
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
      id: 'status',
      label: t('status'),
      align: 'center'
    }
  ];

  // FilterPopover options
  const filterOptions: FilterOption[] = [
    {
      id: 'category',
      label: t('category'),
      component: (
        <CategoryFilter
          value={filters.categoryId}
          onChange={handleCategoryChange}
          size="small"
        />
      )
    },
    {
      id: 'stockLevel',
      label: t('warehouseDetails.stockLevel'),
      component: (
        <StockLevelFilter
          value={filters.stockLevel as StockLevel}
          onChange={(value) => handleStockLevelChange(value)}
          size="small"
        />
      )
    }
  ];

  return (
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

            <Can I="read" a="Warehouse" ability={ability}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportExcel}
                sx={{ ml: 'auto' }}
              >
                {t('export.excel')}
              </Button>
            </Can>
          </Box>
        }
        title={
          <Box display="flex" alignItems="center">
            <Typography variant="h4" component="span">
              {t('warehouseDetails.stocks')}
            </Typography>
            <Tooltip arrow title={t('refresh.list')}>
              <IconButton
                onClick={fetchStocks}
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
            ) : stocks.length > 0 ? (
              stocks.map((stock) => (
                <TableRow
                  hover
                  key={stock.id}
                  sx={{
                    backgroundColor:
                      stock.quantity <= 0
                        ? `${theme.palette.error.main}08`
                        : stock.minThreshold &&
                            stock.quantity <= stock.minThreshold
                          ? `${theme.palette.warning.main}08`
                          : 'transparent'
                  }}
                >
                  {/* Product */}
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {stock.companyProduct?.name || '-'}
                    </Typography>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Typography variant="body2">
                      {stock.companyProduct?.category?.name || '-'}
                    </Typography>
                  </TableCell>

                  {/* Stock */}
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight="bold">
                      {stock.quantity}{' '}
                      {formatStockUnit(stock.companyProduct.stockUnit)}
                    </Typography>
                  </TableCell>

                  {/* Threshold */}
                  <TableCell align="center">
                    <Typography variant="body2">
                      {stock.minThreshold || '-'} / {stock.maxThreshold || '-'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Min / Max
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell align="center">
                    <Chip
                      icon={getStockStatusIcon(stock)}
                      label={getStockStatusLabel(stock)}
                      size="small"
                      sx={{
                        backgroundColor: `${getStockStatusColor(stock)}15`,
                        color: getStockStatusColor(stock),
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <NoDataFound
                message={t('warehouseDetails.noStocksFound')}
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
  );
};

export default WarehouseStocksTable;
