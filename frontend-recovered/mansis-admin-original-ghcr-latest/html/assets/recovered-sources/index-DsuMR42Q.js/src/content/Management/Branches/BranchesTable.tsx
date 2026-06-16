import React, { useState, ChangeEvent, useEffect, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
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
import BulkActions from '@/components/BulkActions';
import { Branch } from '@/types/Branch.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import StatusLabel from '@/components/StatusLabel';
import { Company } from '@/types/Company.interface';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import ImagePlaceholder from '@/components/images/ImagePlaceholder';
import { useNavigate } from 'react-router-dom';
import { setSelectedBranch } from '@/store/branchStore';
import BranchDialog from '@/components/modals/BranchDialog';
import NoDataFound from '@/components/NoDataFound';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getBranchStatusOptions } from '@/utils/statusOptions';

interface BranchesTableProps {
  companies?: Company[];
  branches: Branch[];
  loading: boolean;
  totalCount: number;
  onDeleteBranch?: (branchId: number) => void;
  onBulkDeleteBranches?: (
    branches: Branch[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    branches: Branch[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateBranch?: (
    branchId: number,
    updates: {
      status?: string;
      name?: string;
      companyId?: number;
      mapcode?: string;
      imageFile?: File;
    }
  ) => Promise<void>;
  onAddBranch?: (branch: {
    name: string;
    companyId: number;
    mapcode?: string;
    imageFile?: File | null;
  }) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  tableTitle?: string;
  hideAddButton?: boolean;
  addButtonText?: string;
  notApplyPadding?: boolean;
  customButtons?: any[];
  hideDeleteButton?: boolean;
  rowsPerPageOptions?: number[];
  limit?: number;
  hideColumns?: string[];
  onSelectedBranchesChange?: (branches: Branch[]) => void;
  hideStatusFilter?: boolean;
}

const BranchesTable = ({
  companies = [],
  branches,
  loading,
  totalCount,
  onDeleteBranch,
  onBulkDeleteBranches,
  onBulkUpdateStatus,
  onUpdateBranch,
  onAddBranch,
  onFilterChange,
  tableTitle,
  hideAddButton = false,
  addButtonText,
  notApplyPadding = false,
  customButtons = [],
  hideDeleteButton = false,
  rowsPerPageOptions = [10, 30, 50, 100],
  limit: initialLimit,
  hideColumns = [],
  onSelectedBranchesChange,
  hideStatusFilter = false
}: BranchesTableProps) => {
  const { isCompanyAdmin } = useUserViewMode();

  // Add 'company' to hideColumns if user is a company admin
  const effectiveHideColumns = isCompanyAdmin
    ? [...hideColumns, 'company'].filter(
        (value, index, self) => self.indexOf(value) === index
      )
    : hideColumns;

  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const selectedBulkActions = selectedBranches.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(initialLimit || 10);
  const ability = useContext(AbilityContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [filters, setFilters] = useState<Filters>({
    status: undefined,
    search: ''
  });

  // Status update dialog state
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedBranches, setStatusUpdateSelectedBranches] =
    useState<Branch[]>([]);

  const handleSelectAllBranches = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    setSelectedBranches(event.target.checked ? branches : []);
  };

  const handleSelectOneBranch = (
    event: ChangeEvent<HTMLInputElement>,
    branchId: number
  ): void => {
    event.stopPropagation();

    const branch = branches.find((u) => u.id === branchId);
    if (!branch) return;

    if (!selectedBranches.find((u) => u.id === branchId)) {
      setSelectedBranches((prevSelected) => [...prevSelected, branch]);
    } else {
      setSelectedBranches((prevSelected) =>
        prevSelected.filter((u) => u.id !== branchId)
      );
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setPage(newPage);
    onFilterChange({
      status: filters.status,
      search: filters.search,
      page: newPage,
      limit
    });
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newLimit = parseInt(event.target.value);
    setLimit(newLimit);
    setPage(0);
    onFilterChange({
      status: filters.status,
      search: filters.search,
      page: 0,
      limit: newLimit
    });
  };

  const handleBulkDelete = async (branches: Branch[]) => {
    return onBulkDeleteBranches?.(branches, () => {
      setSelectedBranches([]);
    });
  };

  const handleBulkStatusUpdate = (branches: Branch[]) => {
    setStatusUpdateSelectedBranches(branches);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedBranches.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedBranches, status, () => {
        setSelectedBranches([]);
        setStatusUpdateSelectedBranches([]);
      });
    }
  };

  const deleteButton = hideDeleteButton
    ? null
    : {
        label: 'delete',
        icon: <DeleteTwoTone />,
        color: 'error',
        onClick: handleBulkDelete,
        showCondition: ability.can(Action.Delete, 'Branch'),
        disabled: selectedBranches.length === 0,
        position: 'left',
        showConfirmDialog: true,
        confirmTitle: t('confirm.bulk.delete'),
        confirmMessage: t('confirm.bulk.delete.question'),
        variant: 'contained'
      };

  const statusUpdateButton = onBulkUpdateStatus
    ? ({
        label: 'change.status',
        icon: <EditTwoToneIcon />,
        color: 'primary',
        onClick: handleBulkStatusUpdate,
        showCondition: ability.can(Action.Update, 'Branch'),
        disabled: selectedBranches.length === 0,
        position: 'left',
        variant: 'contained'
      } as any)
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : []),
    ...customButtons
  ];

  const selectedSomeBranches =
    selectedBranches.length > 0 && selectedBranches.length < branches.length;
  const selectedAllBranches = selectedBranches.length === branches.length;
  const theme = useTheme();

  const handleSearch = debounce((value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value
    }));
    onFilterChange({
      status: filters.status,
      search: value,
      page: 0,
      limit
    });
    setPage(0);
  }, 500);
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
      id: 'name',
      label: t('name'),
      align: 'left'
    },
    {
      id: 'status',
      label: t('status'),
      align: 'center'
    },
    {
      id: 'company',
      label: t('company'),
      align: 'left'
    },
    {
      id: 'mapcode',
      label: t('mapcode'),
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
  ].filter((header) => !effectiveHideColumns.includes(header.id));

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

  const handleViewDetails = (branch: Branch) => {
    setSelectedBranch(branch);
    navigate(`/management/branches/${branch.id}`, { state: { branch } });
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Notify parent when selected branches change
  useEffect(() => {
    if (onSelectedBranchesChange) {
      onSelectedBranchesChange(selectedBranches);
    }
  }, [selectedBranches, onSelectedBranchesChange]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogBranch, setDialogBranch] = useState<Branch | null>(null);
  const [dialogError, setDialogError] = useState<string | undefined>(undefined);

  const handleAddClick = () => {
    setDialogBranch(null);
    setDialogOpen(true);
    setDialogError(undefined);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogBranch(null);
    setDialogError(undefined);
  };

  const handleDialogSave = async (branchData: {
    name: string;
    companyId: number;
    mapcode?: string;
    imageFile?: File | null;
  }) => {
    try {
      if (dialogBranch) {
        // Omit imageFile if it is null
        const { imageFile, ...rest } = branchData;
        const updateData = imageFile ? { ...rest, imageFile } : rest;
        await onUpdateBranch?.(dialogBranch.id, updateData);
      } else {
        await onAddBranch?.(branchData);
      }
      handleDialogClose();
    } catch (error: any) {
      setDialogError(error.message || 'Error saving branch');
    }
  };

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
              <Box flex={1} p={2} className="branch-bulk-actions">
                <BulkActions<Branch>
                  selected={selectedBranches}
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
                    className="branch-filters"
                  >
                    <FormControl sx={{ minWidth: 200, mr: 2 }}>
                      <OutlinedInput
                        placeholder={`${t('search')}...`}
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
                      <StatusFilter
                        value={filters.status}
                        onChange={(value) => {
                          setFilters((prev) => ({
                            ...prev,
                            status: value
                          }));

                          onFilterChange({
                            status: value,
                            search: filters.search,
                            page: 0,
                            limit
                          });
                        }}
                        minWidth={120}
                        size="small"
                      />
                    )}

                    {!hideAddButton && (
                      <Can I="create" a="Branch" ability={ability}>
                        <Button
                          startIcon={<Add />}
                          onClick={handleAddClick}
                          sx={{
                            minWidth: 140,
                            ml: 2
                          }}
                          variant="contained"
                          color="primary"
                          className="branch-add-button"
                        >
                          <Typography>
                            {addButtonText || t('new.branch')}
                          </Typography>
                        </Button>
                      </Can>
                    )}
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {tableTitle || t('branch.list')}
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
                        className="branch-refresh"
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
                            checked={selectedAllBranches}
                            indeterminate={selectedSomeBranches}
                            onChange={handleSelectAllBranches}
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
                  ) : branches.length > 0 ? (
                    branches.map((branch) => {
                      const isBranchSelected = selectedBranches.some(
                        (b) => b.id === branch.id
                      );

                      return (
                        <TableRow
                          hover
                          key={branch.id}
                          selected={isBranchSelected}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={handleSelectClick}
                          >
                            <Checkbox
                              color="primary"
                              checked={isBranchSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneBranch(event, branch.id)}
                              value={isBranchSelected}
                              onClick={handleSelectClick}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ mx: 0, px: 0 }}
                            className="branch-image"
                          >
                            {branch.file?.url ? (
                              <CustomImageComponent
                                imageUrl={branch.file.url}
                                alt={branch.name}
                                onClick={handleImageClick}
                                width={54}
                                height={54}
                              />
                            ) : (
                              <Tooltip title={t('edit.branch')} arrow>
                                <Box
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    setDialogBranch(branch);
                                    setDialogOpen(true);
                                    setDialogError(undefined);
                                  }}
                                >
                                  <ImagePlaceholder width={54} height={54} />
                                </Box>
                              </Tooltip>
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
                              {branch.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <StatusLabel status={branch?.status} />
                          </TableCell>
                          {!isCompanyAdmin && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {branch.company?.name}
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
                              {branch.mapcode ? branch.mapcode : '-'}
                            </Typography>
                          </TableCell>
                          {!effectiveHideColumns.includes('createdAt') && (
                            <TableCell>
                              {formatDateToDayMonthYearTime(branch?.createdAt)}
                            </TableCell>
                          )}
                          {!effectiveHideColumns.includes('updatedAt') && (
                            <TableCell>
                              {branch?.updatedAt
                                ? formatDateToDayMonthYearTime(branch.updatedAt)
                                : '-'}
                            </TableCell>
                          )}
                          {!effectiveHideColumns.includes('actions') && (
                            <TableCell
                              align="center"
                              className="branch-actions"
                            >
                              <Tooltip title={t('view.details')} arrow>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(branch);
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
                              <Can I="update" a="Branch" ability={ability}>
                                <Tooltip title={t('edit.branch')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDialogBranch(branch);
                                      setDialogOpen(true);
                                      setDialogError(undefined);
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
                              <Can I="delete" a="Branch" ability={ability}>
                                <Tooltip title={t('delete.branch')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteBranch?.(branch.id);
                                    }}
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
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.branch.found')}
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
                className="branch-pagination"
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
      <BranchDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        branch={dialogBranch}
        companies={companies}
        error={dialogError}
      />
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedBranches([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedBranches}
        statusOptions={getBranchStatusOptions()}
        title={t('bulk.status.update.branches.title')}
        description={t('bulk.status.update.branches.description')}
        itemDisplayProperty="name"
        currentStatusProperty="status"
      />
    </Container>
  );
};

export default BranchesTable;
