import React, { useState, ChangeEvent, useEffect, useContext } from 'react';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
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
import { Category } from '@/types/Category.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { Add, SearchOutlined } from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import { CategoryStatus } from '@/enums/category-status';
import StatusLabel from '@/components/StatusLabel';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTranslation } from 'react-i18next';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import EditableImageCell from '@/components/images/EditableImageCell';
import { Role } from '@/enums/role';
import { user$ } from '@/store/userStore';
import { format } from 'date-fns';
import CategoryDialog from '@/components/modals/CategoryDialog';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getCategoryStatusOptions } from '@/utils/statusOptions';

interface CategoriesTableProps {
  categories: Category[];
  loading: boolean;
  totalCount: number;
  setShowNewCategoryDialog?: (show: boolean) => void;
  onDeleteCategory?: (categoryId: number) => void;
  onBulkDeleteCategories?: (
    categories: Category[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    categories: Category[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateCategory?: (
    categoryId: number,
    updates: {
      status?: CategoryStatus;
      name?: string;
      imageFile?: File;
      companyId?: number | null;
    }
  ) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  customActions?: (category: Category) => React.ReactNode | null;
  tableTitle?: string;
  hideAddButton?: boolean;
  addButtonText?: string;
  customButtons?: any[];
  hideDeleteButton?: boolean;
  notApplyPadding?: boolean;
  rowsPerPageOptions?: number[];
  limit?: number;
  hideColumns?: string[];
  onSelectedCategoriesChange?: (categories: Category[]) => void;
  hideStatusFilter?: boolean;
  pageKey?: string;
}

const CategoriesTable = ({
  categories = [],
  loading,
  totalCount,
  setShowNewCategoryDialog,
  onDeleteCategory,
  onBulkDeleteCategories,
  onBulkUpdateStatus,
  onUpdateCategory,
  onFilterChange,
  customActions,
  tableTitle,
  hideAddButton = false,
  addButtonText,
  customButtons = [],
  hideDeleteButton = false,
  notApplyPadding = false,
  rowsPerPageOptions = [10, 30, 50, 100],
  limit: initialLimit,
  hideColumns = [],
  onSelectedCategoriesChange,
  hideStatusFilter = false,
  pageKey
}: CategoriesTableProps) => {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const selectedBulkActions = selectedCategories.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(initialLimit || 10);
  const selectedSomeCategories =
    selectedCategories.length > 0 &&
    selectedCategories.length < categories.length;
  const selectedAllCategories = selectedCategories.length === categories.length;
  const theme = useTheme();
  const { t } = useTranslation();
  const ability = useContext(AbilityContext);
  const globalUserState = user$.get();
  const userRole = globalUserState.role;
  const isSuperAdmin = userRole === Role.SUPER_ADMIN;
  const currentBranch = globalUserState.currentBranch;
  const isAdminView = !currentBranch;
  const showLocationColumn = isSuperAdmin && isAdminView;

  // State for edit dialog
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] =
    useState<boolean>(false);
  const [currentEditCategory, setCurrentEditCategory] =
    useState<Category | null>(null);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  // Status update dialog state
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedCategories, setStatusUpdateSelectedCategories] =
    useState<Category[]>([]);

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleStatusChange,
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

  const handleSelectAllCategories = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedCategories(event.target.checked ? categories : []);
  };

  const handleSelectOneCategory = (
    _event: ChangeEvent<HTMLInputElement>,
    categoryId: number
  ): void => {
    const category = categories.find((u) => u.id === categoryId);
    if (!category) return;

    if (!selectedCategories.find((u) => u.id === categoryId)) {
      setSelectedCategories((prevSelected) => [...prevSelected, category]);
    } else {
      setSelectedCategories((prevSelected) =>
        prevSelected.filter((u) => u.id !== categoryId)
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

  const handleBulkDelete = async (categories: Category[]) => {
    return onBulkDeleteCategories?.(categories, () => {
      setSelectedCategories([]);
    });
  };

  const handleBulkStatusUpdate = (categories: Category[]) => {
    setStatusUpdateSelectedCategories(categories);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedCategories.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedCategories, status, () => {
        setSelectedCategories([]);
        setStatusUpdateSelectedCategories([]);
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
        showCondition: true,
        disabled: selectedCategories.length === 0,
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
        showCondition: true,
        disabled: selectedCategories.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : []),
    ...customButtons
  ];

  const handleEditClick = (category: Category) => {
    setCurrentEditCategory(category);
    setEditCategoryDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditCategoryDialogOpen(false);
    setCurrentEditCategory(null);
    setEditError(undefined);
  };

  const handleUpdateCategory = async (categoryData: {
    name: string;
    imageFile: File | null;
    companyId?: number;
    status?: CategoryStatus;
  }) => {
    if (!currentEditCategory) return;

    try {
      // Only include imageFile if it is a File (not null)
      const { imageFile, ...rest } = categoryData;
      const updateData = imageFile ? { ...rest, imageFile } : rest;
      await onUpdateCategory?.(currentEditCategory.id, updateData);
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating category:', error);
      setEditError(t('error.updating.category'));
    }
  };

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
    setPage(0);
  }, 500);

  // Define filter options for the popover
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

  if (showLocationColumn) {
    filterOptions.push({
      id: 'location',
      label: t('filters.location'),
      component: (
        <LocationFilter
          companyId={filters.companyId}
          onBranchChange={() => {}}
          onCompanyChange={handleCompanyChange}
          size="small"
          hideBranchFilter={true}
        />
      )
    });
  }

  // Define table headers based on role
  let tableHeaders = [
    { id: 'checkbox', label: '', align: 'left', padding: 'checkbox' },
    {
      id: 'image',
      label: t('image'),
      align: 'center'
    },
    { id: 'name', label: t('name'), align: 'left' },
    ...(showLocationColumn
      ? [
          {
            id: 'location',
            label: t('location'),
            align: 'left'
          }
        ]
      : [])
  ];
  // Add the rest of the columns
  tableHeaders = [
    ...tableHeaders,
    { id: 'status', label: t('status'), align: 'center' },
    {
      id: 'numberOfProductsUnderThisCategory',
      label: t('number.of.products'),
      align: 'center'
    },
    { id: 'createdAt', label: t('created.at'), align: 'left' },
    { id: 'actions', label: t('actions'), align: 'center' }
  ];

  // Apply any custom column hiding
  tableHeaders = tableHeaders.filter(
    (header) => !hideColumns.includes(header.id)
  );

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

  // Notify parent when selected categories change
  useEffect(() => {
    if (onSelectedCategoriesChange) {
      onSelectedCategoriesChange(selectedCategories);
    }
  }, [selectedCategories, onSelectedCategoriesChange]);

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
              <Box flex={1} p={2} className="category-bulk-actions">
                <BulkActions<Category>
                  selected={selectedCategories}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                className="category-filters"
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

                    {!hideStatusFilter && (
                      <FilterPopover
                        filterOptions={filterOptions}
                        onApplyFilters={handleApplyFilters}
                        onResetFilters={handleResetFilters}
                        activeFiltersCount={getActiveFiltersCount()}
                      />
                    )}

                    {!hideAddButton && (
                      <Button
                        sx={{ ml: 2 }}
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setShowNewCategoryDialog?.(true)}
                        className="category-add-button"
                      >
                        {addButtonText || t('new.category')}
                      </Button>
                    )}
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {tableTitle || t('category.list')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={() => {
                          onFilterChange({
                            status: filters.status,
                            search: filters.search,
                            page,
                            limit
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
                            checked={selectedAllCategories}
                            indeterminate={selectedSomeCategories}
                            onChange={handleSelectAllCategories}
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
                  ) : categories.length > 0 ? (
                    categories.map((category) => {
                      const isCategorySelected = selectedCategories.some(
                        (u) => u.id === category.id
                      );
                      return (
                        <TableRow
                          hover
                          key={category.id}
                          selected={isCategorySelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isCategorySelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneCategory(event, category.id)}
                              value={isCategorySelected}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ mx: 0, px: 0 }}>
                            <EditableImageCell
                              isEditing={false}
                              imageUrl={category.file?.url || null}
                              previewImageUrl={null}
                              entityName={category.name}
                              onImageEditClick={() => handleEditClick(category)}
                              onImageClick={handleImageClick}
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
                              {category.name}
                            </Typography>
                          </TableCell>

                          {showLocationColumn && (
                            <TableCell>
                              {isSuperAdmin && category.company?.name && (
                                <Typography variant="body2">
                                  {category.company.name}
                                </Typography>
                              )}
                            </TableCell>
                          )}

                          {!hideColumns.includes('status') && (
                            <TableCell align="center">
                              <StatusLabel status={category?.status} />
                            </TableCell>
                          )}

                          {!hideColumns.includes(
                            'numberOfProductsUnderThisCategory'
                          ) && (
                            <TableCell align="center">
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {category?.numberOfProductsUnderThisCategory}
                              </Typography>
                            </TableCell>
                          )}

                          {!hideColumns.includes('createdAt') && (
                            <TableCell>
                              {formatDateToDayMonthYearTime(
                                category?.createdAt
                              )}
                            </TableCell>
                          )}

                          {!hideColumns.includes('actions') && (
                            <TableCell
                              align="center"
                              className="category-actions"
                            >
                              {customActions ? (
                                customActions(category)
                              ) : (
                                <>
                                  <Can
                                    I="update"
                                    a="CompanyCategory"
                                    ability={ability}
                                  >
                                    <Tooltip title={t('edit.category')} arrow>
                                      <IconButton
                                        onClick={() =>
                                          handleEditClick(category)
                                        }
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
                                    a="CompanyCategory"
                                    ability={ability}
                                  >
                                    <Tooltip title={t('delete.category')} arrow>
                                      <IconButton
                                        onClick={() =>
                                          onDeleteCategory?.(category.id)
                                        }
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
                      message={t('no.category.found')}
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
                rowsPerPage={limit}
                rowsPerPageOptions={rowsPerPageOptions}
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
      <CategoryDialog
        open={editCategoryDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateCategory}
        error={editError}
        category={currentEditCategory}
      />
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedCategories([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedCategories}
        statusOptions={getCategoryStatusOptions()}
        title={t('bulk.status.update.categories.title')}
        description={t('bulk.status.update.categories.description')}
        itemDisplayProperty="name"
        currentStatusProperty="status"
      />
    </Container>
  );
};

export default CategoriesTable;
