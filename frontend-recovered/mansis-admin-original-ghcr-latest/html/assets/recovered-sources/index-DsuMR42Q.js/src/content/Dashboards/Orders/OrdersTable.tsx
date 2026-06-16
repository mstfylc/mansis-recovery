import React, { useState, ChangeEvent, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
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
  Select,
  MenuItem,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { Order } from '@/types/Order.interface';
import {
  preparePurchaseTypeLabel,
  prepareOrderStatusLabel
} from '@/utils/helpers';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import {
  SearchOutlined,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { setOrder } from '@/store/orderStore';
import NoDataFound from '@/components/NoDataFound';
import { debounce } from '@/utils/helpers';
import { Filters } from '@/types/Filters';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import DateFilterBar from '@/components/filters/DateFilterBar';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import LocationFilter from '@/components/filters/LocationFilter';
import PurchaseTypeFilter from '@/components/filters/PurchaseTypeFilter';
import OrderStatusFilter from '@/components/filters/OrderStatusFilter';
import { OrderStatus } from '@/enums/order-status';
import { orderService } from '@/data/orderService';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const OrdersTable = ({
  orders,
  loading,
  totalCount,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: OrdersTableProps) => {
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editedStatus, setEditedStatus] = useState<OrderStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const ability = useContext(AbilityContext);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const selectedBulkActions = selectedOrders.length > 0;
  const navigate = useNavigate();

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
      page: 0
    },
    onFilterChange,
    pageKey
  });
  const { t } = useTranslation();

  const { isAdminView } = useUserViewMode();

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
    ...(isAdminView
      ? [
          {
            id: 'location',
            label: t('location'),
            align: 'left'
          }
        ]
      : []),
    {
      id: 'processedBy',
      label: t('processed.by'),
      align: 'left'
    },
    {
      id: 'purchaseType',
      label: t('purchase.type'),
      align: 'left'
    },
    {
      id: 'status',
      label: t('order.status'),
      align: 'left'
    },
    {
      id: 'orderTotal',
      label: t('order.total'),
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
      align: 'center'
    }
  ];

  const handleSelectAllOrders = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    setSelectedOrders(event.target.checked ? orders : []);
  };

  const handleSelectOneOrder = (
    event: ChangeEvent<HTMLInputElement>,
    orderId: number
  ): void => {
    event.stopPropagation();

    const order = orders.find((u) => u.id === orderId);
    if (!order) return;

    if (!selectedOrders.find((u) => u.id === orderId)) {
      setSelectedOrders((prevSelected) => [...prevSelected, order]);
    } else {
      setSelectedOrders((prevSelected) =>
        prevSelected.filter((u) => u.id !== orderId)
      );
    }
  };

  const handleViewDetails = (order: Order) => {
    setOrder(order);
    navigate(`/dashboards/orders/${order.id}`, { state: { order } });
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

  // Handle purchase type filter change
  const handlePurchaseTypeChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      purchaseType: value,
      page: 0
    }));
  };

  // Handle order status filter change
  const handleOrderStatusChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      orderStatus: value,
      page: 0
    }));
  };

  // Filter options for the popover
  const filterOptions: FilterOption[] = [
    {
      id: 'purchaseType',
      label: t('filters.purchase.type'),
      component: (
        <PurchaseTypeFilter
          value={filters.purchaseType}
          onChange={handlePurchaseTypeChange}
          size="small"
        />
      )
    },
    {
      id: 'orderStatus',
      label: t('filters.order.status'),
      component: (
        <OrderStatusFilter
          value={filters.orderStatus}
          onChange={handleOrderStatusChange}
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

  // Add location filters based on user role
  if (isAdminView) {
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

  const selectedSomeOrders =
    selectedOrders.length > 0 && selectedOrders.length < orders.length;
  const selectedAllOrders = selectedOrders.length === orders.length;
  const theme = useTheme();

  const buttons: BulkActionButtonConfig[] = [];

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEditClick = (order: Order) => {
    setEditingOrderId(order.id);
    setEditedStatus(order.status as OrderStatus);
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditedStatus(null);
  };

  const handleStatusChange = (status: OrderStatus) => {
    setEditedStatus(status);
  };

  const handleSaveStatus = async (order: Order) => {
    if (!editedStatus || editedStatus === order.status) {
      handleCancelEdit();
      return;
    }

    try {
      setUpdating(true);
      const result = await orderService.updateOrderStatus({
        orderId: order.id,
        status: editedStatus,
        branchId: order.branchId
      });

      if (result?.status === 200 || !result?.status) {
        showSnackbar(t('order.status.updated.successfully'), 'success');
        handleCancelEdit();
        onFilterChange(filters);
      } else {
        showSnackbar(
          result?.message || t('order.status.update.failed'),
          'error'
        );
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('order.status.update.failed');
      showSnackbar(errorMessage, 'error');
    } finally {
      setUpdating(false);
    }
  };

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
              <Box flex={1} p={2} className="order-bulk-actions">
                <BulkActions<Order>
                  selected={selectedOrders}
                  buttons={buttons}
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
                    className="order-filters"
                  >
                    <FormControl
                      sx={{ minWidth: 200, mr: 2 }}
                      className="order-search"
                    >
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
                      {t('order.list')}
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
                        className="order-refresh"
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
                            checked={selectedAllOrders}
                            indeterminate={selectedSomeOrders}
                            onChange={handleSelectAllOrders}
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
                  ) : orders.length > 0 ? (
                    orders.map((order) => {
                      const isOrderSelected = selectedOrders.some(
                        (u) => u.id === order.id
                      );
                      return (
                        <TableRow
                          hover
                          key={order.id}
                          selected={isOrderSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isOrderSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneOrder(event, order.id)}
                              value={isOrderSelected}
                              onClick={(event) => event.stopPropagation()}
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
                              {order.userName || order.userSurname
                                ? `${order.userName || ''} ${order.userSurname || ''}`.trim()
                                : '-'}
                            </Typography>
                          </TableCell>
                          {isAdminView && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {order.branchName}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {order.companyName}
                              </Typography>
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
                              {order.employeeName ? order.employeeName : '-'}{' '}
                              {order.employeeSurname}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {t(preparePurchaseTypeLabel(order.purchaseType))}
                          </TableCell>
                          <TableCell>
                            {editingOrderId === order.id ? (
                              <FormControl fullWidth size="small">
                                <Select
                                  value={editedStatus || order.status}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      e.target.value as OrderStatus
                                    )
                                  }
                                  disabled={updating}
                                >
                                  <MenuItem value={OrderStatus.PREPARING}>
                                    {t('order.status.preparing')}
                                  </MenuItem>
                                  <MenuItem value={OrderStatus.READY}>
                                    {t('order.status.ready')}
                                  </MenuItem>
                                  <MenuItem value={OrderStatus.CANCELED}>
                                    {t('order.status.canceled')}
                                  </MenuItem>
                                  <MenuItem
                                    value={OrderStatus.DELIVERED}
                                    disabled
                                  >
                                    {t('order.status.delivered')}
                                  </MenuItem>
                                  <MenuItem
                                    value={OrderStatus.REFUNDED}
                                    disabled
                                  >
                                    {t('order.status.refunded')}
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              t(prepareOrderStatusLabel(order.status))
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
                              {order.totalAmount
                                ? `${order.totalAmount} TL`
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(order?.createdAt)}
                          </TableCell>
                          <TableCell align="center">
                            {editingOrderId === order.id ? (
                              <Box
                                display="flex"
                                justifyContent="center"
                                gap={1}
                              >
                                <Tooltip title={t('save')} arrow>
                                  <IconButton
                                    onClick={() => handleSaveStatus(order)}
                                    disabled={updating}
                                    sx={{
                                      '&:hover': {
                                        background: theme.colors.success.lighter
                                      },
                                      color: theme.palette.success.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    {updating ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <CheckIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('cancel')} arrow>
                                  <IconButton
                                    onClick={handleCancelEdit}
                                    disabled={updating}
                                    sx={{
                                      '&:hover': {
                                        background: theme.colors.error.lighter
                                      },
                                      color: theme.palette.error.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Box
                                display="flex"
                                justifyContent="center"
                                gap={1}
                              >
                                <Can I="update" a="Order" ability={ability}>
                                  <Tooltip title={t('edit.status')} arrow>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(order);
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
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Can>
                                <Tooltip title={t('view.details')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetails(order);
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
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.order.found')}
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
                className="order-pagination"
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
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

export default OrdersTable;
