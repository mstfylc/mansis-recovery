import {
  useState,
  useEffect,
  ChangeEvent,
  useCallback,
  MouseEvent
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
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
  Typography,
  Chip,
  CircularProgress,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  OutlinedInput,
  InputAdornment,
  useTheme,
  TextField,
  Popover
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  WithdrawalRequest,
  WithdrawalStatus
} from '@/types/WithdrawalRequest.interface';
import { financeService } from '@/data/financeService';
import { getBranchFinancialInfo } from '@/data/branchFinancialInfoService';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import NoDataFound from '@/components/NoDataFound';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import PartialPaymentModal from '@/content/Management/Finance/PartialPaymentModal';
import {
  LocalAtmTwoTone,
  SearchOutlined,
  NotesOutlined
} from '@mui/icons-material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { debounce } from '@/utils/helpers';
import StatusFilter from '@/components/filters/StatusFilter';
import {
  formatDateToDayMonthYearTime,
  formatDateForApi
} from '@/utils/dateFormatters';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { user$ } from '@/store/userStore';
import { format } from 'date-fns';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTableFilters } from '@/hooks/useTableFilters';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import { Filters } from '@/types/Filters';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface WithdrawalRequestsProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

function WithdrawalRequests({ dateRange }: WithdrawalRequestsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isBranchAdmin, isSuperAdmin } = useUserViewMode();
  const showLocationColumn = !isBranchAdmin;
  const showActionColumn = !isSuperAdmin;
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const theme = useTheme();

  const handleFilterChange = (newFilters: Filters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters
    }));
  };

  const {
    filters,
    setFilters,
    handleSearch,
    handleStatusChange,
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
      startDate: formatDateForApi(dateRange.startDate),
      endDate: formatDateForApi(dateRange.endDate),
      status: undefined
    },
    onFilterChange: handleFilterChange,
    pageKey: 'withdrawal-requests'
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [openWithdrawConfirmDialog, setOpenWithdrawConfirmDialog] =
    useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openPartialPaymentDialog, setOpenPartialPaymentDialog] =
    useState(false);
  const [selectedWithdrawalForPayment, setSelectedWithdrawalForPayment] =
    useState<WithdrawalRequest | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [noteText, setNoteText] = useState<string>('');
  const [notePopoverAnchor, setNotePopoverAnchor] =
    useState<HTMLElement | null>(null);
  const [selectedRequestNote, setSelectedRequestNote] = useState<string>('');
  const [selectedRequests, setSelectedRequests] = useState<WithdrawalRequest[]>(
    []
  );
  const selectedBulkActions = selectedRequests.length > 0;
  const selectedSomeRequests =
    selectedRequests.length > 0 &&
    selectedRequests.length < (requests?.length || 0);
  const selectedAllRequests =
    selectedRequests.length === (requests?.length || 0);

  const [availableBalance, setAvailableBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left',
      padding: 'checkbox'
    },
    {
      id: 'createdAt',
      label: t('finance.created.at'),
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
      id: 'requestedBy',
      label: t('finance.requested.by'),
      align: 'left'
    },
    {
      id: 'amount',
      label: t('finance.amount'),
      align: 'center'
    },
    {
      id: 'status',
      label: t('finance.status'),
      align: 'left'
    },
    {
      id: 'processedBy',
      label: t('finance.processed.by'),
      align: 'left'
    },
    {
      ...(showActionColumn
        ? {
            id: 'actions',
            label: t('actions'),
            align: 'center'
          }
        : [])
    }
  ];

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showNotification = (
    message: string,
    severity: SnackbarState['severity'] = 'error'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const fetchAvailableBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const currentBranch = user$.currentBranch.get();
      const branchId = currentBranch?.id;
      const result = await financeService.getAvailableBalance(branchId);
      if (result?.availableBalance !== undefined) {
        setAvailableBalance(result.availableBalance);
      }
    } catch (error: any) {
      console.error('Error fetching available balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await financeService.getWithdrawalRequests({
        page: (filters.page ?? 0) + 1,
        limit: filters.limit ?? 10,
        search: filters.search,
        status: filters.status as WithdrawalStatus | undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
        companyId: filters.companyId
      });

      const items = result?.items;
      setRequests(Array.isArray(items) ? items : []);
      setCount(result?.total || 0);

      if (isBranchAdmin) {
        fetchAvailableBalance();
      }
    } catch (error: any) {
      console.error('Error fetching withdrawal requests:', error);
      setRequests([]);
      setCount(0);
      showNotification(t('finance.no.requests.found'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.page,
    filters.limit,
    filters.search,
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.branchId,
    filters.companyId,
    t,
    isBranchAdmin,
    fetchAvailableBalance
  ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSelectAllRequests = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedRequests(event.target.checked ? requests : []);
  };

  const handleSelectOneRequest = (
    _event: ChangeEvent<HTMLInputElement>,
    requestId: string
  ): void => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    if (!selectedRequests.find((r) => r.id === requestId)) {
      setSelectedRequests((prevSelected) => [...prevSelected, request]);
    } else {
      setSelectedRequests((prevSelected) =>
        prevSelected.filter((r) => r.id !== requestId)
      );
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const debouncedSearch = debounce((searchTerm: string) => {
    handleSearch(searchTerm);
  }, 500);

  const handleWithdrawConfirmDialogOpen = async () => {
    const currentBranch = user$.currentBranch.get();
    const branchId = currentBranch?.id;

    if (!branchId) {
      showNotification(t('finance.no.branch'), 'error');
      return;
    }

    try {
      const financialInfo = await getBranchFinancialInfo(branchId);

      if (!financialInfo) {
        showNotification(t('finance.financial.info.required'), 'warning');
        setTimeout(() => {
          navigate(`/management/branches/${branchId}`);
        }, 2000);
        return;
      }

      await fetchAvailableBalance();
      setOpenWithdrawConfirmDialog(true);
    } catch (error: any) {
      console.error('Error checking financial info:', error);
      showNotification(t('error.loading.financial.info'), 'error');
    }
  };

  const handleWithdrawConfirmDialogClose = () => {
    setOpenWithdrawConfirmDialog(false);
  };

  const handleCreateWithdrawalRequest = async () => {
    const currentBranch = user$.currentBranch.get();
    const branchId = currentBranch?.id;

    try {
      if (!branchId) {
        showNotification(t('finance.no.branch'));
        return;
      }

      const requestData = {
        amount: availableBalance,
        branchId
      };

      await financeService.createWithdrawalRequest(requestData);
      showNotification(t('finance.request.success'), 'success');
      setOpenWithdrawConfirmDialog(false);
      fetchRequests();
    } catch (error: any) {
      console.error('Error creating withdrawal request:', error);
      showNotification(
        error?.response?.data?.message || t('finance.request.error'),
        'error'
      );
    }
  };

  const handleApproveDialogOpen = (id: string) => {
    setSelectedRequestId(id);
    setNoteText('');
    setOpenApproveDialog(true);
  };

  const handleApproveDialogClose = () => {
    setOpenApproveDialog(false);
    setSelectedRequestId(null);
    setNoteText('');
  };

  const handleRejectDialogOpen = (id: string) => {
    setSelectedRequestId(id);
    setNoteText('');
    setOpenRejectDialog(true);
  };

  const handleRejectDialogClose = () => {
    setOpenRejectDialog(false);
    setSelectedRequestId(null);
    setNoteText('');
  };

  const handlePartialPaymentDialogOpen = (request: WithdrawalRequest) => {
    setSelectedWithdrawalForPayment(request);
    setOpenPartialPaymentDialog(true);
  };

  const handlePartialPaymentDialogClose = () => {
    setOpenPartialPaymentDialog(false);
    setSelectedWithdrawalForPayment(null);
  };

  const handleNotePopoverOpen = (
    event: MouseEvent<HTMLElement>,
    note: string
  ) => {
    setNotePopoverAnchor(event.currentTarget);
    setSelectedRequestNote(note);
  };

  const handleNotePopoverClose = () => {
    setNotePopoverAnchor(null);
    setSelectedRequestNote('');
  };

  const handleApproveRequest = async () => {
    if (!selectedRequestId) return;

    setProcessingId(selectedRequestId);
    try {
      await financeService.updateWithdrawalRequestStatus(selectedRequestId, {
        status: WithdrawalStatus.APPROVED,
        ...(noteText && { note: noteText })
      });
      showNotification(t('finance.update.success'), 'success');
      handleApproveDialogClose();
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving withdrawal request:', error);
      showNotification(t('finance.update.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequestId) return;

    setProcessingId(selectedRequestId);
    try {
      await financeService.updateWithdrawalRequestStatus(selectedRequestId, {
        status: WithdrawalStatus.REJECTED,
        ...(noteText && { note: noteText })
      });
      showNotification(t('finance.update.success'), 'success');
      handleRejectDialogClose();
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting withdrawal request:', error);
      showNotification(t('finance.update.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async (requests: WithdrawalRequest[]) => {
    const pendingRequests = requests.filter(
      (r) => r.status === WithdrawalStatus.PENDING
    );

    if (pendingRequests.length === 0) {
      showNotification(t('finance.no.pending.requests'), 'warning');
      return;
    }

    try {
      const updatePromises = pendingRequests.map((request) =>
        financeService.updateWithdrawalRequestStatus(request.id, {
          status: WithdrawalStatus.APPROVED
        })
      );

      await Promise.all(updatePromises);
      showNotification(t('finance.update.success'), 'success');
      setSelectedRequests([]);
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving requests:', error);
      showNotification(t('finance.update.error'));
    }
  };

  const handleBulkReject = async (requests: WithdrawalRequest[]) => {
    const pendingRequests = requests.filter(
      (r) => r.status === WithdrawalStatus.PENDING
    );

    if (pendingRequests.length === 0) {
      showNotification(t('finance.no.pending.requests'), 'warning');
      return;
    }

    try {
      const updatePromises = pendingRequests.map((request) =>
        financeService.updateWithdrawalRequestStatus(request.id, {
          status: WithdrawalStatus.REJECTED
        })
      );

      await Promise.all(updatePromises);
      showNotification(t('finance.update.success'), 'success');
      setSelectedRequests([]);
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting requests:', error);
      showNotification(t('finance.update.error'));
    }
  };

  const getStatusChip = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.APPROVED:
        return (
          <Chip
            label={t('finance.status.approved')}
            color="success"
            size="small"
          />
        );
      case WithdrawalStatus.PARTIALLY_PAID:
        return (
          <Chip
            label={t('finance.status.partially.paid')}
            color="info"
            size="small"
          />
        );
      case WithdrawalStatus.REJECTED:
        return (
          <Chip
            label={t('finance.status.rejected')}
            color="error"
            size="small"
          />
        );
      case WithdrawalStatus.PENDING:
        return (
          <Chip
            label={t('finance.status.pending')}
            color="warning"
            size="small"
          />
        );
      case WithdrawalStatus.CANCELED:
        return (
          <Chip
            label={t('finance.status.canceled')}
            color="info"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  const approveButton: BulkActionButtonConfig = {
    label: t('finance.approve'),
    icon: <CheckCircleOutlineIcon />,
    color: 'success' as const,
    onClick: handleBulkApprove,
    showCondition: true,
    disabled: selectedRequests.length === 0,
    position: 'left' as const,
    showConfirmDialog: true,
    confirmTitle: t('finance.confirm.status.change'),
    confirmMessage: t('finance.confirm.approve.message'),
    variant: 'contained' as const
  };

  const rejectButton: BulkActionButtonConfig = {
    label: t('finance.reject'),
    icon: <CancelIcon />,
    color: 'error' as const,
    onClick: handleBulkReject,
    showCondition: true,
    disabled: selectedRequests.length === 0,
    position: 'left' as const,
    showConfirmDialog: true,
    confirmTitle: t('finance.confirm.status.change'),
    confirmMessage: t('finance.confirm.reject.message'),
    variant: 'contained' as const
  };

  const buttons = [approveButton, rejectButton];

  const handleRefresh = () => {
    fetchRequests();
  };

  const handleCancelDialogOpen = (id: string) => {
    setSelectedRequestId(id);
    setOpenCancelDialog(true);
  };

  const handleCancelDialogClose = () => {
    setOpenCancelDialog(false);
    setSelectedRequestId(null);
  };

  const handleCancelRequest = async () => {
    if (!selectedRequestId) return;

    setProcessingId(selectedRequestId);
    try {
      const currentBranch = user$.currentBranch.get();
      const branchId = currentBranch?.id;
      await financeService.cancelWithdrawalRequest(selectedRequestId, branchId);
      showNotification(t('finance.cancel.success'), 'success');
      handleCancelDialogClose();
      fetchRequests();
    } catch (error: any) {
      console.error('Error canceling withdrawal request:', error);
      showNotification(t('finance.cancel.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const statusFilterOptions = [
    { id: 'all', name: t('all') },
    {
      id: WithdrawalStatus.PENDING,
      name: t('finance.status.pending')
    },
    {
      id: WithdrawalStatus.APPROVED,
      name: t('finance.status.approved')
    },
    {
      id: WithdrawalStatus.REJECTED,
      name: t('finance.status.rejected')
    },
    {
      id: WithdrawalStatus.CANCELED,
      name: t('finance.status.canceled')
    }
  ];

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('finance.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          options={statusFilterOptions}
          minWidth={200}
          size="small"
        />
      )
    },
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
          size="small"
          initialDateRange={
            filters.startDate && filters.endDate
              ? {
                  startDate: new Date(filters.startDate),
                  endDate: new Date(filters.endDate),
                  preset: undefined
                }
              : undefined
          }
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

  return (
    <>
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
                <BulkActions selected={selectedRequests} buttons={buttons} />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                action={
                  <Box display="flex" alignItems="center" gap={1}>
                    <FormControl variant="outlined" size="small">
                      <OutlinedInput
                        placeholder={t('search')}
                        defaultValue={filters.search}
                        startAdornment={
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        }
                        onChange={(e) => debouncedSearch(e.target.value)}
                      />
                    </FormControl>

                    <FilterPopover
                      filterOptions={filterOptions}
                      onApplyFilters={handleApplyFilters}
                      onResetFilters={handleResetFilters}
                      activeFiltersCount={getActiveFiltersCount()}
                    />

                    {isBranchAdmin && (
                      <Box display="flex" gap={1}>
                        <Button
                          disabled={availableBalance <= 0}
                          variant="contained"
                          color="primary"
                          startIcon={<LocalAtmTwoTone />}
                          onClick={handleWithdrawConfirmDialogOpen}
                          className="withdrawal-request-button"
                        >
                          {t('finance.withdraw')}
                        </Button>
                      </Box>
                    )}
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('finance.withdrawal.requests')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={handleRefresh}
                        disabled={loading}
                        sx={{
                          ml: 1,
                          '&:hover': {
                            background: theme.colors.primary.lighter
                          },
                          color: theme.palette.primary.main
                        }}
                        className="finance-refresh-button"
                      >
                        <RefreshTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {isBranchAdmin && (
                      <Typography
                        variant="body2"
                        sx={{
                          ml: 2,
                          backgroundColor: 'background.default',
                          p: 0.5,
                          px: 1,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        className="withdrawal-balance"
                      >
                        {t('finance.withdrawable.balance')}:{' '}
                        {loadingBalance ? (
                          <CircularProgress size={20} />
                        ) : (
                          availableBalance.toFixed(2)
                        )}{' '}
                        {t('tl')}
                        <Tooltip arrow title={t('refresh.balance')}>
                          <IconButton
                            onClick={fetchAvailableBalance}
                            size="small"
                            sx={{
                              ml: 0.5,
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.palette.primary.main
                            }}
                          >
                            <RefreshTwoToneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Typography>
                    )}
                  </Box>
                }
              />
            )}
            <Divider />
            <TableContainer className="withdrawal-requests-table">
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
                            checked={selectedAllRequests}
                            indeterminate={selectedSomeRequests}
                            onChange={handleSelectAllRequests}
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
                  ) : (requests?.length || 0) === 0 ? (
                    <NoDataFound
                      message={t('finance.no.requests.found')}
                      colSpan={tableHeaders.length}
                    />
                  ) : (
                    (requests || []).map((request) => {
                      const isRequestSelected = selectedRequests.some(
                        (r) => r.id === request.id
                      );
                      return (
                        <TableRow
                          hover
                          key={request.id}
                          selected={isRequestSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isRequestSelected}
                              onChange={(event) =>
                                handleSelectOneRequest(event, request.id)
                              }
                              value={isRequestSelected}
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
                              {formatDateToDayMonthYearTime(request.createdAt)}
                            </Typography>
                          </TableCell>
                          {showLocationColumn && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {request.branch?.name}
                              </Typography>
                              {isSuperAdmin && request.branch?.company && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {request.branch?.company?.name}
                                </Typography>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {request.requestedBy?.name}{' '}
                              {request.requestedBy?.surname}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {Number(request.amount).toFixed(2)} {t('tl')}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(request.status)}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {request.processedBy
                                ? `${request.processedBy?.name} ${request.processedBy?.surname}`
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 0.5
                              }}
                            >
                              {request.note && (
                                <Tooltip title={t('finance.view.note')}>
                                  <IconButton
                                    color="info"
                                    onClick={(e) =>
                                      handleNotePopoverOpen(e, request.note!)
                                    }
                                    size="small"
                                  >
                                    <NotesOutlined />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {(request.status === WithdrawalStatus.PENDING ||
                                request.status ===
                                  WithdrawalStatus.PARTIALLY_PAID) && (
                                <>
                                  {isBranchAdmin ? (
                                    <Tooltip title={t('finance.cancel')}>
                                      <IconButton
                                        color="error"
                                        onClick={() =>
                                          handleCancelDialogOpen(request.id)
                                        }
                                        disabled={processingId === request.id}
                                        size="small"
                                      >
                                        <CancelIcon />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      {/* Partial Payment butonu sadece kalan tutar varsa görünsün */}
                                      {parseFloat(
                                        request.remainingAmount || '0'
                                      ) > 0 && (
                                        <Tooltip
                                          title={t('finance.partial.payment')}
                                        >
                                          <IconButton
                                            color="primary"
                                            onClick={() =>
                                              handlePartialPaymentDialogOpen(
                                                request
                                              )
                                            }
                                            disabled={
                                              processingId === request.id
                                            }
                                            size="small"
                                          >
                                            <PaymentIcon />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      <Tooltip title={t('finance.approve')}>
                                        <IconButton
                                          color="success"
                                          onClick={() =>
                                            handleApproveDialogOpen(request.id)
                                          }
                                          disabled={processingId === request.id}
                                          size="small"
                                        >
                                          <CheckCircleOutlineIcon />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title={t('finance.reject')}>
                                        <IconButton
                                          color="error"
                                          onClick={() =>
                                            handleRejectDialogOpen(request.id)
                                          }
                                          disabled={processingId === request.id}
                                          size="small"
                                        >
                                          <CancelIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box p={2}>
              <TablePagination
                component="div"
                count={count || 0}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={count ? (filters.page ?? 0) : 0}
                rowsPerPage={filters.limit ?? 10}
                rowsPerPageOptions={[5, 10, 25, 30]}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Withdraw Confirmation Dialog */}
      <ConfirmDialog
        open={openWithdrawConfirmDialog}
        onClose={handleWithdrawConfirmDialogClose}
        onConfirm={handleCreateWithdrawalRequest}
        title={t('finance.confirm.withdrawal')}
        message={t('finance.confirm.withdrawal.message', {
          amount: availableBalance.toFixed(2)
        })}
        confirmButtonText={t('finance.withdraw')}
        confirmButtonColor="primary"
      />

      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={handleApproveDialogClose}>
        <DialogTitle>{t('finance.confirm.status.change')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('finance.confirm.approve.message')}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('finance.note.optional')}
            fullWidth
            multiline
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t('finance.note.placeholder')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApproveDialogClose} color="secondary">
            {t('finance.cancel')}
          </Button>
          <Button
            onClick={handleApproveRequest}
            color="success"
            variant="contained"
            disabled={processingId !== null}
          >
            {processingId !== null ? (
              <CircularProgress size={24} />
            ) : (
              t('finance.approve')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={handleRejectDialogClose}>
        <DialogTitle>{t('finance.confirm.status.change')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('finance.confirm.reject.message')}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('finance.note.optional')}
            fullWidth
            multiline
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t('finance.note.placeholder')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose} color="secondary">
            {t('finance.cancel')}
          </Button>
          <Button
            onClick={handleRejectRequest}
            color="error"
            variant="contained"
            disabled={processingId !== null}
          >
            {processingId !== null ? (
              <CircularProgress size={24} />
            ) : (
              t('finance.reject')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={openCancelDialog}
        onClose={handleCancelDialogClose}
        onConfirm={handleCancelRequest}
        title={t('finance.confirm.cancel')}
        message={t('finance.confirm.cancel.message')}
        confirmButtonText={t('finance.cancel')}
        cancelButtonText={t('give.up')}
        confirmButtonColor="error"
      />

      <PartialPaymentModal
        open={openPartialPaymentDialog}
        onClose={handlePartialPaymentDialogClose}
        withdrawal={
          selectedWithdrawalForPayment
            ? {
                id: selectedWithdrawalForPayment.id,
                requestedAmount: parseFloat(
                  selectedWithdrawalForPayment.amount
                ),
                paidAmount: parseFloat(
                  selectedWithdrawalForPayment.paidAmount || '0'
                ),
                remainingAmount: parseFloat(
                  selectedWithdrawalForPayment.remainingAmount ?? '0'
                ),
                status: selectedWithdrawalForPayment.status
              }
            : null
        }
        onSuccess={() => {
          fetchRequests();
          showNotification(t('finance.withdrawal.payment.success'), 'success');
        }}
      />

      <Popover
        open={Boolean(notePopoverAnchor)}
        anchorEl={notePopoverAnchor}
        onClose={handleNotePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {t('finance.company.note')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedRequestNote}
          </Typography>
        </Box>
      </Popover>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default WithdrawalRequests;
