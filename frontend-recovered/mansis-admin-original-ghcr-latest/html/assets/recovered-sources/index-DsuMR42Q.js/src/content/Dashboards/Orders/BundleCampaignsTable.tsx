import React, { ChangeEvent } from 'react';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
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
  CircularProgress,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import { BundleCampaignPurchase } from '@/types/BundleCampaignPurchase.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { SearchOutlined } from '@mui/icons-material';
import { debounce, preparePurchaseTypeLabel } from '@/utils/helpers';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import PurchaseTypeFilter from '@/components/filters/PurchaseTypeFilter';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import NoDataFound from '@/components/NoDataFound';

interface BundleCampaignsTableProps {
  bundleCampaigns: BundleCampaignPurchase[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
  rowsPerPageOptions?: number[];
  pageKey?: string;
}

const BundleCampaignsTable = ({
  bundleCampaigns,
  loading,
  totalCount,
  onFilterChange,
  rowsPerPageOptions = [10, 30, 50, 100],
  pageKey
}: BundleCampaignsTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

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

  const { isAdminView } = useUserViewMode();

  const handlePurchaseTypeChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      purchaseType: value,
      page: 0
    }));
  };

  const filterOptions: FilterOption[] = [
    {
      id: 'purchaseType',
      label: t('filters.purchase.type'),
      component: (
        <PurchaseTypeFilter
          value={filters.purchaseType}
          onChange={handlePurchaseTypeChange}
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

  if (isAdminView) {
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

  const tableHeaders = [
    {
      id: 'customer',
      label: t('customer'),
      align: 'left'
    },
    {
      id: 'campaign',
      label: t('campaign'),
      align: 'left'
    },
    ...(isAdminView
      ? [
          {
            id: 'location',
            label: t('location'),
            align: 'left'
          }
        ]
      : []),
    {
      id: 'processedBy',
      label: t('processed.by'),
      align: 'left'
    },
    {
      id: 'purchaseType',
      label: t('purchase.type'),
      align: 'left'
    },
    {
      id: 'totalUsage',
      label: t('total.usage'),
      align: 'center'
    },
    {
      id: 'remain',
      label: t('remaining'),
      align: 'center'
    },
    {
      id: 'amount',
      label: t('amount'),
      align: 'left'
    },
    {
      id: 'createdAt',
      label: t('created.at'),
      align: 'left'
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
                </Box>
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {t('bundle.campaign.purchases')}
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
                  ) : bundleCampaigns.length > 0 ? (
                    bundleCampaigns.map((purchase) => {
                      return (
                        <TableRow hover key={purchase.id}>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {purchase.user.name} {purchase.user.surname}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {purchase.user.email}
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
                              {purchase.campaign.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {t('bundle')} #
                              {purchase.campaign.campaignBundle?.bundle.id}
                            </Typography>
                          </TableCell>
                          {isAdminView && (
                            <TableCell>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {purchase.branch.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {purchase.branch.company.name}
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
                              {purchase.employee
                                ? `${purchase.employee.name} ${purchase.employee.surname}`
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {purchase.purchaseType
                              ? t(
                                  preparePurchaseTypeLabel(
                                    purchase.purchaseType
                                  )
                                )
                              : '-'}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                            >
                              {purchase.totalUsage}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                            >
                              {purchase.remain}
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
                              {purchase.paymentAttempt?.amount
                                ? `${purchase.paymentAttempt.amount} TL`
                                : purchase.campaign.campaignBundle?.bundle.price
                                  ? `${purchase.campaign.campaignBundle.bundle.price} TL`
                                  : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(purchase.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <NoDataFound
                      message={t('no.bundle.campaign.found')}
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

export default BundleCampaignsTable;
