import React, {
  FC,
  ChangeEvent,
  useState,
  MouseEvent,
  useContext
} from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import {
  Box,
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  OutlinedInput,
  InputAdornment,
  FormControl,
  Grid,
  Container,
  Checkbox,
  Button,
  CircularProgress
} from '@mui/material';
import { SearchOutlined, Star } from '@mui/icons-material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Warehouse } from '@/types/stock';
import { Filters } from '@/types/Filters';
import NoDataFound from '@/components/NoDataFound';
import StatusLabel from '@/components/StatusLabel';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import { debounce } from '@/utils/helpers';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { useTableFilters } from '@/hooks/useTableFilters';
import LocationFilter from '@/components/filters/LocationFilter';

interface WarehousesTableProps {
  warehouses: Warehouse[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (id: number) => void;
  onBulkDeleteWarehouses: (
    warehouses: Warehouse[],
    onSuccess?: () => void
  ) => Promise<void>;
  rowsPerPageOptions?: number[];
  onAdd?: () => void;
  pageKey?: string;
}

const WarehousesTable: FC<WarehousesTableProps> = ({
  warehouses,
  loading,
  totalCount,
  onFilterChange,
  onEdit,
  onDelete,
  onBulkDeleteWarehouses,
  rowsPerPageOptions = [10, 30, 50, 100],
  onAdd,
  pageKey
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const ability = useContext(AbilityContext);
  const { isSuperAdmin, isCompanyAdmin, isAdminView } = useUserViewMode();

  const [selectedWarehouses, setSelectedWarehouses] = useState<Warehouse[]>([]);

  const selectedBulkActions = selectedWarehouses.length > 0;
  const selectedSomeWarehouses =
    selectedWarehouses.length > 0 &&
    selectedWarehouses.length < warehouses.length;
  const selectedAllWarehouses = selectedWarehouses.length === warehouses.length;

  const {
    filters,
    setFilters,
    handleSearch: handleSearchFilter,
    handleBranchChange,
    handleCompanyChange,
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

  // Table headers configuration
  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'center',
      padding: 'checkbox'
    },
    {
      id: 'code',
      label: t('code'),
      align: 'left'
    },
    {
      id: 'name',
      label: t('name'),
      align: 'left'
    },
    ...((isSuperAdmin || isCompanyAdmin) && isAdminView
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
      id: 'description',
      label: t('description'),
      align: 'left'
    },
    {
      id: 'actions',
      label: t('actions'),
      align: 'center'
    }
  ];

  const handleSelectAllWarehouses = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedWarehouses(event.target.checked ? warehouses : []);
  };

  const handleSelectOneWarehouse = (
    _event: ChangeEvent<HTMLInputElement> | null,
    warehouseId: number
  ): void => {
    const warehouse = warehouses.find((u) => u.id === warehouseId);
    if (!warehouse) return;

    if (!selectedWarehouses.find((u) => u.id === warehouseId)) {
      setSelectedWarehouses((prevSelected) => [...prevSelected, warehouse]);
    } else {
      setSelectedWarehouses((prevSelected) =>
        prevSelected.filter((u) => u.id !== warehouseId)
      );
    }
  };

  const handlePageChange = (
    _event: MouseEvent<HTMLButtonElement> | null,
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

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Bulk delete button configuration
  const handleBulkDelete = async (items: Warehouse[]) => {
    return onBulkDeleteWarehouses(items, () => {
      setSelectedWarehouses([]);
    });
  };

  const debouncedSearch = debounce((searchTerm: string) => {
    handleSearch(searchTerm);
  }, 500);

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoToneIcon />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Delete, 'Warehouse'),
    disabled: selectedWarehouses.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('confirm.bulk.delete.question'),
    variant: 'contained'
  };

  const allButtons = [deleteButton];

  // FilterPopover options - use LocationFilter
  const filterOptions: FilterOption[] = [];

  if (isSuperAdmin) {
    filterOptions.push({
      id: 'location',
      label: t('location'),
      component: (
        <LocationFilter
          companyId={filters.companyId}
          branchId={filters.branchId}
          onCompanyChange={handleCompanyChange}
          onBranchChange={handleBranchChange}
        />
      )
    });
  }

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        maxWidth: '90%'
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
              <Box flex={1} p={2}>
                <BulkActions<Warehouse>
                  selected={selectedWarehouses}
                  buttons={allButtons}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                action={
                  <Box display="flex" alignItems="center" gap={2}>
                    <FormControl sx={{ minWidth: 200 }}>
                      <OutlinedInput
                        size="small"
                        placeholder={`${t('search')}...`}
                        defaultValue={filters.search}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        }
                      />
                    </FormControl>

                    <FilterPopover
                      filterOptions={filterOptions}
                      onApplyFilters={handleApplyFilters}
                      onResetFilters={handleResetFilters}
                      activeFiltersCount={getActiveFiltersCount()}
                    />

                    {onAdd && (
                      <Can I="create" a="Warehouse" ability={ability}>
                        <Button
                          variant="contained"
                          startIcon={<AddTwoToneIcon />}
                          onClick={onAdd}
                        >
                          {t('add.warehouse')}
                        </Button>
                      </Can>
                    )}
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('warehouses')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={() => {
                          onFilterChange({
                            ...filters,
                            page: filters.page || 0
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
                        onClick={
                          header.id === 'checkbox'
                            ? handleSelectClick
                            : undefined
                        }
                      >
                        {header.id === 'checkbox' ? (
                          <Checkbox
                            color="primary"
                            checked={selectedAllWarehouses}
                            indeterminate={selectedSomeWarehouses}
                            onChange={handleSelectAllWarehouses}
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
                  ) : warehouses.length === 0 ? (
                    <NoDataFound
                      message={t('no.warehouses.found')}
                      colSpan={tableHeaders.length}
                    />
                  ) : (
                    warehouses.map((warehouse) => {
                      const isWarehouseSelected = selectedWarehouses.some(
                        (w) => w.id === warehouse.id
                      );
                      return (
                        <TableRow
                          hover
                          key={warehouse.id}
                          selected={isWarehouseSelected}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={handleSelectClick}
                          >
                            <Checkbox
                              color="primary"
                              checked={isWarehouseSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
                                event.stopPropagation();
                                handleSelectOneWarehouse(event, warehouse.id);
                              }}
                              value={isWarehouseSelected}
                              onClick={handleSelectClick}
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
                              {warehouse.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <Typography
                                variant="body1"
                                color="text.primary"
                                noWrap
                              >
                                {warehouse.name}
                              </Typography>
                              {warehouse.isDefault && (
                                <Tooltip
                                  title={t('default.warehouse')}
                                  arrow
                                  placement="top"
                                >
                                  <Star
                                    sx={{
                                      fontSize: 18,
                                      color: 'warning.main',
                                      display: 'flex'
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>

                          {(isSuperAdmin || isCompanyAdmin) && isAdminView && (
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {warehouse.branch?.name || '-'}
                              </Typography>
                              {isSuperAdmin &&
                                warehouse.branch?.company?.name && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    noWrap
                                  >
                                    {warehouse.branch.company.name}
                                  </Typography>
                                )}
                            </TableCell>
                          )}

                          <TableCell align="center">
                            <StatusLabel
                              status={warehouse.isActive ? 'ACTIVE' : 'PASSIVE'}
                            />
                          </TableCell>

                          <TableCell sx={{ maxWidth: '200px' }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                              sx={{
                                wordWrap: 'break-word',
                                whiteSpace: 'normal'
                              }}
                            >
                              {warehouse.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={t('view.details')} arrow>
                              <IconButton
                                sx={{
                                  '&:hover': {
                                    background: theme.colors.info.lighter
                                  },
                                  color: theme.palette.info.main
                                }}
                                color="inherit"
                                size="small"
                                onClick={() =>
                                  navigate(
                                    `/management/warehouses/${warehouse.id}`
                                  )
                                }
                              >
                                <VisibilityTwoToneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Can I="update" a="Warehouse" ability={ability}>
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
                                  onClick={() => onEdit(warehouse)}
                                >
                                  <EditTwoToneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                            <Can I="delete" a="Warehouse" ability={ability}>
                              <Tooltip title={t('delete')} arrow>
                                <IconButton
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.error.lighter
                                    },
                                    color: theme.palette.error.main
                                  }}
                                  color="inherit"
                                  size="small"
                                  onClick={() => onDelete(warehouse.id)}
                                >
                                  <DeleteTwoToneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
                rowsPerPageOptions={rowsPerPageOptions}
                labelRowsPerPage={t('rows.per.page')}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WarehousesTable;
