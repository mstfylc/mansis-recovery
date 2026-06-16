import React, { useState, ChangeEvent, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import { MoneyOff } from '@mui/icons-material';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
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
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { SearchOutlined } from '@mui/icons-material';
import { debounce, preparePurchaseTypeLabel } from '@/utils/helpers';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import ActivityFilter from '@/components/filters/ActivityFilter';
import ChildActivityFilter from '@/components/filters/ChildActivityFilter';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import StatusLabel from '@/components/StatusLabel';
import StatusFilter from '@/components/filters/StatusFilter';
import { Ticket } from '@/types/Ticket.interface';
import { TicketUsageStatus } from '@/enums/ticket-usage-status';
import NoDataFound from '@/components/NoDataFound';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { ticketService } from '@/data/ticketService';

interface TicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const statusOptions = [
  {
    id: 'all',
    name: 'all'
  },
  {
    id: 'USED',
    name: 'ticket.usage.status.used'
  },
  {
    id: 'NOT_USED',
    name: 'ticket.usage.status.not_used'
  },
  {
    id: 'EXPIRED',
    name: 'ticket.usage.status.expired'
  },
  {
    id: 'CANCELED',
    name: 'ticket.usage.status.canceled'
  },
  {
    id: 'REFUNDED',
    name: 'ticket.usage.status.refunded'
  }
];

interface StatusMap {
  [key: string]: {
    text: string;
    color:
      | 'black'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'warning'
      | 'success'
      | 'info';
  };
}

const getStatusLabel = (
  ticketStatus: string,
  translations: {
    used: string;
    notUsed: string;
    expired: string;
    canceled: string;
    refunded: string;
  }
): React.ReactElement => {
  const map: StatusMap = {
    USED: {
      text: translations.used,
      color: 'success'
    },
    NOT_USED: {
      text: translations.notUsed,
      color: 'warning'
    },
    EXPIRED: {
      text: translations.expired,
      color: 'error'
    },
    CANCELED: {
      text: translations.canceled,
      color: 'error'
    },
    REFUNDED: {
      text: translations.refunded,
      color: 'info'
    }
  };

  return <StatusLabel status={ticketStatus} customMap={map} />;
};

const TicketsTable = ({
  tickets,
  loading,
  totalCount,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: TicketsTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const selectedBulkActions = selectedTickets.length > 0;
  const [refundTicketId, setRefundTicketId] = useState<number | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const selectedSomeTickets =
    selectedTickets.length > 0 && selectedTickets.length < tickets.length;
  const selectedAllTickets = selectedTickets.length === tickets.length;

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
    handleBranchChange,
    handleCompanyChange,
    handleDateRangeChange,
    handleActivityChange,
    handleChildActivityChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useTableFilters({
    initialFilters: {
      status: undefined,
      search: '',
      limit: 10,
      page: 0
    },
    onFilterChange,
    pageKey
  });

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          minWidth={150}
          size="small"
          options={statusOptions.map((option) => ({
            id: option.id,
            name: t(option.name)
          }))}
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
    },
    {
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
    },
    {
      id: 'activity',
      label: t('activity'),
      component: (
        <ActivityFilter
          value={filters.activityId}
          onChange={handleActivityChange}
          size="small"
          companyId={filters.companyId}
          branchId={filters.branchId}
        />
      )
    },
    {
      id: 'childActivity',
      label: t('child.activity'),
      component: (
        <ChildActivityFilter
          value={filters.childActivityId}
          onChange={handleChildActivityChange}
          size="small"
          activityId={filters.activityId}
          disabled={!filters.activityId}
        />
      )
    }
  ];

  const { isSuperAdmin, isCompanyAdmin, isAdminView } = useUserViewMode();

  const showCompanyColumn = isSuperAdmin;
  const showBranchColumn = (isSuperAdmin || isCompanyAdmin) && isAdminView; // Only show in Admin View

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left',
      padding: 'checkbox'
    },
    {
      id: 'user',
      label: t('customer'),
      align: 'left'
    },
    {
      id: 'activity',
      label: t('event.details'),
      align: 'left'
    },
    {
      id: 'purchaseType',
      label: t('purchase.type'),
      align: 'left'
    },
    {
      id: 'status',
      label: t('status'),
      align: 'center'
    },
    ...(showBranchColumn || showCompanyColumn
      ? [
          {
            id: 'location',
            label: t('location'),
            align: 'left'
          }
        ]
      : []),
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

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setPage(newPage);
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
    const newLimit = Number.parseInt(event.target.value);
    setLimit(newLimit);
    setPage(0);
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
  const handleSelectAllTickets = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedTickets(
      event.target.checked
        ? tickets.filter(
            (t) => t.ticketUsageStatus === TicketUsageStatus.NOT_USED
          )
        : []
    );
  };

  const handleSelectOneTicket = (
    _event: ChangeEvent<HTMLInputElement>,
    ticket: Ticket
  ): void => {
    if (selectedTickets.some((t) => t.id === ticket.id)) {
      setSelectedTickets((prevSelected) =>
        prevSelected.filter((t) => t.id !== ticket.id)
      );
    } else {
      setSelectedTickets((prevSelected) => [...prevSelected, ticket]);
    }
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRefundClick = (ticketId: number) => {
    setRefundTicketId(ticketId);
  };

  const handleRefundCancel = () => {
    setRefundTicketId(null);
  };

  const handleRefundConfirm = async () => {
    if (!refundTicketId) return;

    try {
      setRefunding(true);
      await ticketService.refund(refundTicketId);
      showSnackbar(t('ticket.refunded.successfully'), 'success');
      setRefundTicketId(null);
      onFilterChange(filters);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('ticket.refund.failed');
      showSnackbar(errorMessage, 'error');
    } finally {
      setRefunding(false);
    }
  };

  const handleBulkRefund = async (tickets: Ticket[]) => {
    try {
      setRefunding(true);
      const result = await ticketService.bulkRefund(tickets.map((t) => t.id));
      {
        const refundedCount = result?.refunded?.length || tickets.length;
        const failedCount = result?.failed?.length || 0;

        let message = t('ticket.bulk.refund.success.message', {
          count: refundedCount
        });

        if (failedCount > 0) {
          message += ` ${t('ticket.bulk.refund.failed.count', {
            count: failedCount
          })}`;
        }

        showSnackbar(message, 'success');
        setSelectedTickets([]);
        onFilterChange(filters);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('ticket.bulk.refund.failed');
      showSnackbar(errorMessage, 'error');
    } finally {
      setRefunding(false);
    }
  };

  const refundButton = {
    label: 'refund',
    icon: <MoneyOff />,
    color: 'warning',
    onClick: handleBulkRefund,
    showCondition: ability.can(Action.Delete, 'Ticket'),
    disabled: selectedTickets.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.refund'),
    confirmMessage: t('confirm.bulk.refund.question'),
    variant: 'contained'
  } as BulkActionButtonConfig;

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
    setPage(0);
  }, 500);

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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
            {selectedBulkActions && (
              <Box flex={1} p={2}>
                <BulkActions<Ticket>
                  selected={selectedTickets}
                  buttons={[refundButton]}
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
                      {t('ticket.list')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={() => {
                          onFilterChange({
                            ...filters,
                            page
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
                        onClick={
                          header.id === 'checkbox'
                            ? handleSelectClick
                            : undefined
                        }
                      >
                        {header.id === 'checkbox' ? (
                          <Checkbox
                            color="primary"
                            checked={selectedAllTickets}
                            indeterminate={selectedSomeTickets}
                            onChange={handleSelectAllTickets}
                            onClick={handleSelectClick}
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
                  ) : tickets.length > 0 ? (
                    tickets.map((ticket) => {
                      const isTicketSelected = selectedTickets.some(
                        (t) => t.id === ticket.id
                      );
                      return (
                        <TableRow
                          hover
                          key={ticket.id}
                          selected={isTicketSelected}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={handleSelectClick}
                          >
                            {ticket.ticketUsageStatus ===
                              TicketUsageStatus.NOT_USED && (
                              <Checkbox
                                color="primary"
                                checked={isTicketSelected}
                                onChange={(
                                  event: ChangeEvent<HTMLInputElement>
                                ) => {
                                  event.stopPropagation();
                                  handleSelectOneTicket(event, ticket);
                                }}
                                value={isTicketSelected}
                                onClick={handleSelectClick}
                              />
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
                              {`${ticket.user.name} ${ticket.user.surname}`}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {ticket.user.email}
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
                              {ticket.childActivity?.title || '-'}
                            </Typography>
                            {ticket.childActivity && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {ticket.childActivity?.activity?.title || '-'}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              noWrap
                            >
                              {t(preparePurchaseTypeLabel(ticket.purchaseType))}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            {getStatusLabel(ticket.ticketUsageStatus, {
                              used: t('ticket.usage.status.used'),
                              notUsed: t('ticket.usage.status.not_used'),
                              expired: t('ticket.usage.status.expired'),
                              canceled: t('ticket.usage.status.canceled'),
                              refunded: t('ticket.usage.status.refunded')
                            })}
                          </TableCell>

                          {(showBranchColumn || showCompanyColumn) && (
                            <TableCell>
                              {ticket?.branch ? (
                                <>
                                  <Typography
                                    variant="body1"
                                    fontWeight="bold"
                                    color="text.primary"
                                    gutterBottom
                                    noWrap
                                  >
                                    {ticket.branch.name}
                                  </Typography>
                                  {showCompanyColumn &&
                                    ticket.branch.company && (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        noWrap
                                      >
                                        {ticket.branch.company.name}
                                      </Typography>
                                    )}
                                </>
                              ) : (
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {formatDateToDayMonthYearTime(ticket?.createdAt)}
                          </TableCell>

                          <TableCell align="center" onClick={handleSelectClick}>
                            <Can I="delete" a="Ticket" ability={ability}>
                              {ticket.ticketUsageStatus ===
                                TicketUsageStatus.NOT_USED && (
                                <Tooltip title={t('refund')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefundClick(ticket.id);
                                    }}
                                    disabled={refunding}
                                    sx={{
                                      '&:hover': {
                                        background: theme.colors.warning.lighter
                                      },
                                      color: refunding
                                        ? theme.palette.action.disabled
                                        : theme.palette.warning.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    <MoneyOff fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Can>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.ticket.found')}
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
                rowsPerPage={filters.limit || limit}
                rowsPerPageOptions={rowsPerPageOptions}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
      <ConfirmDialog
        open={Boolean(refundTicketId)}
        onClose={handleRefundCancel}
        onConfirm={handleRefundConfirm}
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

export default TicketsTable;
