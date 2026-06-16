import React, { useState, ChangeEvent, useEffect, useContext } from 'react';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
import { Action } from '@/types/permissions';
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
import { Activity } from '@/types/Activity.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import { ActivityStatus } from '@/enums/activity-status';
import StatusLabel from '@/components/StatusLabel';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTranslation } from 'react-i18next';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import EditableImageCell from '@/components/images/EditableImageCell';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getActivityStatusOptions } from '@/utils/statusOptions';
import { useNavigate } from 'react-router-dom';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import ActivityDialog from '@/components/modals/ActivityDialog';
import NoDataFound from '@/components/NoDataFound';

interface ActivitiesTableProps {
  activities: Activity[];
  loading: boolean;
  totalCount: number;
  setShowNewActivityDialog?: (show: boolean) => void;
  onDeleteActivity?: (activityId: number) => void;
  onBulkDeleteActivities?: (
    activities: Activity[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    activities: Activity[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateActivity?: (
    activityId: number,
    updates: {
      status?: ActivityStatus;
      title?: string;
      description?: string;
      imageFile?: File | null;
      branchId?: number;
    }
  ) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  customActions?: (activity: Activity) => React.ReactNode | null;
  tableTitle?: string;
  hideAddButton?: boolean;
  customButtons?: any[];
  hideDeleteButton?: boolean;
  addButtonText?: string;
  notApplyPadding?: boolean;
  rowsPerPageOptions?: number[];
  limit?: number;
  hideColumns?: string[];
  onSelectedActivitiesChange?: (activities: Activity[]) => void;
  hideStatusFilter?: boolean;
  pageKey?: string;
}

// Filter options for the popover
const getFilterOptions = (
  filters: Filters,
  handleStatusChange: (value: string | undefined) => void,
  handleDateRangeChange: (
    startDate?: string,
    endDate?: string,
    timezone?: string
  ) => void,
  handleBranchChange: (value: number | undefined) => void,
  handleCompanyChange: (value: number | undefined) => void,
  hideStatusFilter: boolean,
  t: any
): FilterOption[] => {
  const filterOptions: FilterOption[] = [];

  if (!hideStatusFilter) {
    filterOptions.push({
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          size="small"
        />
      )
    });
  }

  filterOptions.push({
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
  });

  // Add location filter
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

  return filterOptions;
};

const ActivitiesTable = ({
  activities = [],
  loading,
  totalCount,
  setShowNewActivityDialog,
  onDeleteActivity,
  onBulkDeleteActivities,
  onBulkUpdateStatus,
  onUpdateActivity,
  onFilterChange,
  customActions,
  tableTitle,
  hideAddButton = false,
  customButtons = [],
  hideDeleteButton = false,
  addButtonText,
  notApplyPadding = false,
  rowsPerPageOptions = [10, 30, 50, 100],
  limit: initialLimit,
  hideColumns = [],
  onSelectedActivitiesChange,
  hideStatusFilter = false,
  pageKey
}: ActivitiesTableProps) => {
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  const selectedBulkActions = selectedActivities.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(initialLimit || 10);
  const ability = useContext(AbilityContext);
  const selectedSomeActivities =
    selectedActivities.length > 0 &&
    selectedActivities.length < activities.length;
  const selectedAllActivities = selectedActivities.length === activities.length;
  const theme = useTheme();
  const navigate = useNavigate();

  const [editActivityDialogOpen, setEditActivityDialogOpen] =
    useState<boolean>(false);
  const [currentEditActivity, setCurrentEditActivity] =
    useState<Activity | null>(null);
  const [editError, setEditError] = useState<string | undefined>(undefined);
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedActivities, setStatusUpdateSelectedActivities] =
    useState<Activity[]>([]);

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
      limit: initialLimit || 10,
      page: 0
    },
    onFilterChange,
    pageKey
  });
  const { t } = useTranslation();

  // Get user view mode using the new pattern
  const { isAdminView, isSuperAdmin, isCompanyAdmin } = useUserViewMode();

  // Filter options for the popover
  const filterOptions = getFilterOptions(
    filters,
    handleStatusChange,
    handleDateRangeChange,
    handleBranchChange,
    handleCompanyChange,
    hideStatusFilter,
    t
  );

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
      id: 'image',
      label: t('image'),
      align: 'center'
    },
    {
      id: 'title',
      label: t('name'),
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
      align: 'center'
    }
  ].filter((header) => !hideColumns.includes(header.id));

  const handleSelectAllActivities = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedActivities(event.target.checked ? activities : []);
  };

  const handleSelectOneActivity = (
    _event: ChangeEvent<HTMLInputElement> | null,
    activityId: number
  ): void => {
    const activity = activities.find((u) => u.id === activityId);
    if (!activity) return;

    if (!selectedActivities.find((u) => u.id === activityId)) {
      setSelectedActivities((prevSelected) => [...prevSelected, activity]);
    } else {
      setSelectedActivities((prevSelected) =>
        prevSelected.filter((u) => u.id !== activityId)
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

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
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

  const handleBulkDelete = async (activities: Activity[]) => {
    return onBulkDeleteActivities?.(activities, () => {
      setSelectedActivities([]);
    });
  };

  const handleBulkStatusUpdate = (activities: Activity[]) => {
    setStatusUpdateSelectedActivities(activities);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedActivities.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedActivities, status, () => {
        setSelectedActivities([]);
        setStatusUpdateSelectedActivities([]);
      });
    }
  };

  const deleteButton = hideDeleteButton
    ? null
    : ({
        label: 'delete',
        icon: <DeleteTwoTone />,
        color: 'error',
        onClick: handleBulkDelete,
        showCondition: ability.can(Action.Delete, 'Activity'),
        disabled: selectedActivities.length === 0,
        position: 'left',
        showConfirmDialog: true,
        confirmTitle: t('confirm.bulk.delete'),
        confirmMessage: t('confirm.bulk.delete.question'),
        variant: 'contained'
      } as BulkActionButtonConfig);

  const statusUpdateButton = onBulkUpdateStatus
    ? ({
        label: 'change.status',
        icon: <EditTwoToneIcon />,
        color: 'primary',
        onClick: handleBulkStatusUpdate,
        showCondition: ability.can(Action.Update, 'Activity'),
        disabled: selectedActivities.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : []),
    ...customButtons
  ];

  const handleEditClick = (activity: Activity) => {
    setCurrentEditActivity(activity);
    setEditActivityDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditActivityDialogOpen(false);
    setCurrentEditActivity(null);
    setEditError(undefined);
  };

  const handleUpdateActivity = async (activityData: {
    title: string;
    description?: string;
    branchId: number;
    imageFile?: File | null;
    status?: ActivityStatus;
  }) => {
    if (!currentEditActivity) return;

    try {
      await onUpdateActivity?.(currentEditActivity.id, activityData);
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating activity:', error);
      setEditError(t('error.updating.activity'));
    }
  };

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
    setPage(0);
  }, 500);

  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const handleImageClick = (imageUrl: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewModalOpen(true);
    }
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  const handleViewDetails = (activity: Activity) => {
    navigate(`/management/activities/${activity.id}`, { state: { activity } });
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Notify parent when selected activities change
  useEffect(() => {
    if (onSelectedActivitiesChange) {
      onSelectedActivitiesChange(selectedActivities);
    }
  }, [selectedActivities, onSelectedActivitiesChange]);

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        maxWidth: notApplyPadding ? '100%' : '90%',
        p: notApplyPadding ? 0 : undefined
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
              <Box flex={1} p={2} className="activity-bulk-actions">
                <BulkActions<Activity>
                  selected={selectedActivities}
                  buttons={allButtons}
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
                    className="activity-filters"
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

                    {!hideAddButton && (
                      <Can I="create" a="Activity" ability={ability}>
                        <Button
                          sx={{ ml: 2 }}
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setShowNewActivityDialog?.(true)}
                          className="activity-add-button"
                        >
                          {addButtonText || t('new.activity')}
                        </Button>
                      </Can>
                    )}
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {tableTitle || t('activity.list')}
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
                        className="activity-refresh"
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
                            checked={selectedAllActivities}
                            indeterminate={selectedSomeActivities}
                            onChange={handleSelectAllActivities}
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
                  ) : activities.length > 0 ? (
                    activities.map((activity) => {
                      const isActivitySelected = selectedActivities.some(
                        (u) => u.id === activity.id
                      );
                      return (
                        <TableRow
                          hover
                          key={activity.id}
                          selected={isActivitySelected}
                          className="activity-row"
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={handleSelectClick}
                          >
                            <Checkbox
                              color="primary"
                              checked={isActivitySelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
                                event.stopPropagation();
                                handleSelectOneActivity(event, activity.id);
                              }}
                              value={isActivitySelected}
                              onClick={handleSelectClick}
                            />
                          </TableCell>
                          {!hideColumns.includes('image') && (
                            <TableCell
                              align="center"
                              sx={{ mx: 0, px: 0 }}
                              className="activity-image"
                            >
                              <EditableImageCell
                                isEditing={false}
                                imageUrl={activity.file?.url || null}
                                entityName={activity.title}
                                onImageEditClick={() => {
                                  handleEditClick(activity);
                                }}
                                onImageClick={(url) => {
                                  handleImageClick(url);
                                }}
                              />
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
                              {activity.title}
                            </Typography>
                          </TableCell>

                          {!hideColumns.includes('status') && (
                            <TableCell align="center">
                              <StatusLabel status={activity?.status} />
                            </TableCell>
                          )}

                          {(showBranchColumn || showCompanyColumn) &&
                            !hideColumns.includes('location') && (
                              <TableCell>
                                <Typography
                                  variant="body1"
                                  fontWeight="bold"
                                  color="text.primary"
                                  gutterBottom
                                  noWrap
                                >
                                  {activity?.branch?.name || '-'}
                                </Typography>
                                {showCompanyColumn &&
                                  activity?.branch?.company?.name && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      noWrap
                                    >
                                      {activity.branch.company.name}
                                    </Typography>
                                  )}
                              </TableCell>
                            )}

                          {!hideColumns.includes('createdAt') && (
                            <TableCell>
                              {formatDateToDayMonthYearTime(
                                activity?.createdAt
                              )}
                            </TableCell>
                          )}
                          {!hideColumns.includes('actions') && (
                            <TableCell
                              align="center"
                              onClick={handleSelectClick}
                              className="activity-actions"
                            >
                              {customActions ? (
                                customActions(activity)
                              ) : (
                                <>
                                  <Tooltip title={t('view.details')} arrow>
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(activity);
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
                                  <Can
                                    I="update"
                                    a="Activity"
                                    ability={ability}
                                  >
                                    <Tooltip title={t('edit.activity')} arrow>
                                      <IconButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditClick(activity);
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
                                        <EditTwoToneIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Can>
                                  <Can
                                    I="delete"
                                    a="Activity"
                                    ability={ability}
                                  >
                                    <Tooltip title={t('delete.activity')} arrow>
                                      <IconButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteActivity?.(activity.id);
                                        }}
                                        sx={{
                                          '&:hover': {
                                            background:
                                              theme.colors.error.lighter
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
                                </>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.activity.found')}
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
                className="activity-pagination"
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
      <ImagePreviewModal
        open={previewModalOpen}
        imageUrl={previewImageUrl}
        onClose={handleClosePreviewModal}
      />
      <ActivityDialog
        open={editActivityDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateActivity}
        error={editError}
        activity={currentEditActivity}
      />
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedActivities([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedActivities}
        statusOptions={getActivityStatusOptions()}
        title={t('bulk.status.update.activities.title')}
        description={t('bulk.status.update.activities.description')}
        itemDisplayProperty="title"
        currentStatusProperty="status"
      />
    </Container>
  );
};

export default ActivitiesTable;
