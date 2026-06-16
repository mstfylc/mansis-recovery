import React, { useState, ChangeEvent, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import QrCode2Icon from '@mui/icons-material/QrCode2';
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
  InputAdornment,
  Chip
} from '@mui/material';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { VoucherTemplate } from '@/types/Voucher.interface';
import { Add, SearchOutlined } from '@mui/icons-material';
import GroupIcon from '@mui/icons-material/Category';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import StatusLabel from '@/components/StatusLabel';
import { useTranslation } from 'react-i18next';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import StatusFilter from '@/components/filters/StatusFilter';
import LocationFilter from '@/components/filters/LocationFilter';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';
import { getRewardTypeLabel, getRewardTypeColor } from '@/utils/voucherHelpers';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import PromoCodesDialog from './PromoCodesDialog';

interface VoucherTemplatesTableProps {
  templates: VoucherTemplate[];
  loading: boolean;
  totalCount: number;
  onDeleteTemplate: (template: VoucherTemplate) => void;
  onBulkDeleteTemplates?: (
    templates: VoucherTemplate[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    templates: VoucherTemplate[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onOpenAddDialog: () => void;
  onOpenEditDialog: (template: VoucherTemplate) => void;
  onFilterChange: (filters: Filters) => void;
  pageKey?: string;
}

const VoucherTemplatesTable = ({
  templates = [],
  loading,
  totalCount,
  onDeleteTemplate,
  onBulkDeleteTemplates,
  onBulkUpdateStatus,
  onOpenAddDialog,
  onOpenEditDialog,
  onFilterChange,
  pageKey
}: VoucherTemplatesTableProps) => {
  const [selectedTemplates, setSelectedTemplates] = useState<VoucherTemplate[]>(
    []
  );
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedTemplates, setStatusUpdateSelectedTemplates] =
    useState<VoucherTemplate[]>([]);
  const [promoDialogTemplate, setPromoDialogTemplate] =
    useState<VoucherTemplate | null>(null);
  const selectedBulkActions = selectedTemplates.length > 0;
  const [rowsPerPageOptions] = useState<number[]>([10, 30, 50, 100]);
  const ability = useContext(AbilityContext);
  const selectedSomeTemplates =
    selectedTemplates.length > 0 && selectedTemplates.length < templates.length;
  const selectedAllTemplates = selectedTemplates.length === templates.length;
  const theme = useTheme();

  const canManageLoyalty = ability.can(Action.Manage, 'Loyalty');

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

  const { t } = useTranslation();

  const { isAdminView, isSuperAdmin, isCompanyAdmin } = useUserViewMode();

  const showCompanyColumn = isSuperAdmin;
  const showBranchColumn = (isSuperAdmin || isCompanyAdmin) && isAdminView;

  const tableHeaders = [
    { id: 'checkbox', label: '', align: 'left', padding: 'checkbox' },
    { id: 'name', label: t('name'), align: 'left' },
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
      id: 'triggerProduct',
      label: t('voucher.trigger.product'),
      align: 'center'
    },
    { id: 'rewardType', label: t('voucher.reward.type'), align: 'center' },
    { id: 'reward', label: t('voucher.reward'), align: 'center' },
    { id: 'validity', label: t('validity'), align: 'center' },
    { id: 'usage', label: t('usage'), align: 'center' },
    { id: 'status', label: t('status'), align: 'center' },
    ...(canManageLoyalty
      ? [{ id: 'actions', label: t('actions'), align: 'center' }]
      : [])
  ];

  // Selection handlers
  const handleSelectAllTemplates = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    setSelectedTemplates(event.target.checked ? templates : []);
  };

  const handleSelectOneTemplate = (
    event: ChangeEvent<HTMLInputElement> | null,
    templateId: number
  ): void => {
    if (event) event.stopPropagation();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    if (!selectedTemplates.find((t) => t.id === templateId)) {
      setSelectedTemplates((prev) => [...prev, template]);
    } else {
      setSelectedTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    onFilterChange({ ...filters, page: newPage });
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newLimit = parseInt(event.target.value);
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 0 }));
    onFilterChange({ ...filters, page: 0, limit: newLimit });
  };

  const handleBulkDelete = async (items: VoucherTemplate[]) => {
    if (onBulkDeleteTemplates) {
      return onBulkDeleteTemplates(items, () => {
        setSelectedTemplates([]);
      });
    }
  };

  const handleBulkStatusUpdate = (templates: VoucherTemplate[]) => {
    setStatusUpdateSelectedTemplates(templates);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedTemplates.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedTemplates, status, () => {
        setSelectedTemplates([]);
        setStatusUpdateSelectedTemplates([]);
      });
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'Loyalty'),
    disabled: selectedTemplates.length === 0,
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
        showCondition: ability.can(Action.Update, 'Loyalty'),
        disabled: selectedTemplates.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : [])
  ];

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Status filter options (isActive boolean)
  const statusOptions = [
    { id: 'all', name: t('all') },
    { id: 'active', name: t('active.capital') },
    { id: 'passive', name: t('passive.capital') }
  ];

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          options={statusOptions}
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

  const renderRewardContent = (template: VoucherTemplate) => {
    const groups = template.rewardGroups || [];
    const totalQty =
      template.totalRewardQuantity ||
      groups.reduce((sum, g) => sum + g.rewardQuantity, 0);

    if (template.rewardType === 'PERCENT_DISCOUNT') {
      return (
        <>
          <Chip
            label={`%${template.discountPercent || 0}`}
            size="small"
            sx={{
              fontWeight: 'bold',
              bgcolor: '#ed6c02',
              color: '#fff',
              height: 24,
              '& .MuiChip-label': { px: 1 }
            }}
          />
          <Chip
            icon={<GroupIcon sx={{ fontSize: 14 }} />}
            label={`${groups.length} ${t('voucher.groups')}`}
            size="small"
            sx={{
              bgcolor: 'rgba(237,108,2,0.15)',
              color: '#ed6c02',
              fontWeight: 'bold',
              height: 24,
              '& .MuiChip-label': { px: 1 }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
            {totalQty} {t('piece')}
          </Typography>
        </>
      );
    }

    if (template.rewardType === 'FIXED_DISCOUNT') {
      return (
        <>
          <Chip
            label={`${template.discountAmount || 0} ₺`}
            size="small"
            sx={{
              fontWeight: 'bold',
              bgcolor: '#9c27b0',
              color: '#fff',
              height: 24,
              '& .MuiChip-label': { px: 1 }
            }}
          />
          <Chip
            icon={<GroupIcon sx={{ fontSize: 14 }} />}
            label={`${groups.length} ${t('voucher.groups')}`}
            size="small"
            sx={{
              bgcolor: 'rgba(156,39,176,0.15)',
              color: '#9c27b0',
              fontWeight: 'bold',
              height: 24,
              '& .MuiChip-label': { px: 1 }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
            {totalQty} {t('piece')}
          </Typography>
        </>
      );
    }

    // FREE_PRODUCT
    if (groups.length > 0) {
      return (
        <>
          <Chip
            icon={<GroupIcon sx={{ fontSize: 14 }} />}
            label={`${groups.length} ${t('voucher.groups')}`}
            size="small"
            sx={{
              bgcolor: '#2e7d32',
              color: '#fff',
              fontWeight: 'bold',
              height: 24,
              '& .MuiChip-label': { px: 1 }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
            {totalQty} {t('piece')}
          </Typography>
        </>
      );
    }

    return null;
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
              <Box flex={1} p={2}>
                <BulkActions<VoucherTemplate>
                  selected={selectedTemplates}
                  buttons={allButtons}
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

                    <Can I="create" a="Loyalty" ability={ability}>
                      <Button
                        startIcon={<Add />}
                        onClick={onOpenAddDialog}
                        sx={{ ml: 1 }}
                        variant="contained"
                        color="primary"
                      >
                        <Typography>{t('voucher.templates.add')}</Typography>
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('voucher.templates.title')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={() => onFilterChange({ ...filters })}
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
              <Table sx={{ tableLayout: 'fixed', minWidth: 1100 }}>
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
                            checked={selectedAllTemplates}
                            indeterminate={selectedSomeTemplates}
                            onChange={handleSelectAllTemplates}
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
                  ) : templates.length > 0 ? (
                    templates.map((template) => {
                      const isTemplateSelected = selectedTemplates.some(
                        (t) => t.id === template.id
                      );
                      return (
                        <TableRow
                          hover
                          key={template.id}
                          selected={isTemplateSelected}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={handleSelectClick}
                          >
                            <Checkbox
                              color="primary"
                              checked={isTemplateSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneTemplate(event, template.id)}
                              value={isTemplateSelected}
                              onClick={handleSelectClick}
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography fontWeight="medium" sx={{ mb: 0.5 }}>
                                {template.name}
                              </Typography>
                              {template.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {template.description}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          {(showBranchColumn || showCompanyColumn) && (
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {template.branchName || '-'}
                              </Typography>
                              {showCompanyColumn && template.companyName && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {template.companyName}
                                </Typography>
                              )}
                            </TableCell>
                          )}
                          <TableCell align="center">
                            {template.triggerProduct ? (
                              <Box>
                                {(template.triggerProduct.file?.url ||
                                  template.triggerProduct.image) && (
                                  <CustomImageComponent
                                    imageUrl={
                                      template.triggerProduct.file?.url ||
                                      template.triggerProduct.image ||
                                      ''
                                    }
                                    alt={template.triggerProduct.name}
                                    width={36}
                                    height={36}
                                  />
                                )}
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                  >
                                    {template.triggerProduct.name}
                                  </Typography>
                                  <Chip
                                    label={`${t('min')}: ${template.triggerMinQuantity}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      mt: 0.5
                                    }}
                                  />
                                </Box>
                              </Box>
                            ) : (
                              <Chip
                                label={t('voucher.no.trigger')}
                                size="small"
                                variant="outlined"
                                color="default"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getRewardTypeLabel(template.rewardType, t)}
                              size="small"
                              sx={{
                                fontWeight: 'bold',
                                minWidth: 110,
                                ...getRewardTypeColor(template.rewardType),
                                '& .MuiChip-label': { px: 1.5 }
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              {renderRewardContent(template)}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 0.5
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: 'success.main',
                                    flexShrink: 0
                                  }}
                                />
                                <Typography variant="caption">
                                  {formatDateToDayMonthYear(template.startDate)}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 0.5
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: 'error.main',
                                    flexShrink: 0
                                  }}
                                />
                                <Typography variant="caption">
                                  {formatDateToDayMonthYear(template.endDate)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${template.currentUsageCount}${template.totalMaxUsage ? ` / ${template.totalMaxUsage}` : ''}`}
                              size="small"
                              color={
                                template.currentUsageCount > 0
                                  ? 'info'
                                  : 'default'
                              }
                              variant="outlined"
                              sx={{ fontWeight: 'medium' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <StatusLabel
                              status={template.isActive ? 'ACTIVE' : 'PASSIVE'}
                            />
                          </TableCell>
                          {canManageLoyalty && (
                            <TableCell
                              align="center"
                              onClick={handleSelectClick}
                            >
                              <Can I="update" a="Loyalty" ability={ability}>
                                <Tooltip title={t('promoCode.title')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPromoDialogTemplate(template);
                                    }}
                                    sx={{
                                      '&:hover': {
                                        background:
                                          theme.colors.secondary.lighter
                                      },
                                      color: theme.palette.secondary.main
                                    }}
                                    color="inherit"
                                    size="small"
                                  >
                                    <QrCode2Icon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Can>
                              <Can I="update" a="Loyalty" ability={ability}>
                                <Tooltip title={t('edit')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenEditDialog(template);
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
                              <Can I="delete" a="Loyalty" ability={ability}>
                                <Tooltip title={t('delete')} arrow>
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTemplate(template);
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
                      message={t('voucher.templates.no.data')}
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
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedTemplates([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedTemplates}
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'passive', label: t('status.passive') }
        ]}
        title={t('bulk.status.update.vouchers.title')}
        description={t('bulk.status.update.vouchers.description')}
        itemDisplayProperty="name"
        currentStatusProperty={(item: VoucherTemplate) =>
          item.isActive ? 'ACTIVE' : 'PASSIVE'
        }
      />
      {promoDialogTemplate && (
        <PromoCodesDialog
          open={Boolean(promoDialogTemplate)}
          onClose={() => setPromoDialogTemplate(null)}
          template={promoDialogTemplate}
        />
      )}
    </Container>
  );
};

export default VoucherTemplatesTable;
