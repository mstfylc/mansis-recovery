import React, { useState, ChangeEvent } from 'react';
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
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { Company } from '@/types/Company.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { Add, SearchOutlined } from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { Filters } from '@/types/Filters';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTranslation } from 'react-i18next';
import StatusLabel from '@/components/StatusLabel';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import ImagePlaceholder from '@/components/images/ImagePlaceholder';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import CompanyDialog from '@/components/modals/CompanyDialog';
import NoDataFound from '@/components/NoDataFound';
import BulkStatusUpdateDialog from '@/components/modals/BulkStatusUpdateDialog';
import { getCompanyStatusOptions } from '@/utils/statusOptions';

interface CompaniesTableProps {
  companies: Company[];
  loading: boolean;
  totalCount: number;
  setShowNewCompanyDialog: (show: boolean) => void;
  onDeleteCompany: (companyId: number) => void;
  onBulkDeleteCompanies: (
    companies: Company[],
    onSuccess?: () => void
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    companies: Company[],
    status: string,
    onSuccess?: () => void
  ) => Promise<void>;
  onUpdateCompany: (
    companyId: number,
    updates: {
      status?: string;
      name?: string;
      imageFile?: File | null;
    }
  ) => Promise<void>;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
}

const CompaniesTable = ({
  companies = [],
  loading,
  totalCount,
  setShowNewCompanyDialog,
  onDeleteCompany,
  onBulkDeleteCompanies,
  onBulkUpdateStatus,
  onUpdateCompany,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100]
}: CompaniesTableProps) => {
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const selectedBulkActions = selectedCompanies.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const { t } = useTranslation();

  const [filters, setFilters] = useState<Filters>({
    status: undefined,
    search: ''
  });

  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  // Status update dialog state
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateSelectedCompanies, setStatusUpdateSelectedCompanies] =
    useState<Company[]>([]);

  const handleSelectAllCompanies = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
    setSelectedCompanies(event.target.checked ? companies : []);
  };

  const handleSelectOneCompany = (
    event: ChangeEvent<HTMLInputElement>,
    companyId: number
  ): void => {
    event.stopPropagation();

    const company = companies.find((u) => u.id === companyId);
    if (!company) return;

    if (!selectedCompanies.find((u) => u.id === companyId)) {
      setSelectedCompanies((prevSelected) => [...prevSelected, company]);
    } else {
      setSelectedCompanies((prevSelected) =>
        prevSelected.filter((u) => u.id !== companyId)
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

  const handleBulkDelete = async (companies: Company[]) => {
    return onBulkDeleteCompanies(companies, () => {
      setSelectedCompanies([]);
    });
  };

  const handleBulkStatusUpdate = (companies: Company[]) => {
    setStatusUpdateSelectedCompanies(companies);
    setShowStatusUpdateDialog(true);
  };

  const handleStatusUpdateConfirm = async (status: string) => {
    if (onBulkUpdateStatus && statusUpdateSelectedCompanies.length > 0) {
      await onBulkUpdateStatus(statusUpdateSelectedCompanies, status, () => {
        setSelectedCompanies([]);
        setStatusUpdateSelectedCompanies([]);
      });
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: true,
    disabled: selectedCompanies.length === 0,
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
        showCondition: true,
        disabled: selectedCompanies.length === 0,
        position: 'left',
        variant: 'contained'
      } as BulkActionButtonConfig)
    : null;

  const allButtons = [
    ...(deleteButton ? [deleteButton] : []),
    ...(statusUpdateButton ? [statusUpdateButton] : [])
  ];

  const selectedSomeCompanies =
    selectedCompanies.length > 0 && selectedCompanies.length < companies.length;
  const selectedAllCompanies = selectedCompanies.length === companies.length;
  const theme = useTheme();

  const handleEditClick = (company: Company) => {
    setEditCompany(company);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditCompany(null);
    setEditError(undefined);
  };

  const handleEditSave = async (updates: {
    name: string;
    status?: string;
    imageFile?: File | null;
  }) => {
    try {
      if (editCompany) {
        await onUpdateCompany(editCompany.id, updates);
        handleEditClose();
      }
    } catch (error) {
      console.error('Error updating company:', error);
      setEditError(t('error.updating.company'));
    }
  };

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
      id: 'numberOfUsersUnderThisCategory',
      label: t('number.of.users'),
      align: 'center'
    },
    {
      id: 'numberOfBranchesUnderThisCategory',
      label: t('number.of.branches'),
      align: 'center'
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
              <Box flex={1} p={2} className="company-bulk-actions">
                <BulkActions<Company>
                  selected={selectedCompanies}
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
                    className="company-filters"
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

                    <Button
                      startIcon={<Add />}
                      onClick={() => setShowNewCompanyDialog(true)}
                      sx={{
                        minWidth: 140,
                        ml: 2
                      }}
                      variant="contained"
                      color="primary"
                      className="company-add-button"
                    >
                      {t('new.company')}
                    </Button>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('company.list')}
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
                        className="company-refresh"
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
                            checked={selectedAllCompanies}
                            indeterminate={selectedSomeCompanies}
                            onChange={handleSelectAllCompanies}
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
                  ) : companies.length > 0 ? (
                    companies.map((company) => {
                      const isCompanySelected = selectedCompanies.some(
                        (u) => u.id === company.id
                      );
                      return (
                        <TableRow
                          hover
                          key={company.id}
                          selected={isCompanySelected}
                          className="company-row"
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isCompanySelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOneCompany(event, company.id)}
                              value={isCompanySelected}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ mx: 0, px: 0 }}
                            className="company-image"
                          >
                            {company.file?.url ? (
                              <CustomImageComponent
                                imageUrl={company.file.url}
                                alt={company.name}
                                onClick={handleImageClick}
                                width={50}
                                height={50}
                              />
                            ) : (
                              <Tooltip title={t('edit.company')} arrow>
                                <Box onClick={() => handleEditClick(company)}>
                                  <ImagePlaceholder width={50} height={50} />
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
                              {company.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <StatusLabel status={company?.status} />
                          </TableCell>
                          <TableCell align="center">
                            {company.numberOfUsersUnderThisCompany}
                          </TableCell>
                          <TableCell align="center">
                            {company.numberOfBranchesUnderThisCompany}
                          </TableCell>

                          <TableCell>
                            {formatDateToDayMonthYearTime(company?.createdAt)}
                          </TableCell>
                          <TableCell>
                            {company?.updatedAt
                              ? formatDateToDayMonthYearTime(company.updatedAt)
                              : '-'}
                          </TableCell>

                          <TableCell align="center" className="company-actions">
                            <Tooltip title={t('edit.company')} arrow>
                              <IconButton
                                onClick={() => handleEditClick(company)}
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
                            <Tooltip title={t('delete.company')} arrow>
                              <IconButton
                                onClick={() => onDeleteCompany(company.id)}
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
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.company.found')}
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
                className="company-pagination"
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
      <ImagePreviewModal
        open={previewModalOpen}
        imageUrl={previewImageUrl}
        onClose={handleClosePreviewModal}
        alt={editCompany?.name || 'Company image'}
      />
      <CompanyDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        onSave={handleEditSave}
        company={editCompany}
        error={editError}
      />
      <BulkStatusUpdateDialog
        open={showStatusUpdateDialog}
        onClose={() => {
          setShowStatusUpdateDialog(false);
          setStatusUpdateSelectedCompanies([]);
        }}
        onConfirm={handleStatusUpdateConfirm}
        selectedItems={statusUpdateSelectedCompanies}
        statusOptions={getCompanyStatusOptions()}
        title={t('bulk.status.update.companies.title')}
        description={t('bulk.status.update.companies.description')}
        itemDisplayProperty="name"
        currentStatusProperty="status"
      />
    </Container>
  );
};

export default CompaniesTable;
