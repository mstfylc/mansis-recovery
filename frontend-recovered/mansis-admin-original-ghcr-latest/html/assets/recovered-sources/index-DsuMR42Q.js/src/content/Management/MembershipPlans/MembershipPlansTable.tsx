import {
  ChangeEvent,
  useState,
  useEffect,
  MouseEvent,
  useContext
} from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TablePagination,
  Divider,
  Tooltip,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  FormControl,
  Checkbox,
  useTheme,
  Container,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SearchOutlined,
  RefreshTwoTone,
  EditTwoTone,
  DeleteTwoTone
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import LocationFilter from '@/components/filters/LocationFilter';
import StatusFilter from '@/components/filters/StatusFilter';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import NoDataFound from '@/components/NoDataFound';
import { MembershipPlan } from '@/types/MembershipPlan.interface';
import { Filters } from '@/types/Filters';
import { useTableFilters } from '@/hooks/useTableFilters';
import { debounce } from '@/utils/helpers';
import MembershipPlanDialog from './MembershipPlanDialog';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getMembershipPlanStatusOptions } from '@/utils/statusOptions';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';

interface MembershipPlansTableProps {
  membershipPlans: MembershipPlan[];
  loading: boolean;
  totalCount: number;
  onAddPlan: () => void;
  onDeletePlan: (plan: MembershipPlan) => void;
  onBulkDelete?: (plans: MembershipPlan[]) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  onBulkUpdateStatus?: (
    membershipPlans: MembershipPlan[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onRefreshData?: () => void;
  onShowSuccessMessage?: (message: string) => void;
  onSelectionChange?: (selectedPlans: MembershipPlan[]) => void;
  selectedPlans: MembershipPlan[];
  tableTitle?: string;
  hideAddButton?: boolean;
  addButtonText?: string;
  notApplyPadding?: boolean;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const MembershipPlansTable = ({
  membershipPlans,
  loading,
  totalCount,
  onAddPlan,
  onDeletePlan,
  onFilterChange,
  selectedPlans,
  onBulkDelete,
  onRefreshData,
  onShowSuccessMessage,
  onSelectionChange,
  tableTitle,
  hideAddButton = false,
  addButtonText,
  onBulkUpdateStatus,
  notApplyPadding = false,
  rowsPerPageOptions = [5, 10, 25, 50],
  pageKey
}: MembershipPlansTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);
  const [selectedMembershipPlans, setSelectedMembershipPlans] = useState<
    MembershipPlan[]
  >([]);
  const selectedBulkActions = selectedMembershipPlans.length > 0;
  const { isSuperAdmin, isBranchAdmin, isAdminView } = useUserViewMode();
  // Show location only in Admin View (not when viewing specific branch)
  const showLocationColumn = !isBranchAdmin && isAdminView;
  const canPerformActions =
    ability.can(Action.Update, 'MembershipPlan') ||
    ability.can(Action.Delete, 'MembershipPlan');

  // State for edit dialog
  const [editMembershipPlanDialogOpen, setEditMembershipPlanDialogOpen] =
    useState<boolean>(false);
  const [currentEditMembershipPlan, setCurrentEditMembershipPlan] =
    useState<MembershipPlan | null>(null);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelectedMembershipPlans(selectedPlans);
  }, [selectedPlans]);

  // Status update dialog state
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [
    statusUpdateSelectedMembershipPlans,
    setStatusUpdateSelectedMembershipPlans
  ] = useState<MembershipPlan[]>([]);

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
    handleBranchChange,
    handleCompanyChange,
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

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleSelectOneMembershipPlan = (
    _event: ChangeEvent<HTMLInputElement>,
    planId: number
  ): void => {
    const plan = membershipPlans.find((p) => p.id === planId);
    if (!plan) return;

    let newSelectedPlans: MembershipPlan[];
    if (!selectedPlans.find((p) => p.id === planId)) {
      newSelectedPlans = [...selectedPlans, plan];
    } else {
      newSelectedPlans = selectedPlans.filter((p) => p.id !== planId);
    }

    setSelectedMembershipPlans(newSelectedPlans);
    onSelectionChange?.(newSelectedPlans);
  };

  const handlePageChange = (
    _event: MouseEvent<HTMLButtonElement> | null,
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

  const handleBulkDelete = async (plans: MembershipPlan[]) => {
    if (onBulkDelete) {
      await onBulkDelete(plans);
      setSelectedMembershipPlans([]);
    }
  };

  const handleBulkStatusUpdate = (plans: MembershipPlan[]) => {
    setStatusUpdateSelectedMembershipPlans(plans);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedMembershipPlans.length > 0) {
      await onBulkUpdateStatus(
        statusUpdateSelectedMembershipPlans,
        status,
        () => {
          setSelectedMembershipPlans([]);
          setStatusUpdateSelectedMembershipPlans([]);
        }
      );
    }
  };

  const onEditPlan = (plan: MembershipPlan) => {
    setCurrentEditMembershipPlan(plan);
    setEditMembershipPlanDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditMembershipPlanDialogOpen(false);
    setCurrentEditMembershipPlan(null);
    setEditError(undefined);
  };

  const handleEditSuccess = () => {
    handleCloseEditDialog();
    onShowSuccessMessage?.(t('membership.plan.updated.successfully'));
    onRefreshData?.();
  };

  const handleCloseErrorSnackbar = () => {
    setEditError(undefined);
  };

  const handleSelectAllMembershipPlans = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const newSelectedPlans = event.target.checked ? membershipPlans : [];
    setSelectedMembershipPlans(newSelectedPlans);
    onSelectionChange?.(newSelectedPlans);
  };

  // Table headers configuration
  const tableHeaders = [
    {
      id: 'checkbox',
      key: 'checkbox',
      label: '',
      align: 'left' as const,
      padding: 'checkbox' as const
    },
    { key: 'name', label: t('membership.plan.name'), align: 'left' as const },
    {
      key: 'duration',
      label: t('membership.plan.duration.days'),
      align: 'center' as const
    },
    {
      key: 'validity',
      label: t('membership.plan.validity.days'),
      align: 'center' as const
    },
    { key: 'price', label: t('price'), align: 'left' as const },
    { key: 'status', label: t('status'), align: 'center' as const },
    {
      key: 'memberships',
      label: t('membership.plan.active.memberships'),
      align: 'center' as const
    },
    {
      key: 'createdAt',
      label: t('created.at'),
      align: 'center' as const
    },
    ...(showLocationColumn
      ? [{ key: 'location', label: t('location'), align: 'left' as const }]
      : []),
    ...(canPerformActions
      ? [{ key: 'actions', label: t('actions'), align: 'center' as const }]
      : [])
  ];

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'MembershipPlan'),
    disabled: selectedMembershipPlans.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('confirm.bulk.delete.question'),
    variant: 'contained'
  };

  const statusUpdateButton = onBulkUpdateStatus
    ? ({
        label: 'change.status',
        icon: <EditTwoTone />,
        color: 'primary',
        onClick: handleBulkStatusUpdate,
        showCondition: ability.can(Action.Update, 'MembershipPlan'),
        disabled: selectedMembershipPlans.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : [])
  ];

  // Selection state
  const selectedSomePlans =
    selectedPlans.length > 0 && selectedPlans.length < membershipPlans.length;
  const selectedAllPlans =
    selectedPlans.length === membershipPlans.length &&
    membershipPlans.length > 0;

  // Filter options for the popover
  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          size="small"
          options={[
            {
              id: 'all',
              name: t('all')
            },
            { id: 'ACTIVE', name: t('active') },
            { id: 'PASSIVE', name: t('passive') }
          ]}
        />
      )
    }
  ];

  // Add location filters based on user role
  filterOptions.push({
    id: 'location',
    label: t('filters.location'),
    component: (
      <LocationFilter
        companyId={filters.companyId ?? undefined}
        branchId={filters.branchId ?? undefined}
        onCompanyChange={(value) => handleCompanyChange(value)}
        onBranchChange={(value) => handleBranchChange(value)}
        size="small"
      />
    )
  });

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'success' : 'default';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        maxWidth: notApplyPadding ? '100%' : '90%',
        p: notApplyPadding ? 0 : undefined
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            {selectedBulkActions && (
              <Box flex={1} p={2}>
                <BulkActions<MembershipPlan>
                  selected={selectedPlans}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                action={
                  <Box display="flex" alignItems="center" gap={2}>
                    <FormControl sx={{ minWidth: 200 }}>
                      <OutlinedInput
                        size="small"
                        placeholder={`${t('search')}...`}
                        defaultValue={filters.search}
                        onChange={(e) => handleSearch(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        }
                      />
                    </FormControl>

                    <FilterPopover
                      filterOptions={filterOptions}
                      onApplyFilters={handleApplyFilters}
                      onResetFilters={handleResetFilters}
                      activeFiltersCount={getActiveFiltersCount()}
                    />

                    {!hideAddButton && (
                      <Can I="create" a="MembershipPlan" ability={ability}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={onAddPlan}
                        >
                          {addButtonText || t('membership.plan.add.new')}
                        </Button>
                      </Can>
                    )}
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {tableTitle || t('membership.plans.list')}
                    </Typography>
                    <Tooltip title={t('common.refresh')}>
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
                        <RefreshTwoTone fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            )}
            <Divider />

            {/* Table Container */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header) => (
                      <TableCell
                        key={header.key}
                        align={header.align}
                        padding={header.padding || 'normal'}
                      >
                        {header.key === 'checkbox' ? (
                          <Checkbox
                            color="primary"
                            checked={selectedAllPlans}
                            indeterminate={selectedSomePlans}
                            onChange={handleSelectAllMembershipPlans}
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
                  ) : membershipPlans.length > 0 ? (
                    membershipPlans.map((plan) => {
                      const isPlanSelected = selectedPlans.some(
                        (p) => p.id === plan.id
                      );
                      return (
                        <TableRow key={plan.id} hover selected={isPlanSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isPlanSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) =>
                                handleSelectOneMembershipPlan(event, plan.id)
                              }
                              value={isPlanSelected}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold">
                              {plan.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {plan.durationDays}
                          </TableCell>
                          <TableCell align="center">
                            {plan.validityDays}
                          </TableCell>
                          <TableCell align="left">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color="primary"
                            >
                              {formatCurrency(plan.price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={t(`${plan.status.toLowerCase()}.capital`)}
                              color={getStatusColor(plan.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="secondary">
                              {plan._count.memberships}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {formatDateToDayMonthYearTime(plan.createdAt)}
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
                                {plan.branch?.name || '-'}
                              </Typography>
                              {isSuperAdmin && plan.branch?.company?.name && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {plan.branch.company.name}
                                </Typography>
                              )}
                            </TableCell>
                          )}
                          {canPerformActions && (
                            <TableCell align="center">
                              <Box
                                display="flex"
                                gap={0.5}
                                justifyContent="center"
                              >
                                <Can
                                  I="update"
                                  a="MembershipPlan"
                                  ability={ability}
                                >
                                  <Tooltip title={t('edit')}>
                                    <IconButton
                                      size="small"
                                      onClick={() => onEditPlan(plan)}
                                      color="primary"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Can>
                                <Can
                                  I="delete"
                                  a="MembershipPlan"
                                  ability={ability}
                                >
                                  <Tooltip title={t('delete')}>
                                    <IconButton
                                      size="small"
                                      onClick={() => onDeletePlan(plan)}
                                      color="error"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Can>
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.membership.plans.found')}
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

      <MembershipPlanDialog
        open={editMembershipPlanDialogOpen}
        mode="edit"
        plan={currentEditMembershipPlan}
        branchId={filters.branchId ?? null}
        onClose={handleCloseEditDialog}
        onSuccess={handleEditSuccess}
      />

      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedMembershipPlans([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedMembershipPlans}
        statusOptions={getMembershipPlanStatusOptions()}
        title={t('bulk.status.update.membership.plans.title')}
        description={t('bulk.status.update.membership.plans.description')}
        itemDisplayProperty="name"
        currentStatusProperty="status"
      />

      <Snackbar
        open={!!editError}
        autoHideDuration={6000}
        onClose={handleCloseErrorSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseErrorSnackbar}
          severity="error"
          variant="filled"
        >
          {editError}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MembershipPlansTable;
