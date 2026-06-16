import React, { ChangeEvent, useState, useContext } from 'react';
import { Can } from '@casl/react';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
import {
  Box,
  Card,
  CardHeader,
  Container,
  Checkbox,
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
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { DailyLogin } from '@/types/DailyLogin.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { SearchOutlined, MoneyOff } from '@mui/icons-material';
import { debounce, preparePurchaseTypeLabel } from '@/utils/helpers';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import NoDataFound from '@/components/NoDataFound';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { dailyLoginService } from '@/data/dailyLoginService';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';

interface DailyLoginsTableProps {
  dailyLogins: DailyLogin[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const DailyLoginsTable = ({
  dailyLogins,
  loading,
  totalCount,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: DailyLoginsTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);
  const [selectedDailyLogins, setSelectedDailyLogins] = useState<DailyLogin[]>(
    []
  );
  const selectedBulkActions = selectedDailyLogins.length > 0;
  const [deleteDailyLoginId, setDeleteDailyLoginId] = useState<number | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleBranchChange,
    handleCompanyChange,
    handleDateRangeChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      search: '',
      limit: 10,
      page: 0,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      timezone:
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    onFilterChange,
    pageKey
  });

  const { isBranchAdmin, isAdminView } = useUserViewMode();

  const handleSelectAllDailyLogins = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedDailyLogins(event.target.checked ? dailyLogins : []);
  };

  const handleSelectOneDailyLogin = (
    _event: ChangeEvent<HTMLInputElement>,
    dailyLoginId: number
  ): void => {
    const dailyLogin = dailyLogins.find((dl) => dl.id === dailyLoginId);
    if (!dailyLogin) return;

    if (!selectedDailyLogins.find((dl) => dl.id === dailyLoginId)) {
      setSelectedDailyLogins((prevSelected) => [...prevSelected, dailyLogin]);
    } else {
      setSelectedDailyLogins((prevSelected) =>
        prevSelected.filter((dl) => dl.id !== dailyLoginId)
      );
    }
  };

  const handleBulkDelete = async (dailyLogins: DailyLogin[]) => {
    try {
      setDeleting(true);
      const result = await dailyLoginService.bulkDeleteDailyLogins(
        dailyLogins.map((dl) => dl.id)
      );

      {
        const deletedCount = result?.deletedCount || dailyLogins.length;
        const skippedCount = result?.skippedCount || 0;

        let message = t('daily.login.bulk.delete.success.message', {
          count: deletedCount
        });

        if (skippedCount > 0) {
          message += ` ${t('daily.login.bulk.delete.skipped', {
            count: skippedCount
          })}`;
        }

        showSnackbar(message, 'success');
        setSelectedDailyLogins([]);
        onFilterChange(filters);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('daily.login.bulk.delete.failed');
      showSnackbar(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'refund',
    icon: <MoneyOff />,
    color: 'warning',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'DailyLogin'),
    disabled: selectedDailyLogins.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.refund'),
    confirmMessage: t('confirm.bulk.refund.question'),
    variant: 'contained'
  };

  const selectedSomeDailyLogins =
    selectedDailyLogins.length > 0 &&
    selectedDailyLogins.length < dailyLogins.length;
  const selectedAllDailyLogins =
    selectedDailyLogins.length > 0 &&
    selectedDailyLogins.length === dailyLogins.length;

  const filterOptions: FilterOption[] = [
    {
      id: 'date',
      label: t('filters.date.range'),
      component: (
        <DateFilterBar
          onChange={(dateRange) => {
            if (dateRange) {
              const timezone =
                user$.currentBranch.get()?.timezone ??
                Intl.DateTimeFormat().resolvedOptions().timeZone;
              handleDateRangeChange(
                format(dateRange.startDate, 'yyyy-MM-dd'),
                format(dateRange.endDate, 'yyyy-MM-dd'),
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
          initialDateRange={
            filters.startDate && filters.endDate
              ? {
                  startDate: new Date(filters.startDate),
                  endDate: new Date(filters.endDate)
                }
              : undefined
          }
          size="small"
        />
      )
    }
  ];

  if (!isBranchAdmin) {
    filterOptions.push({
      id: 'location',
      label: t('filters.location'),
      component: (
        <LocationFilter
          branchId={filters.branchId}
          companyId={filters.companyId}
          onBranchChange={handleBranchChange}
          onCompanyChange={handleCompanyChange}
          size="small"
        />
      )
    });
  }

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left',
      padding: 'checkbox'
    },
    {
      id: 'customer',
      label: t('customer'),
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
      id: 'purchaseType',
      label: t('purchase.type'),
      align: 'left'
    },
    {
      id: 'processedBy',
      label: t('processed.by'),
      align: 'left'
    },
    {
      id: 'createdAt',
      label: t('created.at'),
      align: 'left'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center' as const
    }
  ];

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeleteClick = (dailyLoginId: number) => {
    setDeleteDailyLoginId(dailyLoginId);
  };

  const handleDeleteCancel = () => {
    setDeleteDailyLoginId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDailyLoginId) return;

    try {
      setDeleting(true);
      await dailyLoginService.deleteDailyLogin(deleteDailyLoginId);
      showSnackbar(t('daily.login.deleted.successfully'), 'success');
      setDeleteDailyLoginId(null);
      onFilterChange(filters);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('daily.login.delete.failed');
      showSnackbar(errorMessage, 'error');
    } finally {
      setDeleting(false);
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

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

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
                <BulkActions<DailyLogin>
                  selected={selectedDailyLogins}
                  buttons={[deleteButton]}
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
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('daily.login.list')}
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
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selectedAllDailyLogins}
                        indeterminate={selectedSomeDailyLogins}
                        onChange={handleSelectAllDailyLogins}
                      />
                    </TableCell>
                    {tableHeaders.slice(1).map((header) => (
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
                  ) : dailyLogins.length > 0 ? (
                    dailyLogins.map((login) => {
                      const isSelected = selectedDailyLogins.some(
                        (dl) => dl.id === login.id
                      );

                      return (
                        <TableRow hover key={login.id} selected={isSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isSelected}
                              onChange={(event) =>
                                handleSelectOneDailyLogin(event, login.id)
                              }
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
                              {login.user
                                ? `${login.user.name} ${login.user.surname}`
                                : '-'}
                            </Typography>
                            {login.user && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {login.user.email}
                              </Typography>
                            )}
                          </TableCell>
                          {!isBranchAdmin && isAdminView && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {login.branch.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {login.branch.company.name}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              noWrap
                            >
                              {login.purchaseType
                                ? t(
                                    preparePurchaseTypeLabel(login.purchaseType)
                                  )
                                : t('membership')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {login.employee
                                ? `${login.employee.name} ${login.employee.surname}`
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(login.createdAt)}
                          </TableCell>
                          <TableCell align="center">
                            <Can I="delete" a="DailyLogin" ability={ability}>
                              <Tooltip title={t('refund')} arrow>
                                <span>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(login.id);
                                    }}
                                    disabled={deleting}
                                    sx={{
                                      '&:hover': {
                                        background: theme.colors.warning.lighter
                                      },
                                      color: deleting
                                        ? theme.palette.action.disabled
                                        : theme.palette.warning.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    <MoneyOff fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Can>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.daily.login.found')}
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
      <ConfirmDialog
        open={Boolean(deleteDailyLoginId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('confirm.refund')}
        message={t('confirm.refund.question')}
        confirmButtonText={t('refund')}
        confirmButtonColor="warning"
      />
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert
          variant="filled"
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        >
          <Typography>{snackbar.message}</Typography>
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default DailyLoginsTable;
