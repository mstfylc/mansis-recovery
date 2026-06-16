import React, { FC, useContext, useMemo } from 'react';
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
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  Button,
  CircularProgress,
  Grid,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import type { FloorPlan } from '@/types/Table.interface';
import { Filters } from '@/types/Filters';
import NoDataFound from '@/components/NoDataFound';
import StatusLabel from '@/components/StatusLabel';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTableFilters } from '@/hooks/useTableFilters';
import { debounce } from '@/utils/helpers';

interface FloorPlansTableProps {
  floorPlans: FloorPlan[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (floorPlan: FloorPlan) => void;
  onDelete: (id: number) => void;
  onFilterChange: (filters: Filters) => void;
  pageKey?: string;
}

const FloorPlansTable: FC<FloorPlansTableProps> = ({
  floorPlans,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onFilterChange,
  pageKey
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);
  const navigate = useNavigate();

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

  const duplicateSortOrders = useMemo(() => {
    const counts = new Map<number, number>();
    floorPlans.forEach((p) =>
      counts.set(p.sortOrder, (counts.get(p.sortOrder) ?? 0) + 1)
    );
    return new Set(
      [...counts.entries()].filter(([, c]) => c > 1).map(([v]) => v)
    );
  }, [floorPlans]);

  const filteredPlans = useMemo(() => {
    let result = floorPlans;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((plan) =>
        plan.name.toLowerCase().includes(searchLower)
      );
    }
    if (filters.status) {
      const isActive = filters.status === 'active';
      result = result.filter((plan) => plan.isActive === isActive);
    }
    return result;
  }, [floorPlans, filters.search, filters.status]);

  const page = filters.page || 0;
  const limit = filters.limit || 10;
  const paginatedPlans = filteredPlans.slice(
    page * limit,
    page * limit + limit
  );

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const newLimit = Number.parseInt(event.target.value);
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 0 }));
  };

  const handleViewTables = (plan: FloorPlan) => {
    navigate(`/management/table-management/${plan.id}`, {
      state: { floorPlan: plan }
    });
  };

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const statusOptions = [
    { id: 'all', name: t('all') },
    { id: 'active', name: t('active') },
    { id: 'passive', name: t('passive') }
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

  const tableHeaders = [
    { id: 'name', label: t('table.floor.plan.name'), align: 'left' as const },
    {
      id: 'grid',
      label: t('table.floor.plan.grid'),
      align: 'center' as const
    },
    { id: 'tables', label: t('table.tables'), align: 'center' as const },
    { id: 'sortOrder', label: t('table.sort.order'), align: 'center' as const },
    { id: 'status', label: t('status'), align: 'center' as const },
    { id: 'actions', label: t('actions'), align: 'center' as const }
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

                  <Can I={Action.Create} a="FloorPlan" ability={ability}>
                    <Button
                      startIcon={<Add />}
                      onClick={onAdd}
                      sx={{ ml: 2 }}
                      variant="contained"
                      color="primary"
                    >
                      {t('table.create.floor.plan')}
                    </Button>
                  </Can>
                </Box>
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {t('table.floor.plans')}
                  </Typography>
                  <Tooltip arrow title={t('refresh.list')}>
                    <IconButton
                      onClick={() => {
                        onFilterChange({ ...filters });
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
                      <TableCell key={header.id} align={header.align}>
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
                  ) : paginatedPlans.length === 0 ? (
                    <NoDataFound
                      message={t('table.floor.plan.no.data')}
                      colSpan={tableHeaders.length}
                    />
                  ) : (
                    paginatedPlans.map((plan) => (
                      <TableRow key={plan.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight="bold">
                            {plan.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {plan.gridRows}×{plan.gridCols}
                        </TableCell>
                        <TableCell align="center">
                          {plan.tables?.length ?? '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            display="inline-flex"
                            alignItems="center"
                            gap={0.5}
                          >
                            {plan.sortOrder}
                            {duplicateSortOrders.has(plan.sortOrder) && (
                              <Tooltip
                                title={t('table.sort.order.duplicate.warning')}
                                arrow
                              >
                                <WarningAmberIcon
                                  fontSize="small"
                                  sx={{
                                    color: 'warning.main',
                                    verticalAlign: 'middle'
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <StatusLabel
                            status={plan.isActive ? 'ACTIVE' : 'PASSIVE'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={t('table.view.tables')} arrow>
                            <IconButton
                              onClick={() => handleViewTables(plan)}
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
                            I={Action.Update}
                            a="FloorPlan"
                            ability={ability}
                          >
                            <Tooltip title={t('table.edit.floor.plan')} arrow>
                              <IconButton
                                onClick={() => onEdit(plan)}
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
                          <Can
                            I={Action.Delete}
                            a="FloorPlan"
                            ability={ability}
                          >
                            <Tooltip title={t('table.delete.floor.plan')} arrow>
                              <IconButton
                                onClick={() => onDelete(plan.id)}
                                sx={{
                                  '&:hover': {
                                    background: theme.colors.error.lighter
                                  },
                                  color: theme.palette.error.main
                                }}
                                color="inherit"
                                size="small"
                              >
                                <DeleteTwoToneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Can>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box p={2}>
              <TablePagination
                component="div"
                count={filteredPlans.length}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={page}
                rowsPerPage={limit}
                rowsPerPageOptions={[10, 30, 50, 100]}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FloorPlansTable;
