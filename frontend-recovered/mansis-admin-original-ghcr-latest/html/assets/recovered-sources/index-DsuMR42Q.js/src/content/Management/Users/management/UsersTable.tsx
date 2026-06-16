import React, { useState, ChangeEvent, useContext } from 'react';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import { useNavigate } from 'react-router-dom';
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
  Button,
  CircularProgress,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { User } from '@/types/User.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Role } from '@/enums/role';
import { UserStatus } from '@/enums/user-status';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import StatusLabel from '@/components/StatusLabel';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTranslation } from 'react-i18next';
import UserDialog from '@/components/modals/UserDialog';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import RoleFilter from '@/components/filters/RoleFilter';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getUserStatusOptions } from '@/utils/statusOptions';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import { useUserViewMode } from '@/hooks/useUserViewMode';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  totalCount: number;
  setShowNewUserDialog: (show: boolean) => void;
  onDeleteUser: (userId: number) => void;
  onBulkDeleteUsers: (users: User[], onSuccess?: () => void) => Promise<void>;
  onBulkUpdateStatus?: (
    users: User[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateUser: (userId: number, updates: Partial<User>) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const UsersTable = ({
  users,
  loading,
  totalCount,
  setShowNewUserDialog,
  onDeleteUser,
  onBulkDeleteUsers,
  onBulkUpdateStatus,
  onUpdateUser,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: UsersTableProps) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const selectedBulkActions = selectedUsers.length > 0;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ability = useContext(AbilityContext);

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
    handleBranchChange,
    handleCompanyChange,
    handleDateRangeChange,
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

  const { isSuperAdmin, isBranchAdmin, isAdminView } = useUserViewMode();

  // State for edit dialog
  const [editUserDialogOpen, setEditUserDialogOpen] = useState<boolean>(false);
  const [currentEditUser, setCurrentEditUser] = useState<User | null>(null);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  // Status update dialog state
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedUsers, setStatusUpdateSelectedUsers] = useState<
    User[]
  >([]);

  const handleSelectAllUsers = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelectedUsers(event.target.checked ? users : []);
  };

  const handleSelectOneUser = (
    _event: ChangeEvent<HTMLInputElement>,
    userId: number
  ): void => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (!selectedUsers.find((u) => u.id === userId)) {
      setSelectedUsers((prevSelected) => [...prevSelected, user]);
    } else {
      setSelectedUsers((prevSelected) =>
        prevSelected.filter((u) => u.id !== userId)
      );
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

  const handleBulkDelete = async (users: User[]) => {
    return onBulkDeleteUsers(users, () => {
      setSelectedUsers([]);
    });
  };

  const handleBulkStatusUpdate = (users: User[]) => {
    setStatusUpdateSelectedUsers(users);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedUsers.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedUsers, status, () => {
        setSelectedUsers([]);
        setStatusUpdateSelectedUsers([]);
      });
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'User'),
    disabled: selectedUsers.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('confirm.bulk.delete.question'),
    variant: 'contained'
  };

  const statusUpdateButton =
    onBulkUpdateStatus && ability.can(Action.Update, 'User')
      ? ({
          label: 'change.status',
          icon: <EditTwoToneIcon />,
          color: 'primary',
          onClick: handleBulkStatusUpdate,
          showCondition: ability.can(Action.Update, 'User'),
          disabled: selectedUsers.length === 0,
          position: 'left',
          variant: 'contained'
        } as BulkActionButtonConfig)
      : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : [])
  ];

  const selectedSomeUsers =
    selectedUsers.length > 0 && selectedUsers.length < users.length;
  const selectedAllUsers = selectedUsers.length === users.length;
  const theme = useTheme();

  const handleEditClick = (user: User) => {
    setCurrentEditUser(user);
    setEditUserDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditUserDialogOpen(false);
    setCurrentEditUser(null);
    setEditError(undefined);
  };

  const handleUpdateUser = async (userData: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    role: Role;
    status?: UserStatus;
    password?: string;
    companyId?: number;
    branchId?: number;
  }) => {
    if (!currentEditUser) return;
    try {
      await onUpdateUser(currentEditUser.id, userData);
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating user:', error);
      setEditError(t('error.updating.user'));
    }
  };

  const handleViewDetails = (userId: number) => {
    navigate(`/management/users/details/${userId}`);
  };

  // Handle role filter change
  const handleRoleChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      role: value,
      page: 0
    }));
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
          size="small"
        />
      )
    },
    {
      id: 'role',
      label: t('filters.role'),
      component: (
        <RoleFilter
          value={filters.role}
          onChange={handleRoleChange}
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
  if (isSuperAdmin || isBranchAdmin) {
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

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left',
      padding: 'checkbox'
    },
    {
      id: 'name',
      label: t('name'),
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
      id: 'status',
      label: t('status'),
      align: 'center'
    },
    {
      id: 'role',
      label: t('role'),
      align: 'left'
    },
    {
      id: 'createdAt',
      label: t('created.at'),
      align: 'left'
    },
    {
      id: 'updatedAt',
      label: t('updated.at'),
      align: 'left'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
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
            {selectedBulkActions && (
              <Box flex={1} p={2} className="user-bulk-actions">
                <BulkActions<User>
                  selected={selectedUsers}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                className="user-filters"
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

                    <Can I="create" a="User" ability={ability}>
                      <Button
                        className="user-add-button"
                        startIcon={<Add />}
                        onClick={() => setShowNewUserDialog(true)}
                        sx={{
                          minWidth: 140,
                          ml: 2
                        }}
                        variant="contained"
                        color="primary"
                      >
                        <Typography>{t('new.user')}</Typography>
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('user.list')}
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
                            checked={selectedAllUsers}
                            indeterminate={selectedSomeUsers}
                            onChange={handleSelectAllUsers}
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
                  ) : users.length > 0 ? (
                    users.map((user) => {
                      const isUserSelected = selectedUsers.some(
                        (u) => u.id === user.id
                      );
                      return (
                        <TableRow hover key={user.id} selected={isUserSelected}>
                          <TableCell
                            padding="checkbox"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              color="primary"
                              checked={isUserSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneUser(event, user.id)}
                              value={isUserSelected}
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
                              {user.name} {user.surname}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {user.email}
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
                                {user.userBranches &&
                                user.userBranches.length > 0
                                  ? user.userBranches.find((ub) => ub.isPrimary)
                                      ?.branch?.name ||
                                    user.userBranches[0]?.branch?.name
                                  : user.currentBranch?.name || '-'}
                              </Typography>
                              {isSuperAdmin && user.company?.name && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {user.company.name}
                                </Typography>
                              )}
                            </TableCell>
                          )}
                          <TableCell align="center">
                            <StatusLabel status={user?.status} />
                          </TableCell>
                          <TableCell>
                            {t(`roles.${user.role.toLowerCase()}`)}
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(user?.createdAt)}
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(user?.updatedAt)}
                          </TableCell>

                          <TableCell
                            className="user-actions"
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tooltip title={t('view.details')} arrow>
                              <IconButton
                                onClick={() => handleViewDetails(user.id)}
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
                            <Can I="update" a="User" ability={ability}>
                              <Tooltip title={t('edit.user')} arrow>
                                <IconButton
                                  onClick={() => handleEditClick(user)}
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
                            <Can I="delete" a="User" ability={ability}>
                              <Tooltip title={t('delete.user')} arrow>
                                <IconButton
                                  onClick={() => onDeleteUser(user.id)}
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.error.lighter
                                    },
                                    color: theme.palette.error.main
                                  }}
                                  color="inherit"
                                  size="small"
                                >
                                  <DeleteTwoTone fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.user.found')}
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
      <UserDialog
        open={editUserDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateUser}
        error={editError}
        user={currentEditUser}
      />
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedUsers([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedUsers}
        statusOptions={getUserStatusOptions()}
        title={t('bulk.status.update.users.title')}
        description={t('bulk.status.update.users.description')}
        itemDisplayProperty="name"
        currentStatusProperty="status"
      />
    </Container>
  );
};

export default UsersTable;
