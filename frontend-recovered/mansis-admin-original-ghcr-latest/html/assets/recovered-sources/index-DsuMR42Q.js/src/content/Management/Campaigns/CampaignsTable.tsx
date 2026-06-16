import React, { useState, ChangeEvent, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
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
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { Campaign } from '@/types/Campaign.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import StatusLabel from '@/components/StatusLabel';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTranslation } from 'react-i18next';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import ImagePlaceholder from '@/components/images/ImagePlaceholder';
import { CampaignType } from '@/enums/campaign-type';
import { useNavigate } from 'react-router-dom';
import { setSelectedCampaign } from '@/store/campaignStore';
import CampaignTypeFilter from '@/components/filters/CampaignTypeFilter';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import CampaignDialog from '@/components/modals/CampaignDialog';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getCampaignStatusOptions } from '@/utils/statusOptions';

interface CampaignsTableProps {
  campaigns: Campaign[];
  loading: boolean;
  totalCount: number;
  onDeleteCampaign: (campaignId: number) => void;
  onBulkDeleteCampaigns: (
    campaigns: Campaign[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    campaigns: Campaign[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateCampaign: (
    campaignId: number,
    updates: {
      status?: string;
      title?: string;
      description?: string;
      startDateTime?: Date;
      endDateTime?: Date;
      imageFile?: File;
      discount?: number;
      bundlePrice?: number;
      bundleTotalCount?: number;
    }
  ) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  onSaveCampaign: (campaign: {
    title: string;
    description: string;
    discount: number;
    startDateTime: Date;
    endDateTime: Date;
    type: CampaignType;
    imageFile?: File | null;
    branchId: number;
    bundlePrice?: number;
    bundleTotalCount?: number;
    categoryId?: number;
  }) => Promise<void>;
  pageKey?: string;
}

const CampaignsTable = ({
  campaigns = [],
  loading,
  totalCount,
  onDeleteCampaign,
  onBulkDeleteCampaigns,
  onBulkUpdateStatus,
  onUpdateCampaign,
  onFilterChange,
  onSaveCampaign,
  pageKey
}: CampaignsTableProps) => {
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const selectedBulkActions = selectedCampaigns.length > 0;
  const [rowsPerPageOptions] = useState<number[]>([10, 30, 50, 100]);
  const ability = useContext(AbilityContext);
  const selectedSomeCampaigns =
    selectedCampaigns.length > 0 && selectedCampaigns.length < campaigns.length;
  const selectedAllCampaigns = selectedCampaigns.length === campaigns.length;
  const theme = useTheme();
  const navigate = useNavigate();
  const { isSuperAdmin, isCompanyAdmin, isAdminView } = useUserViewMode();

  const showCompanyColumn = isSuperAdmin;
  const showBranchColumn = (isSuperAdmin || isCompanyAdmin) && isAdminView;

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
      type: undefined,
      limit: 10,
      page: 0
    },
    onFilterChange,
    pageKey
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCampaign, setDialogCampaign] = useState<Campaign | null>(null);
  const [dialogError, setDialogError] = useState<string | undefined>(undefined);

  // Status update dialog state
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedCampaigns, setStatusUpdateSelectedCampaigns] =
    useState<Campaign[]>([]);

  const { t } = useTranslation();
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
      label: t('title'),
      align: 'left'
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
      id: 'status',
      label: t('status'),
      align: 'center'
    },
    {
      id: 'type',
      label: t('campaign.type'),
      align: 'center'
    },
    {
      id: 'discount',
      label: t('discount.percentage'),
      align: 'left'
    },
    {
      id: 'startDateTime',
      label: t('start.date'),
      align: 'left'
    },
    {
      id: 'endDateTime',
      label: t('end.date'),
      align: 'left'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
  ];

  const handleSelectAllCampaigns = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    setSelectedCampaigns(event.target.checked ? campaigns : []);
  };

  const handleSelectOneCampaign = (
    event: ChangeEvent<HTMLInputElement> | null,
    campaignId: number
  ): void => {
    if (event) {
      event.stopPropagation();
    }

    const campaign = campaigns.find((u) => u.id === campaignId);
    if (!campaign) return;

    if (!selectedCampaigns.find((u) => u.id === campaignId)) {
      setSelectedCampaigns((prevSelected) => [...prevSelected, campaign]);
    } else {
      setSelectedCampaigns((prevSelected) =>
        prevSelected.filter((u) => u.id !== campaignId)
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

  const handleBulkDelete = async (campaigns: Campaign[]) => {
    return onBulkDeleteCampaigns(campaigns, () => {
      setSelectedCampaigns([]);
    });
  };

  const handleBulkStatusUpdate = (campaigns: Campaign[]) => {
    setStatusUpdateSelectedCampaigns(campaigns);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedCampaigns.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedCampaigns, status, () => {
        setSelectedCampaigns([]);
        setStatusUpdateSelectedCampaigns([]);
      });
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'Campaign'),
    disabled: selectedCampaigns.length === 0,
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
        showCondition: ability.can(Action.Update, 'Campaign'),
        disabled: selectedCampaigns.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : [])
  ];

  const handleEditClick = (campaign: Campaign) => {
    setDialogCampaign(campaign);
    setDialogOpen(true);
    setDialogError(undefined);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogCampaign(null);
    setDialogError(undefined);
  };

  const handleDialogSave = async (campaignData: {
    title: string;
    description: string;
    discount: number;
    startDateTime: Date;
    endDateTime: Date;
    type: CampaignType;
    imageFile?: File | null;
    branchId: number;
    status?: string;
    bundlePrice?: number;
    bundleTotalCount?: number;
    categoryId?: number;
  }) => {
    try {
      if (dialogCampaign) {
        // Update existing campaign
        const { imageFile, ...rest } = campaignData;
        const updateData = imageFile ? { ...rest, imageFile } : rest;
        await onUpdateCampaign(dialogCampaign.id, updateData);
      } else {
        // Create new campaign
        await onSaveCampaign(campaignData);
      }
      handleDialogClose();
    } catch (error: any) {
      setDialogError(error.message || 'Error saving campaign');
    }
  };

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleCampaignTypeChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      type: value,
      page: 0
    }));
  };

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

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    navigate(`/management/campaigns/${campaign.id}`, { state: { campaign } });
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAddClick = () => {
    setDialogCampaign(null);
    setDialogOpen(true);
    setDialogError(undefined);
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
      id: 'type',
      label: t('campaign.type'),
      component: (
        <CampaignTypeFilter
          value={filters.type}
          onChange={handleCampaignTypeChange}
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
              <Box flex={1} p={2} className="campaign-bulk-actions">
                <BulkActions<Campaign>
                  selected={selectedCampaigns}
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
                    className="campaign-filters"
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

                    <Can I="create" a="Campaign" ability={ability}>
                      <Button
                        startIcon={<Add />}
                        onClick={() =>
                          navigate('/management/campaigns/batch-customer-data')
                        }
                        sx={{
                          ml: 2
                        }}
                        variant="outlined"
                        color="secondary"
                        className="campaign-batch-customer-data-button"
                      >
                        <Typography>{t('batch.customer.data')}</Typography>
                      </Button>
                    </Can>

                    <Can I="create" a="Campaign" ability={ability}>
                      <Button
                        startIcon={<Add />}
                        onClick={handleAddClick}
                        sx={{
                          ml: 1
                        }}
                        variant="contained"
                        color="primary"
                        className="campaign-add-button"
                      >
                        <Typography>{t('new.campaign')}</Typography>
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('campaign.list')}
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
                        className="campaign-refresh"
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
                            checked={selectedAllCampaigns}
                            indeterminate={selectedSomeCampaigns}
                            onChange={handleSelectAllCampaigns}
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
                  ) : campaigns.length > 0 ? (
                    campaigns.map((campaign) => {
                      const isCampaignSelected = selectedCampaigns.some(
                        (u) => u.id === campaign.id
                      );
                      return (
                        <TableRow
                          hover
                          key={campaign.id}
                          selected={isCampaignSelected}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={handleSelectClick}
                          >
                            <Checkbox
                              color="primary"
                              checked={isCampaignSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneCampaign(event, campaign.id)}
                              value={isCampaignSelected}
                              onClick={handleSelectClick}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ mx: 0, px: 0 }}
                            onClick={handleSelectClick}
                            className="campaign-image"
                          >
                            {campaign.file?.url ? (
                              <CustomImageComponent
                                imageUrl={campaign.file.url}
                                alt={campaign.title}
                                onClick={handleImageClick}
                                width={54}
                                height={54}
                              />
                            ) : (
                              <Tooltip title={t('edit.campaign')} arrow>
                                <Box onClick={() => handleEditClick(campaign)}>
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
                              {campaign.title}
                            </Typography>
                          </TableCell>

                          {(isSuperAdmin || isCompanyAdmin) &&
                            showBranchColumn && (
                              <TableCell>
                                <Typography
                                  variant="body1"
                                  fontWeight="bold"
                                  color="text.primary"
                                  gutterBottom
                                  noWrap
                                >
                                  {campaign.branch?.name || '-'}
                                </Typography>
                                {isSuperAdmin &&
                                  campaign.branch?.company?.name && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      noWrap
                                    >
                                      {campaign.branch.company.name}
                                    </Typography>
                                  )}
                              </TableCell>
                            )}

                          <TableCell align="center">
                            <StatusLabel status={campaign?.status} />
                          </TableCell>

                          <TableCell align="center">
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {(() => {
                                const translationKey = campaign.type
                                  .toLowerCase()
                                  .replace('_', '.');

                                return t(translationKey);
                              })()}
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
                              {campaign.discount || '-'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {formatDateToDayMonthYearTime(
                              campaign?.startDateTime
                            )}
                          </TableCell>
                          <TableCell>
                            {campaign?.endDateTime
                              ? formatDateToDayMonthYearTime(
                                  campaign.endDateTime
                                )
                              : '-'}
                          </TableCell>

                          <TableCell
                            align="center"
                            onClick={handleSelectClick}
                            className="campaign-actions"
                          >
                            <Tooltip title={t('view.details')} arrow>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(campaign);
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
                            <Can I="update" a="Campaign" ability={ability}>
                              <Tooltip title={t('edit.campaign')} arrow>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(campaign);
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
                            <Can I="delete" a="Campaign" ability={ability}>
                              <Tooltip title={t('delete.campaign')} arrow>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCampaign(campaign.id);
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
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.product.found')}
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
                className="campaign-pagination"
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
      <CampaignDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        campaign={dialogCampaign}
        error={dialogError}
      />
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedCampaigns([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedCampaigns}
        statusOptions={getCampaignStatusOptions()}
        title={t('bulk.status.update.campaigns.title')}
        description={t('bulk.status.update.campaigns.description')}
        itemDisplayProperty="title"
        currentStatusProperty="status"
      />
    </Container>
  );
};

export default CampaignsTable;
