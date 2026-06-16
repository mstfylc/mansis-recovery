import React, { useState, ChangeEvent, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import { debounce, preparePurchaseTypeLabel } from '@/utils/helpers';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import { MoneyOff, CardMembership } from '@mui/icons-material';
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
  // Button,
  Tooltip,
  IconButton,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  Button
} from '@mui/material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';

import { Membership } from '@/types/Membership.interface';
import { PurchaseType } from '@/enums/purchase-type';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import NoDataFound from '@/components/NoDataFound';
import { Add, SearchOutlined } from '@mui/icons-material';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import MembershipDialog from '@/components/modals/MembershipDialog';
import ExtendMembershipDialog from '@/components/modals/ExtendMembershipDialog';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';

interface MembershipsTableProps {
  memberships: Membership[];
  loading: boolean;
  totalCount: number;
  onDeleteMembership: (membershipId: number) => void;
  onBulkDeleteMemberships: (
    memberships: Membership[],
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateMembership: (
    membershipId: number,
    updates: Partial<Membership>
  ) => Promise<void>;
  onCreateMembership: (membership: {
    startDate: Date;
    endDate: Date;
    userId?: number;
    branchId?: number;
    membershipPlanId?: number;
    remainingDayCount?: number;
    purchaseType?: PurchaseType;
  }) => Promise<void>;
  onExtendMembership?: () => void;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const MembershipsTable = ({
  memberships,
  loading,
  totalCount,
  onFilterChange,
  onDeleteMembership,
  onBulkDeleteMemberships,
  onUpdateMembership,
  onCreateMembership,
  onExtendMembership,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: MembershipsTableProps) => {
  const [selectedMemberships, setSelectedMemberships] = useState<Membership[]>(
    []
  );
  const selectedBulkActions = selectedMemberships.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const ability = useContext(AbilityContext);
  const canPerformActions =
    ability.can(Action.Update, 'Membership') ||
    ability.can(Action.Delete, 'Membership');

  const { t } = useTranslation();

  const { isBranchAdmin, isAdminView } = useUserViewMode();
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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [membershipToExtend, setMembershipToExtend] =
    useState<Membership | null>(null);

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
    }
  ];

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left',
      padding: 'checkbox'
    },
    {
      id: 'name',
      label: t('customer.name')
    },
    {
      id: 'processedBy',
      label: t('processed.by')
    },
    {
      id: 'remainingDayCount',
      label: t('remaining.days')
    },
    {
      id: 'membershipPlan',
      label: t('plan')
    },
    ...(!isBranchAdmin && isAdminView
      ? [
          {
            id: 'processedIn',
            label: t('location')
          }
        ]
      : []),
    {
      id: 'purchaseType',
      label: t('purchase.type')
    },
    {
      id: 'startDate',
      label: t('start.date')
    },
    {
      id: 'endDate',
      label: t('end.date')
    },
    {
      id: 'createdAt',
      label: t('created.at')
    },
    ...(canPerformActions
      ? [
          {
            id: 'actions',
            label: t('actions'),
            align: 'center'
          }
        ]
      : [])
  ];

  const handleSelectAllMemberships = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    setSelectedMemberships(event.target.checked ? memberships : []);
  };

  const handleSelectOneMembership = (
    event: ChangeEvent<HTMLInputElement>,
    membershipId: number
  ): void => {
    event.stopPropagation();

    const membership = memberships.find((u) => u.id === membershipId);
    if (!membership) return;

    if (!selectedMemberships.find((u) => u.id === membershipId)) {
      setSelectedMemberships((prevSelected) => [...prevSelected, membership]);
    } else {
      setSelectedMemberships((prevSelected) =>
        prevSelected.filter((u) => u.id !== membershipId)
      );
    }
  };

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

  const handleLimitChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const newLimit = parseInt(event.target.value);
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

  const selectedSomeMemberships =
    selectedMemberships.length > 0 &&
    selectedMemberships.length < memberships.length;
  const selectedAllMemberships =
    selectedMemberships.length === memberships.length;
  const theme = useTheme();

  const handleBulkDelete = async (memberships: Membership[]) => {
    return onBulkDeleteMemberships(memberships, () => {
      setSelectedMemberships([]);
    });
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'refund',
    icon: <MoneyOff />,
    color: 'warning',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'Membership'),
    disabled: selectedMemberships.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.refund'),
    confirmMessage: t('confirm.bulk.refund.question'),
    variant: 'contained'
  };

  const buttons = [deleteButton];

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
    setPage(0);
  }, 500);

  const handleEditClick = (membership: Membership) => {
    setSelectedMembership(membership);
    setEditDialogOpen(true);
  };

  const handleExtendClick = (membership: Membership) => {
    setMembershipToExtend(membership);
    setExtendDialogOpen(true);
  };

  const handleExtendDialogClose = () => {
    setExtendDialogOpen(false);
    setMembershipToExtend(null);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedMembership(null);
    setEditError(undefined);
  };

  const handleEditSave = async (formData: {
    startDate: Date;
    endDate: Date;
    name?: string;
    branchId?: number;
    remainingDayCount?: number;
  }) => {
    if (!selectedMembership) return;

    try {
      const updatesToSave: Partial<Membership> = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        ...(formData.remainingDayCount !== undefined && {
          remainingDayCount: formData.remainingDayCount
        })
      };

      await onUpdateMembership(selectedMembership.id, updatesToSave);
      handleEditDialogClose();
    } catch (error) {
      console.error('Error updating membership:', error);
    }
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setCreateError(undefined);
  };

  const handleCreateSave = async (formData: {
    startDate: Date;
    endDate: Date;
    userId?: number;
    branchId?: number;
    membershipPlanId?: number;
    remainingDayCount?: number;
    purchaseType?: PurchaseType;
  }) => {
    try {
      await onCreateMembership(formData);
      handleCreateDialogClose();
    } catch (error) {
      console.error('Error creating membership:', error);
      setCreateError(t('membership.create.error.message'));
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
              <Box flex={1} p={2} className="membership-bulk-actions">
                <BulkActions<Membership>
                  selected={selectedMemberships}
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
                    className="membership-filters"
                  >
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

                    <Can I="create" a="Membership" ability={ability}>
                      <Button
                        startIcon={<Add />}
                        onClick={handleCreateClick}
                        sx={{
                          minWidth: 140,
                          ml: 'auto'
                        }}
                        variant="contained"
                        color="primary"
                      >
                        <Typography>{t('new.membership')}</Typography>
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('membership.list')}
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
                        className="membership-refresh"
                      >
                        <RefreshTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            )}
            <Divider />
            <TableContainer data-testid="memberships-table">
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
                            checked={selectedAllMemberships}
                            indeterminate={selectedSomeMemberships}
                            onChange={handleSelectAllMemberships}
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
                  ) : memberships.length > 0 ? (
                    memberships.map((membership) => {
                      const isMembershipSelected = selectedMemberships.some(
                        (u) => u.id === membership.id
                      );
                      return (
                        <TableRow
                          hover
                          key={membership.id}
                          selected={isMembershipSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isMembershipSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) =>
                                handleSelectOneMembership(event, membership.id)
                              }
                              value={isMembershipSelected}
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
                              {membership?.user?.name}{' '}
                              {membership?.user?.surname}
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
                              {membership.employee
                                ? `${membership.employee?.name} ${membership.employee?.surname}`
                                : '-'}
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
                              {membership.remainingDayCount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {membership?.membershipPlan?.name || '-'}
                            </Typography>
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
                                {membership?.branch?.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {membership?.branch?.company?.name}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              noWrap
                            >
                              {(membership.purchaseType ??
                              membership.paymentAttempt?.type)
                                ? t(
                                    preparePurchaseTypeLabel(
                                      (membership.purchaseType ??
                                        membership.paymentAttempt
                                          ?.type) as string
                                    )
                                  )
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(
                              membership?.startDate
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(membership?.endDate)}
                          </TableCell>

                          <TableCell>
                            {formatDateToDayMonthYearTime(
                              membership?.createdAt
                            )}
                          </TableCell>

                          {canPerformActions && (
                            <TableCell
                              align="center"
                              className="membership-actions"
                            >
                              <Can I="update" a="Membership" ability={ability}>
                                <Tooltip title={t('membership.extend')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExtendClick(membership);
                                    }}
                                    sx={{
                                      '&:hover': {
                                        background: theme.colors.primary.lighter
                                      },
                                      color: theme.palette.primary.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    <CardMembership fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('edit.membership')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(membership);
                                    }}
                                    sx={{
                                      '&:hover': {
                                        background: theme.colors.primary.lighter
                                      },
                                      color: theme.palette.primary.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    <EditTwoToneIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Can>
                              <Can I="delete" a="Membership" ability={ability}>
                                <Tooltip title={t('refund')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteMembership(membership.id);
                                    }}
                                    sx={{
                                      '&:hover': {
                                        background: theme.colors.warning.lighter
                                      },
                                      color: theme.palette.warning.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    <MoneyOff fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Can>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.membership.found')}
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
                className="membership-pagination"
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      <MembershipDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        onSave={handleEditSave}
        membership={selectedMembership}
        error={editError}
      />

      <MembershipDialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        onSave={handleCreateSave}
        membership={null}
        error={createError}
      />

      <ExtendMembershipDialog
        open={extendDialogOpen}
        onClose={handleExtendDialogClose}
        membership={membershipToExtend}
        onSuccess={() => {
          onExtendMembership?.();
        }}
      />
    </Container>
  );
};

export default MembershipsTable;
