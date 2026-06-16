import React, { ChangeEvent, useContext } from 'react';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import AssignmentIcon from '@mui/icons-material/Assignment';
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
  InputAdornment
} from '@mui/material';
import { SmsPackage } from '@/types/Licensing.interface';
import { formatCurrency } from '@/utils/formatters';
import { Add, SearchOutlined } from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { debounce } from '@/utils/helpers';
import { Filters } from '@/types/Filters';
import NoDataFound from '@/components/NoDataFound';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useTranslation } from 'react-i18next';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import StatusFilter from '@/components/filters/StatusFilter';
import StatusLabel from '@/components/StatusLabel';

interface SmsPackagesTableProps {
  packages: SmsPackage[];
  loading: boolean;
  totalCount: number;
  setShowNewPackageDialog: (show: boolean) => void;
  onDeletePackage: (packageId: number) => void;
  onEditPackage: (pkg: SmsPackage) => void;
  onPurchasePackage: (pkg: SmsPackage) => void;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const SmsPackagesTable = ({
  packages,
  loading,
  totalCount,
  setShowNewPackageDialog,
  onDeletePackage,
  onEditPackage,
  onPurchasePackage,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: SmsPackagesTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
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

  // Filter options for the popover - Backend expects lowercase
  const smsStatusOptions = [
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
          options={smsStatusOptions}
          size="small"
        />
      )
    }
  ];

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

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const tableHeaders = [
    {
      id: 'name',
      label: t('sms.package.name'),
      align: 'left'
    },
    {
      id: 'amount',
      label: t('sms.package.amount'),
      align: 'right'
    },
    {
      id: 'price',
      label: t('sms.package.price'),
      align: 'right'
    },
    {
      id: 'sortOrder',
      label: t('sms.package.sortOrder'),
      align: 'center'
    },
    {
      id: 'status',
      label: t('status'),
      align: 'center'
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

                  <Can I="create" a="SmsPackage" ability={ability}>
                    <Button
                      startIcon={<Add />}
                      onClick={() => setShowNewPackageDialog(true)}
                      sx={{
                        minWidth: 140,
                        ml: 2
                      }}
                      variant="contained"
                      color="primary"
                    >
                      <Typography>{t('sms.package.create')}</Typography>
                    </Button>
                  </Can>
                </Box>
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {t('sms.packages')}
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
                  ) : packages.length > 0 ? (
                    packages.map((pkg) => (
                      <TableRow hover key={pkg.id}>
                        <TableCell>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color="text.primary"
                            gutterBottom
                            noWrap
                          >
                            {pkg.name}
                          </Typography>
                          {pkg.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {pkg.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            {pkg.amount.toLocaleString()} SMS
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(Number(pkg.price))}
                        </TableCell>
                        <TableCell align="center">{pkg.sortOrder}</TableCell>
                        <TableCell align="center">
                          <StatusLabel
                            status={pkg.isActive ? 'ACTIVE' : 'PASSIVE'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Can I="create" a="SmsPackage" ability={ability}>
                            <Tooltip title={t('sms.package.assign')} arrow>
                              <IconButton
                                onClick={() => onPurchasePackage(pkg)}
                                sx={{
                                  '&:hover': {
                                    background: theme.colors.success.lighter
                                  },
                                  color: theme.palette.success.main
                                }}
                                color="inherit"
                                size="small"
                              >
                                <AssignmentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Can>
                          <Can I="update" a="SmsPackage" ability={ability}>
                            <Tooltip title={t('edit')} arrow>
                              <IconButton
                                onClick={() => onEditPackage(pkg)}
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
                          <Can I="delete" a="SmsPackage" ability={ability}>
                            <Tooltip title={t('delete')} arrow>
                              <IconButton
                                onClick={() => onDeletePackage(pkg.id)}
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
                    ))
                  ) : (
                    <NoDataFound
                      message={t('sms.package.no.data')}
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
    </Container>
  );
};

export default SmsPackagesTable;
