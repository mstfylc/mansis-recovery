import React, { ChangeEvent, useContext } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Divider,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Chip,
  useTheme,
  CircularProgress
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import { SearchOutlined } from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTranslation } from 'react-i18next';
import { debounce } from '@/utils/helpers';
import StatusLabel from '@/components/StatusLabel';
import StatusFilter from '@/components/filters/StatusFilter';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { useTableFilters } from '@/hooks/useTableFilters';
import NoDataFound from '@/components/NoDataFound';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import {
  LoyaltySettingsTableProps,
  CompanyLoyaltySettingsListItem
} from '@/types/Loyalty.interface';

const LoyaltySettingsTable: React.FC<LoyaltySettingsTableProps> = ({
  items,
  loading,
  totalCount,
  onFilterChange,
  onEditSettings,
  pageKey = 'loyalty-settings'
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);
  const canManageSettings = ability.can(Action.Manage, 'LoyaltySettings');

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
      search: '',
      limit: 10,
      page: 0,
      status: undefined
    },
    onFilterChange,
    pageKey
  });

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const handlePageChange = (_event: any, newPage: number): void => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    onFilterChange({ ...filters, page: newPage });
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newLimit = Number.parseInt(event.target.value);
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 0 }));
    onFilterChange({ ...filters, limit: newLimit, page: 0 });
  };

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
    }
  ];

  const headers = [
    { id: 'company', label: t('company.name') },
    {
      id: 'loyaltyStatus',
      label: t('loyalty.status'),
      align: 'center' as const
    },
    {
      id: 'dailyLoginPoints',
      label: t('loyalty.settings.daily.login'),
      align: 'center' as const
    },
    {
      id: 'purchasePoints',
      label: t('loyalty.settings.purchase'),
      align: 'center' as const
    },
    ...(canManageSettings
      ? [{ id: 'actions', label: t('actions'), align: 'center' as const }]
      : [])
  ];

  return (
    <Card>
      <CardHeader
        action={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
              <OutlinedInput
                defaultValue={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('search')}
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
              {t('loyalty.settings.list')}
            </Typography>
            <Tooltip arrow title={t('refresh.list')}>
              <IconButton
                onClick={() => {
                  onFilterChange({ ...filters });
                }}
                color="primary"
                sx={{ ml: 1 }}
              >
                <RefreshTwoToneIcon />
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
              {headers.map((header) => (
                <TableCell key={header.id} align={header.align || 'left'}>
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  <Box p={2} display="flex" justifyContent="center">
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : items.length > 0 ? (
              items.map((item: CompanyLoyaltySettingsListItem) => (
                <TableRow hover key={item.id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {item.company.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <StatusLabel
                      status={item.isLoyaltyEnabled ? 'ACTIVE' : 'PASSIVE'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      justifyContent={'center'}
                    >
                      <Chip
                        label={
                          item.dailyLoginPointsEnabled
                            ? t('active.capital')
                            : t('passive.capital')
                        }
                        color={
                          item.dailyLoginPointsEnabled ? 'success' : 'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                      {item.dailyLoginPointsEnabled && (
                        <Typography variant="body2" color="text.secondary">
                          {item.dailyLoginPoints} {t('loyalty.points.unit')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      justifyContent={'center'}
                    >
                      <Chip
                        label={
                          item.purchasePointsEnabled
                            ? t('active.capital')
                            : t('passive.capital')
                        }
                        color={
                          item.purchasePointsEnabled ? 'success' : 'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                      {item.purchasePointsEnabled && (
                        <Typography variant="body2" color="text.secondary">
                          {item.purchasePointsPerUnit}{' '}
                          {t('loyalty.points.per.unit')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {canManageSettings && (
                    <TableCell align="center">
                      <Can I="manage" a="LoyaltySettings" ability={ability}>
                        <Tooltip title={t('edit')} arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.palette.primary.main
                            }}
                            color="inherit"
                            size="small"
                            onClick={() => onEditSettings(item)}
                          >
                            <EditTwoToneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Can>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <NoDataFound
                message={t('no.loyalty.settings.found')}
                colSpan={headers.length}
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box p={2}>
        <TablePagination
          component="div"
          count={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={filters.page || 0}
          rowsPerPage={filters.limit || 10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage={t('rows.per.page')}
        />
      </Box>
    </Card>
  );
};

export default LoyaltySettingsTable;
