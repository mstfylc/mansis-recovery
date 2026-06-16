import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Link as MuiLink,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import StyledDatePicker from '@/components/date&time/StyledDatePicker';
import MovementTypeFilter from './MovementTypeFilter';
import type {
  BranchStock,
  StockMovement,
  StockMovementType
} from '@/types/stock';
import {
  formatDateToDayMonthYearTime,
  formatDateToDayMonthYear
} from '@/utils/dateFormatters';
import { ChangeEvent, MouseEvent } from 'react';

interface StockHistoryTableProps {
  movements: StockMovement[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  stock: BranchStock | null;
  filters: {
    startDate: Date | null;
    endDate: Date | null;
    movementType: StockMovementType | '';
    userId?: number;
  };
  onFilterChange: (filters: {
    startDate?: Date | null;
    endDate?: Date | null;
    movementType?: StockMovementType | '';
    userId?: number;
  }) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const StockHistoryTable = ({
  movements,
  loading,
  total,
  page,
  limit,
  stock,
  filters,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onLimitChange
}: StockHistoryTableProps) => {
  const { t } = useTranslation();

  const getMovementTypeColor = (
    type: StockMovementType
  ): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (type) {
      case 'INBOUND':
      case 'TRANSFER_IN':
      case 'RETURN':
        return 'success';
      case 'OUTBOUND':
      case 'TRANSFER_OUT':
      case 'WASTE':
        return 'error';
      case 'ADJUSTMENT':
        return 'warning';
      case 'INITIAL':
        return 'info';
      default:
        return 'default';
    }
  };

  const getQuantityDisplay = (movement: StockMovement) => {
    // ADJUSTMENT için quantity'nin işaretine bak, diğerleri için hareket tipine göre
    const isPositive =
      movement.movementType === 'ADJUSTMENT'
        ? movement.quantity > 0
        : ['INBOUND', 'TRANSFER_IN', 'RETURN', 'INITIAL'].includes(
            movement.movementType
          );

    // Backend'den gelen quantity zaten negatif gelebilir (OUTBOUND için -1 gibi)
    // Sadece absolute değerini göster, prefix'i biz ekleyelim
    const absoluteQuantity = Math.abs(movement.quantity);
    const prefix = isPositive ? '+' : '-';
    const color = isPositive ? 'success.main' : 'error.main';

    return (
      <Typography
        variant="body2"
        fontWeight="bold"
        color={color}
        component="span"
      >
        {prefix}
        {absoluteQuantity}
      </Typography>
    );
  };

  const handlePageChange = (
    _event: MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    onPageChange(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onLimitChange(parseInt(event.target.value));
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.movementType) count++;
    if (filters.userId) count++;
    return count;
  };

  const handleApplyFilters = () => {
    // Filters are already applied through onFilterChange
  };

  const filterOptions: FilterOption[] = [
    {
      id: 'dateRange',
      label: t('stock.history.filter.title'),
      component: (
        <Box sx={{ px: 2, py: 1 }}>
          <StyledDatePicker
            label={t('stock.history.filter.date.start')}
            selected={filters.startDate}
            onChange={(date) => onFilterChange({ startDate: date })}
            maxDate={filters.endDate || new Date()}
          />
          <StyledDatePicker
            label={t('stock.history.filter.date.end')}
            selected={filters.endDate}
            onChange={(date) => onFilterChange({ endDate: date })}
            minDate={filters.startDate || undefined}
            maxDate={new Date()}
          />
        </Box>
      )
    },
    {
      id: 'movementType',
      label: t('stock.history.filter.movement.type'),
      component: (
        <MovementTypeFilter
          value={filters.movementType}
          onChange={(type) => onFilterChange({ movementType: type })}
        />
      )
    }
  ];

  const isBatchTracked = stock?.companyProduct?.trackExpiry ?? false;

  const tableHeaders = [
    { id: 'date', label: t('stock.history.table.date'), align: 'left' },
    { id: 'type', label: t('stock.history.table.type'), align: 'center' },
    {
      id: 'quantity',
      label: t('stock.history.table.quantity'),
      align: 'center'
    },
    { id: 'change', label: t('stock.history.table.change'), align: 'center' },
    { id: 'user', label: t('stock.history.table.user'), align: 'left' },
    {
      id: 'warehouse',
      label: t('stock.history.table.warehouse'),
      align: 'center'
    },
    { id: 'reason', label: t('stock.history.table.reason'), align: 'left' },
    ...(isBatchTracked
      ? [
          {
            id: 'batch',
            label: t('stock.history.table.batch'),
            align: 'center' as const
          }
        ]
      : []),
    {
      id: 'reference',
      label: t('stock.history.table.reference'),
      align: 'center'
    }
  ];

  return (
    <Card>
      <Box
        p={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h4">{t('stock.history.tab.table')}</Typography>
        <FilterPopover
          filterOptions={filterOptions}
          onApplyFilters={handleApplyFilters}
          onResetFilters={onResetFilters}
          activeFiltersCount={getActiveFiltersCount()}
        />
      </Box>
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
            ) : movements.length > 0 ? (
              movements.map((movement) => (
                <TableRow hover key={movement.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateToDayMonthYearTime(
                        new Date(movement.createdAt)
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={t(`movement.type.${movement.movementType}`)}
                      color={getMovementTypeColor(movement.movementType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {getQuantityDisplay(movement)}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      {stock &&
                        t(
                          `stock.unit.${stock.companyProduct.stockUnit.toLowerCase()}`
                        )}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {movement.previousQuantity} → {movement.newQuantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {movement.user
                        ? `${movement.user.name} ${movement.user.surname}`
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {movement.fromWarehouse && movement.toWarehouse ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {movement.fromWarehouse.name} →
                        </Typography>
                        <Typography variant="body2">
                          {movement.toWarehouse.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">
                        {movement.branchStock.companyProduct.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {movement.reason
                        ? t(
                            `movement.reason.${movement.reason}`,
                            movement.reason
                          )
                        : '-'}
                    </Typography>
                  </TableCell>
                  {isBatchTracked && (
                    <TableCell align="center">
                      {movement.batch ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {movement.batch.batchNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            SKT:{' '}
                            {formatDateToDayMonthYear(
                              new Date(movement.batch.expiryDate)
                            )}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell align="center">
                    {movement.referenceType === 'ORDER' &&
                    movement.referenceId ? (
                      <MuiLink
                        component={Link}
                        to={`/dashboards/orders/${movement.referenceId}`}
                        underline="hover"
                      >
                        <Typography variant="body2">
                          {t('reference.type.ORDER')} #{movement.referenceId}
                        </Typography>
                      </MuiLink>
                    ) : movement.referenceType ? (
                      <Typography variant="body2" color="text.secondary">
                        {t(`reference.type.${movement.referenceType}`)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('stock.history.manual.operation')}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <NoDataFound
                message={t('stock.history.empty')}
                colSpan={tableHeaders.length}
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={total}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Box>
    </Card>
  );
};

export default StockHistoryTable;
