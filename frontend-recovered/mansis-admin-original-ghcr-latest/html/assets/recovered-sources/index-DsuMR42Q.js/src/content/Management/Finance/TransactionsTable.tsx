import { ChangeEvent, useContext } from 'react';
import { user$ } from '@/store/userStore';
import {
  Box,
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  FormControl,
  useTheme
} from '@mui/material';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import {
  formatDateToDayMonthYearTime,
  formatDateForApi
} from '@/utils/dateFormatters';
import {
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTranslation } from 'react-i18next';
import NoDataFound from '@/components/NoDataFound';
import { debounce } from '@/utils/helpers';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import TransactionTypeFilter from '@/components/filters/TransactionTypeFilter';
import DateFilterBar from '@/components/filters/DateFilterBar';
import { formatCurrency } from '@/utils/formatters';
import { useTableFilters } from '@/hooks/useTableFilters';
import { Filters } from '@/types/Filters';
import {
  TRANSACTION_TYPE,
  TransactionType
} from '@/types/AccountingLedger.interface';

interface TransactionEntry {
  id: number;
  transactionType: TransactionType;
  amount: string;
  balance: string;
  source: string;
  sourceId: number | null;
  description: string | null;
  createdAt: string;
  createdBy?: {
    name: string;
    surname: string;
    email: string;
  } | null;
}

interface TransactionsTableProps {
  entries: TransactionEntry[];
  loading: boolean;
  totalCount: number;
  currentBalance: number;
  onFilterChange: (filters: Filters) => void;
  onViewDetails?: (entry: TransactionEntry) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
  showViewAction?: boolean;
}

const TransactionsTable = ({
  entries,
  loading,
  totalCount,
  currentBalance,
  onFilterChange,
  onViewDetails,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey = 'transactions',
  showViewAction = false
}: TransactionsTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleDateRangeChange,
    handleTransactionTypeChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      search: '',
      limit: 10,
      page: 0,
      transactionType: undefined,
      startDate: undefined,
      endDate: undefined
    },
    onFilterChange,
    pageKey
  });

  const handlePageChange = (_event: any, newPage: number): void => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    onFilterChange({ ...filters, page: newPage });
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newLimit = Number.parseInt(event.target.value, 10);
    setFilters((prev) => ({
      ...prev,
      limit: newLimit,
      page: 0
    }));
    onFilterChange({ ...filters, limit: newLimit, page: 0 });
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TRANSACTION_TYPE.REVENUE:
        return t('finance.accounting.type.revenue');
      case TRANSACTION_TYPE.WITHDRAWAL:
        return t('finance.accounting.type.withdrawal');
      case TRANSACTION_TYPE.MANUAL_ADJUSTMENT:
        return t('finance.accounting.type.manual');
      case TRANSACTION_TYPE.REFUND:
        return t('finance.accounting.type.refund');
      default:
        return type;
    }
  };

  const getSourceLabel = (source: string) => {
    const sourceMap: Record<string, string> = {
      ORDER: t('finance.accounting.source.order'),
      ORDER_REFUND: t('finance.accounting.source.order_refund'),
      TICKET: t('finance.accounting.source.ticket'),
      TICKET_REFUND: t('finance.accounting.source.ticket_refund'),
      DAILY_LOGIN: t('finance.accounting.source.daily_login'),
      DAILY_LOGIN_REFUND: t('finance.accounting.source.daily_login_refund'),
      MEMBERSHIP: t('finance.accounting.source.membership'),
      MEMBERSHIP_REFUND: t('finance.accounting.source.membership_refund'),
      WITHDRAWAL_PAYMENT: t('finance.accounting.source.withdrawal_payment'),
      MIGRATION: t('finance.accounting.source.migration'),
      MANUAL: t('finance.accounting.source.manual')
    };
    return sourceMap[source] || source;
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case TRANSACTION_TYPE.REVENUE:
        return 'success';
      case TRANSACTION_TYPE.WITHDRAWAL:
        return 'warning';
      case TRANSACTION_TYPE.MANUAL_ADJUSTMENT:
        return 'info';
      case TRANSACTION_TYPE.REFUND:
        return 'error';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount: string, type: TransactionType) => {
    const numAmount = Number.parseFloat(amount);

    // MANUAL_ADJUSTMENT için amount'un kendi işaretine bak
    // Diğerleri için transaction type'a göre belirle
    let isNegative: boolean;
    if (type === TRANSACTION_TYPE.MANUAL_ADJUSTMENT) {
      isNegative = numAmount < 0;
    } else {
      isNegative =
        type === TRANSACTION_TYPE.WITHDRAWAL ||
        type === TRANSACTION_TYPE.REFUND;
    }

    return (
      <Typography
        variant="body2"
        sx={{
          color: isNegative ? 'error.main' : 'success.main',
          fontWeight: 600
        }}
      >
        {isNegative ? '-' : '+'}
        {formatCurrency(Math.abs(numAmount))}
      </Typography>
    );
  };

  const tableHeaders = [
    {
      id: 'date',
      label: t('finance.accounting.date'),
      align: 'left'
    },
    {
      id: 'type',
      label: t('finance.accounting.type'),
      align: 'center'
    },
    {
      id: 'description',
      label: t('finance.accounting.description'),
      align: 'left'
    },
    {
      id: 'source',
      label: t('finance.accounting.source'),
      align: 'left'
    },
    {
      id: 'amount',
      label: t('finance.accounting.amount'),
      align: 'right'
    },
    {
      id: 'balance',
      label: t('finance.accounting.balance'),
      align: 'right'
    },
    {
      id: 'createdBy',
      label: t('finance.accounting.createdBy'),
      align: 'left'
    },
    ...(showViewAction
      ? [
          {
            id: 'actions',
            label: t('actions'),
            align: 'center'
          }
        ]
      : [])
  ];

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const filterOptions: FilterOption[] = [
    {
      id: 'transactionType',
      label: t('finance.accounting.filter.transaction.type'),
      component: (
        <TransactionTypeFilter
          value={filters.transactionType}
          onChange={handleTransactionTypeChange}
          size="small"
          minWidth={200}
        />
      )
    },
    {
      id: 'dateRange',
      label: t('filters.date.range'),
      component: (
        <DateFilterBar
          onChange={(dateRange) => {
            if (dateRange) {
              const timezone =
                user$.currentBranch.get()?.timezone ??
                Intl.DateTimeFormat().resolvedOptions().timeZone;
              handleDateRangeChange(
                formatDateForApi(dateRange.startDate),
                formatDateForApi(dateRange.endDate),
                timezone
              );
            } else {
              handleDateRangeChange(undefined, undefined);
            }
          }}
          filterLabel={t('filters.date.range')}
          compact
          showClearButton
          noFilterLabel={t('filters.date.all')}
          size="small"
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
    }
  ];

  return (
    <Card>
      <CardHeader
        action={
          <Box display="flex" alignItems="center">
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
          </Box>
        }
        title={
          <Box display="flex" alignItems="center">
            <Typography variant="h4" component="span">
              {t('finance.accounting.transactions')}
            </Typography>
            <Tooltip arrow title={t('refresh.list')}>
              <IconButton
                onClick={() => {
                  onFilterChange({ ...filters });
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
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {tableHeaders.map((header) => (
                <TableCell
                  key={header.id}
                  align={header.align as any}
                  sx={{ fontWeight: 'bold' }}
                >
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={tableHeaders.length} align="center">
                  <Box py={3}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.length === 0 && (
              <NoDataFound
                message={t('finance.accounting.no.transactions')}
                colSpan={tableHeaders.length}
              />
            )}
            {!loading &&
              entries.length > 0 &&
              entries.map((entry) => (
                <TableRow hover key={entry.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateToDayMonthYearTime(entry.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={getTransactionTypeLabel(entry.transactionType)}
                      color={
                        getTransactionTypeColor(entry.transactionType) as any
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {entry.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getSourceLabel(entry.source)}
                      {entry.sourceId && ` #${entry.sourceId}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatAmount(entry.amount, entry.transactionType)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(Number.parseFloat(entry.balance))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.createdBy ? (
                      <Tooltip
                        title={`${entry.createdBy.name} ${entry.createdBy.surname} (${entry.createdBy.email})`}
                        arrow
                      >
                        <Typography variant="body2" noWrap>
                          {entry.createdBy.name} {entry.createdBy.surname}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('common.system')}
                      </Typography>
                    )}
                  </TableCell>
                  {showViewAction && (
                    <TableCell align="center">
                      <Can I="read" a="Finance" ability={ability}>
                        <Tooltip title={t('view.details')} arrow>
                          <IconButton
                            size="small"
                            onClick={() => onViewDetails?.(entry)}
                            sx={{
                              '&:hover': {
                                background: theme.colors.info.lighter
                              },
                              color: theme.palette.info.main
                            }}
                            color="inherit"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Can>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        p={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t('finance.accounting.current.balance')}:{' '}
            <Typography
              component="span"
              variant="body2"
              fontWeight={600}
              color="primary"
            >
              {formatCurrency(currentBalance)}
            </Typography>
          </Typography>
        </Box>
        <TablePagination
          component="div"
          count={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={filters.page || 0}
          rowsPerPage={filters.limit || 10}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage={t('rows.per.page')}
          labelDisplayedRows={({ from, to, count }) => {
            const countText = count === -1 ? `${t('more.than')} ${to}` : count;
            return `${from}-${to} ${t('of')} ${countText}`;
          }}
        />
      </Box>
    </Card>
  );
};

export default TransactionsTable;
