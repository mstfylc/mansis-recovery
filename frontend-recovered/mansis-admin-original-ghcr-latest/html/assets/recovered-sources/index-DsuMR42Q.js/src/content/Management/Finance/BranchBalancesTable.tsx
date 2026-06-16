import React, { ChangeEvent } from 'react';
import {
  Box,
  Card,
  CardHeader,
  FormControl,
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
  Stack
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { user$ } from '@/store/userStore';
import {
  SearchOutlined,
  Visibility as VisibilityIcon,
  Tune as TuneIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import NoDataFound from '@/components/NoDataFound';
import { formatCurrency } from '@/utils/formatters';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { debounce } from '@/utils/helpers';
import { useTableFilters } from '@/hooks/useTableFilters';
import { Filters } from '@/types/Filters';

interface BranchBalance {
  branchId: number;
  branchName: string;
  companyId: number;
  currentBalance: number;
  lastTransactionDate: string | null;
}

interface BranchBalancesTableProps {
  branches: BranchBalance[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
  onViewDetails: (branchId: number, branchName: string) => void;
  onSetLimit: (branchId: number) => void;
  onAddAdjustment: (branchId: number, branchName: string) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const BranchBalancesTable: React.FC<BranchBalancesTableProps> = ({
  branches,
  loading,
  totalCount,
  onFilterChange,
  onViewDetails,
  onSetLimit,
  onAddAdjustment,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = user$.get();

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter
  } = useTableFilters({
    initialFilters: {
      search: '',
      limit: 10,
      page: 0
    },
    onFilterChange,
    pageKey
  });

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    onFilterChange({ ...filters, page: newPage });
  };

  const handleChangeRowsPerPage = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const newLimit = parseInt(event.target.value, 10);
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 0 }));
    onFilterChange({ ...filters, limit: newLimit, page: 0 });
  };

  const tableHeaders = [
    {
      id: 'branchName',
      label: t('finance.accounting.branch.name'),
      align: 'left'
    },
    {
      id: 'currentBalance',
      label: t('finance.accounting.current.balance'),
      align: 'center'
    },
    {
      id: 'lastTransaction',
      label: t('finance.accounting.last.transaction'),
      align: 'center'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
  ];

  return (
    <Card>
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
          </Box>
        }
        title={
          <Box display="flex" alignItems="center">
            <Typography variant="h4" component="span">
              {t('finance.accounting.branch.balances')}
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
            ) : branches.length > 0 ? (
              branches.map((branch) => (
                <TableRow hover key={branch.branchId}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {branch.branchName}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        branch.currentBalance >= 0
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {formatCurrency(branch.currentBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="textSecondary">
                      {branch.lastTransactionDate
                        ? formatDateToDayMonthYearTime(
                            branch.lastTransactionDate
                          )
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip
                        title={t('finance.accounting.view.transactions')}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            onViewDetails(branch.branchId, branch.branchName)
                          }
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(user?.role === 'COMPANY_ADMIN' ||
                        user?.role === 'SUPER_ADMIN') && (
                        <>
                          <Tooltip
                            title={t('finance.accounting.manual.adjustment')}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                onAddAdjustment(
                                  branch.branchId,
                                  branch.branchName
                                )
                              }
                              color="success"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('finance.accounting.set.limit')}>
                            <IconButton
                              size="small"
                              onClick={() => onSetLimit(branch.branchId)}
                              color="secondary"
                            >
                              <TuneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableHeaders.length}>
                  <NoDataFound message={t('finance.accounting.no.branches')} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={totalCount}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          page={filters.page || 0}
          rowsPerPage={filters.limit || 10}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage={t('rows.per.page')}
        />
      </Box>
    </Card>
  );
};

export default BranchBalancesTable;
