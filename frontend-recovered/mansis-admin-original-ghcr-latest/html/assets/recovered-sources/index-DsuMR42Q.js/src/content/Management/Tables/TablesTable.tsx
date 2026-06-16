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
  Chip,
  CircularProgress,
  Grid,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Add, SearchOutlined } from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTranslation } from 'react-i18next';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import { TableStatus, type Table as TableType } from '@/types/Table.interface';
import { Filters } from '@/types/Filters';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTableFilters } from '@/hooks/useTableFilters';
import { debounce } from '@/utils/helpers';

const STATUS_COLORS: Record<
  TableStatus,
  'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
> = {
  [TableStatus.AVAILABLE]: 'success',
  [TableStatus.OCCUPIED]: 'error',
  [TableStatus.RESERVED]: 'warning',
  [TableStatus.CLEANING]: 'info',
  [TableStatus.BLOCKED]: 'default'
};

interface TablesTableProps {
  tables: TableType[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (table: TableType) => void;
  onDelete: (id: number) => void;
  onToggleBlock: (table: TableType) => void;
  onFilterChange: (filters: Filters) => void;
  pageKey?: string;
}

const TablesTable: FC<TablesTableProps> = ({
  tables,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onToggleBlock,
  onFilterChange,
  pageKey
}) => {
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

  const filteredTables = useMemo(() => {
    let result = tables;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (tbl) =>
          tbl.label.toLowerCase().includes(searchLower) ||
          String(tbl.tableNumber).includes(searchLower)
      );
    }
    if (filters.status) {
      result = result.filter((tbl) => tbl.status === filters.status);
    }
    return result;
  }, [tables, filters.search, filters.status]);

  const page = filters.page || 0;
  const limit = filters.limit || 10;
  const paginatedTables = filteredTables.slice(
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

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const statusOptions = [
    { id: 'all', name: t('all') },
    { id: TableStatus.AVAILABLE, name: t('table.status.AVAILABLE') },
    { id: TableStatus.OCCUPIED, name: t('table.status.OCCUPIED') },
    { id: TableStatus.RESERVED, name: t('table.status.RESERVED') },
    { id: TableStatus.CLEANING, name: t('table.status.CLEANING') },
    { id: TableStatus.BLOCKED, name: t('table.status.BLOCKED') }
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
    { id: 'label', label: t('table.label'), align: 'left' as const },
    { id: 'number', label: t('table.number'), align: 'center' as const },
    { id: 'shape', label: t('table.shape'), align: 'center' as const },
    { id: 'capacity', label: t('table.capacity'), align: 'center' as const },
    { id: 'status', label: t('table.status'), align: 'center' as const },
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

                  <Can I={Action.Create} a="Table" ability={ability}>
                    <Button
                      startIcon={<Add />}
                      onClick={onAdd}
                      sx={{ ml: 2 }}
                      variant="contained"
                      color="primary"
                    >
                      {t('table.create.table')}
                    </Button>
                  </Can>
                </Box>
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {t('table.tables')}
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
                  ) : paginatedTables.length === 0 ? (
                    <NoDataFound
                      message={t('table.no.data')}
                      colSpan={tableHeaders.length}
                    />
                  ) : (
                    paginatedTables.map((tbl) => (
                      <TableRow key={tbl.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight="bold">
                            {tbl.label}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{tbl.tableNumber}</TableCell>
                        <TableCell align="center">
                          {t(`table.shape.${tbl.shape}`)}
                        </TableCell>
                        <TableCell align="center">{tbl.capacity}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={t(`table.status.${tbl.status}`)}
                            color={STATUS_COLORS[tbl.status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Can I={Action.Update} a="Table" ability={ability}>
                            <Tooltip title={t('table.edit.table')} arrow>
                              <IconButton
                                onClick={() => onEdit(tbl)}
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
                            <Tooltip
                              title={
                                tbl.status === TableStatus.BLOCKED
                                  ? t('table.unblock.table')
                                  : t('table.block.table')
                              }
                              arrow
                            >
                              <IconButton
                                onClick={() => onToggleBlock(tbl)}
                                sx={{
                                  '&:hover': {
                                    background:
                                      tbl.status === TableStatus.BLOCKED
                                        ? theme.colors.success.lighter
                                        : theme.colors.warning.lighter
                                  },
                                  color:
                                    tbl.status === TableStatus.BLOCKED
                                      ? theme.palette.success.main
                                      : theme.palette.warning.main
                                }}
                                color="inherit"
                                size="small"
                              >
                                {tbl.status === TableStatus.BLOCKED ? (
                                  <LockOpenIcon fontSize="small" />
                                ) : (
                                  <BlockIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Can>
                          <Can I={Action.Delete} a="Table" ability={ability}>
                            <Tooltip title={t('table.delete.table')} arrow>
                              <IconButton
                                onClick={() => onDelete(tbl.id)}
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
                count={filteredTables.length}
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

export default TablesTable;
