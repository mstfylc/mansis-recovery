import React, { useState, ChangeEvent, useContext } from 'react';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import {
  Box,
  Card,
  CardHeader,
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
  Button,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  BranchSubscriptionDetailed,
  SubscriptionStatus,
  AssignPlanData,
  UpdateSubscriptionData
} from '@/types/Licensing.interface';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';
import { Add, SearchOutlined } from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import StatusFilter from '@/components/filters/StatusFilter';
import AssignSubscriptionDialog from './dialogs/AssignSubscriptionDialog';
import ChangeSubscriptionDialog from './dialogs/ChangeSubscriptionDialog';

interface SubscriptionsTableProps {
  subscriptions: BranchSubscriptionDetailed[];
  loading: boolean;
  totalCount: number;
  onAssignPlan: (data: AssignPlanData) => Promise<void>;
  onChangePlan: (data: UpdateSubscriptionData) => Promise<void>;
  onCancelSubscription: (subscriptionId: number) => void;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const SubscriptionsTable = ({
  subscriptions,
  loading,
  totalCount,
  onAssignPlan,
  onChangePlan,
  onCancelSubscription,
  onFilterChange,
  rowsPerPageOptions = [10, 25, 50],
  pageKey
}: SubscriptionsTableProps) => {
  const { t } = useTranslation();
  const ability = useContext(AbilityContext);

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
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

  const { isSuperAdmin } = useUserViewMode();
  const canEdit = isSuperAdmin;

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<BranchSubscriptionDetailed | null>(null);

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

  const theme = useTheme();

  const handleChangeClick = (subscription: BranchSubscriptionDetailed) => {
    setCurrentSubscription(subscription);
    setChangeDialogOpen(true);
  };

  const handleChangePlanSubmit = async (data: UpdateSubscriptionData) => {
    await onChangePlan(data);
    setChangeDialogOpen(false);
    setCurrentSubscription(null);
  };

  const handleAssignPlanSubmit = async (data: AssignPlanData) => {
    await onAssignPlan(data);
    setAssignDialogOpen(false);
  };

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const getStatusColor = (
    status: SubscriptionStatus
  ): 'info' | 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case SubscriptionStatus.TRIALING:
        return 'info';
      case SubscriptionStatus.ACTIVE:
        return 'success';
      case SubscriptionStatus.PAST_DUE:
        return 'warning';
      case SubscriptionStatus.EXPIRED:
      case SubscriptionStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return '-';
    return `₺${Number(price).toLocaleString('tr-TR')}`;
  };

  const isActionDisabled = (status: SubscriptionStatus): boolean => {
    return status === SubscriptionStatus.CANCELLED;
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
          options={[
            {
              id: 'all',
              name: t('all')
            },
            {
              id: 'TRIALING',
              name: t('licensing.subscription.status.trialing')
            },
            {
              id: 'ACTIVE',
              name: t('licensing.subscription.status.active')
            },
            {
              id: 'PAST_DUE',
              name: t('licensing.subscription.status.past_due')
            },
            {
              id: 'EXPIRED',
              name: t('licensing.subscription.status.expired')
            },
            {
              id: 'CANCELLED',
              name: t('licensing.subscription.status.cancelled')
            }
          ]}
        />
      )
    }
  ];

  const tableHeaders = [
    {
      id: 'branch',
      label: t('branch.name'),
      align: 'left'
    },
    {
      id: 'company',
      label: t('company.name'),
      align: 'left'
    },
    {
      id: 'plan',
      label: t('licensing.plan.name'),
      align: 'left'
    },
    {
      id: 'status',
      label: t('licensing.subscription.status.label'),
      align: 'center'
    },
    {
      id: 'startDate',
      label: t('licensing.subscription.startDate'),
      align: 'left'
    },
    {
      id: 'endDate',
      label: t('licensing.subscription.endDate'),
      align: 'left'
    },
    {
      id: 'price',
      label: t('licensing.subscription.price'),
      align: 'left'
    },
    ...(canEdit
      ? [
          {
            id: 'actions',
            label: t('actions'),
            align: 'center' as const
          }
        ]
      : [])
  ];

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

                  {canEdit && (
                    <Can I="create" a="Subscription" ability={ability}>
                      <Button
                        startIcon={<Add />}
                        onClick={() => setAssignDialogOpen(true)}
                        sx={{
                          minWidth: 140,
                          ml: 2
                        }}
                        variant="contained"
                        color="primary"
                      >
                        <Typography>
                          {t('licensing.subscription.assign')}
                        </Typography>
                      </Button>
                    </Can>
                  )}
                </Box>
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {t('licensing.subscription.list')}
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
                  ) : subscriptions.length > 0 ? (
                    subscriptions.map((subscription) => {
                      const disabled = isActionDisabled(subscription.status);
                      return (
                        <TableRow hover key={subscription.id}>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {subscription.branch.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              noWrap
                            >
                              {subscription.branch.company.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              noWrap
                            >
                              {subscription.plan.displayName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={t(
                                `licensing.subscription.status.${subscription.status.toLowerCase()}`
                              )}
                              color={getStatusColor(subscription.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {formatDateToDayMonthYear(subscription.startDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {formatDateToDayMonthYear(subscription.endDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {formatPrice(
                                subscription.priceOverride ||
                                  subscription.plan.price
                              )}
                            </Typography>
                          </TableCell>
                          {canEdit && (
                            <TableCell align="center">
                              <Tooltip
                                title={
                                  disabled
                                    ? t(
                                        'licensing.subscription.action.disabled'
                                      )
                                    : t('licensing.subscription.change')
                                }
                                arrow
                              >
                                <span>
                                  <Can
                                    I="update"
                                    a="Subscription"
                                    ability={ability}
                                  >
                                    <IconButton
                                      sx={{
                                        '&:hover': {
                                          background:
                                            theme.colors.primary.lighter
                                        },
                                        color: theme.palette.primary.main
                                      }}
                                      color="inherit"
                                      size="small"
                                      onClick={() =>
                                        handleChangeClick(subscription)
                                      }
                                      disabled={disabled}
                                    >
                                      <EditTwoToneIcon fontSize="small" />
                                    </IconButton>
                                  </Can>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  disabled
                                    ? t(
                                        'licensing.subscription.action.disabled'
                                      )
                                    : t('licensing.subscription.cancel')
                                }
                                arrow
                              >
                                <span>
                                  <Can
                                    I="delete"
                                    a="Subscription"
                                    ability={ability}
                                  >
                                    <IconButton
                                      sx={{
                                        '&:hover': {
                                          background: theme.colors.error.lighter
                                        },
                                        color: theme.palette.error.main
                                      }}
                                      color="inherit"
                                      size="small"
                                      onClick={() =>
                                        onCancelSubscription(subscription.id)
                                      }
                                      disabled={disabled}
                                    >
                                      <DeleteTwoTone fontSize="small" />
                                    </IconButton>
                                  </Can>
                                </span>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('licensing.subscription.noData')}
                      colSpan={tableHeaders.length}
                    />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box p={2}>
              <TablePagination
                component="div"
                count={totalCount}
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

      {/* Assign Plan Dialog */}
      <AssignSubscriptionDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        onSubmit={handleAssignPlanSubmit}
      />

      {/* Change Plan Dialog */}
      <ChangeSubscriptionDialog
        open={changeDialogOpen}
        onClose={() => {
          setChangeDialogOpen(false);
          setCurrentSubscription(null);
        }}
        subscription={currentSubscription}
        onSubmit={handleChangePlanSubmit}
      />
    </Container>
  );
};

export default SubscriptionsTable;
