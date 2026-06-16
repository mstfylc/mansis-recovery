import React, { useState, ChangeEvent, useContext, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Checkbox,
  Chip,
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
  FormControl as MuiFormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  EditTwoTone,
  DeleteTwoTone,
  RefreshTwoTone,
  Add
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';
import { CHANGELOG_APPS, CHANGELOG_CATEGORIES } from '@/constants/changelog';
import type {
  ChangelogRelease,
  ChangelogApp,
  ChangelogCategory
} from '@/types/ChangelogRelease.interface';
import BulkActions, { BulkActionButtonConfig } from '@/components/BulkActions';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import NoDataFound from '@/components/NoDataFound';
import { debounce } from '@/utils/helpers';
import { SearchOutlined } from '@mui/icons-material';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';

function getCategoryLabel(
  category: ChangelogCategory,
  t: (key: string) => string
): string {
  return t(`changelog.category.${category}`);
}

function getAppLabel(app: ChangelogApp, t: (key: string) => string): string {
  return t(`changelog.app.${app}`);
}

interface ChangelogTableProps {
  releases: ChangelogRelease[];
  loading: boolean;
  setShowNewDialog: (show: boolean) => void;
  onEdit: (release: ChangelogRelease) => void;
  onDelete: (id: number) => void;
  onBulkDelete: (
    releases: ChangelogRelease[],
    onSuccess?: () => void
  ) => Promise<void>;
  onRefresh: () => void;
  rowsPerPageOptions?: number[];
}

const ChangelogTable = ({
  releases,
  loading,
  setShowNewDialog,
  onEdit,
  onDelete,
  onBulkDelete,
  onRefresh,
  rowsPerPageOptions = [10, 30, 50, 100]
}: ChangelogTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const [search, setSearch] = useState('');
  const [appFilter, setAppFilter] = useState<ChangelogApp | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ChangelogCategory | ''>(
    ''
  );
  const [pendingAppFilter, setPendingAppFilter] = useState<ChangelogApp | ''>(
    ''
  );
  const [pendingCategoryFilter, setPendingCategoryFilter] = useState<
    ChangelogCategory | ''
  >('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedReleases, setSelectedReleases] = useState<ChangelogRelease[]>(
    []
  );

  const filteredReleases = releases.filter((release) => {
    const matchesApp = !appFilter || release.app === appFilter;
    const matchesCategory =
      !categoryFilter ||
      (release.items ?? []).some((item) => item.category === categoryFilter);
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      release.version.toLowerCase().includes(searchLower) ||
      (release.items ?? []).some(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      );
    return matchesApp && matchesCategory && matchesSearch;
  });

  const paginatedReleases = filteredReleases.slice(
    page * limit,
    page * limit + limit
  );
  const totalCount = filteredReleases.length;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalCount / limit) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalCount, limit, page]);

  const selectedBulkActions = selectedReleases.length > 0;
  const selectedSomeReleases =
    selectedReleases.length > 0 &&
    selectedReleases.length < paginatedReleases.length;
  const selectedAllReleases =
    paginatedReleases.length > 0 &&
    selectedReleases.length === paginatedReleases.length;

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelectedReleases(event.target.checked ? paginatedReleases : []);
  };

  const handleSelectOne = (
    _event: ChangeEvent<HTMLInputElement>,
    releaseId: number
  ): void => {
    const release = paginatedReleases.find((r) => r.id === releaseId);
    if (!release) return;
    if (!selectedReleases.find((r) => r.id === releaseId)) {
      setSelectedReleases((prev) => [...prev, release]);
    } else {
      setSelectedReleases((prev) => prev.filter((r) => r.id !== releaseId));
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setPage(newPage);
    setSelectedReleases([]);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newLimit = parseInt(event.target.value);
    setLimit(newLimit);
    setPage(0);
    setSelectedReleases([]);
  };

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(0);
  }, 500);

  const handlePendingAppChange = (value: ChangelogApp | '') => {
    setPendingAppFilter(value);
  };

  const handlePendingCategoryChange = (value: ChangelogCategory | '') => {
    setPendingCategoryFilter(value);
  };

  const handleFilterPopoverOpen = () => {
    setPendingAppFilter(appFilter);
    setPendingCategoryFilter(categoryFilter);
  };

  const handleApplyFilters = () => {
    setAppFilter(pendingAppFilter);
    setCategoryFilter(pendingCategoryFilter);
    setPage(0);
    setSelectedReleases([]);
  };

  const handleResetFilters = () => {
    setPendingAppFilter('');
    setPendingCategoryFilter('');
    setAppFilter('');
    setCategoryFilter('');
    setPage(0);
    setSelectedReleases([]);
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (appFilter) count++;
    if (categoryFilter) count++;
    return count;
  };

  const handleBulkDelete = async (selected: ChangelogRelease[]) => {
    try {
      await onBulkDelete(selected, () => setSelectedReleases([]));
    } catch (err) {
      setSelectedReleases([]);
      throw err;
    }
  };

  const deleteButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleBulkDelete,
    showCondition: ability.can(Action.Manage, 'ChangelogRelease'),
    disabled: selectedReleases.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.bulk.delete'),
    confirmMessage: t('confirm.bulk.delete.question'),
    variant: 'contained'
  };

  const filterOptions: FilterOption[] = [
    {
      id: 'app',
      label: t('changelog.filterByApp'),
      component: (
        <MuiFormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>{t('changelog.filterByApp')}</InputLabel>
          <Select
            value={pendingAppFilter}
            label={t('changelog.filterByApp')}
            onChange={(e) =>
              handlePendingAppChange(e.target.value as ChangelogApp | '')
            }
          >
            <MenuItem value="">{t('changelog.allApps')}</MenuItem>
            {CHANGELOG_APPS.map((app) => (
              <MenuItem key={app} value={app}>
                {getAppLabel(app, t)}
              </MenuItem>
            ))}
          </Select>
        </MuiFormControl>
      )
    },
    {
      id: 'category',
      label: t('changelog.filterByCategory'),
      component: (
        <MuiFormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>{t('changelog.filterByCategory')}</InputLabel>
          <Select
            value={pendingCategoryFilter}
            label={t('changelog.filterByCategory')}
            onChange={(e) =>
              handlePendingCategoryChange(
                e.target.value as ChangelogCategory | ''
              )
            }
          >
            <MenuItem value="">{t('changelog.allCategories')}</MenuItem>
            {CHANGELOG_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {getCategoryLabel(category, t)}
              </MenuItem>
            ))}
          </Select>
        </MuiFormControl>
      )
    }
  ];

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left' as const,
      padding: 'checkbox' as const
    },
    { id: 'version', label: t('changelog.version'), align: 'left' as const },
    { id: 'date', label: t('changelog.date'), align: 'left' as const },
    { id: 'app', label: t('changelog.app'), align: 'left' as const },
    { id: 'items', label: t('changelog.items'), align: 'left' as const },
    { id: 'actions', label: t('actions'), align: 'center' as const }
  ];

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
              <Box flex={1} p={2} className="changelog-bulk-actions">
                <BulkActions<ChangelogRelease>
                  selected={selectedReleases}
                  buttons={[deleteButton]}
                />
              </Box>
            )}
            {!selectedBulkActions && (
              <CardHeader
                className="changelog-filters"
                action={
                  <Box display="flex" alignItems="center" width="100%">
                    <FormControl sx={{ minWidth: 200, mr: 2 }}>
                      <OutlinedInput
                        placeholder={`${t('search')}...`}
                        defaultValue={search}
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
                      onOpen={handleFilterPopoverOpen}
                      activeFiltersCount={getActiveFiltersCount()}
                    />

                    <Can I="manage" a="ChangelogRelease" ability={ability}>
                      <Button
                        className="changelog-add-button"
                        startIcon={<Add />}
                        onClick={() => setShowNewDialog(true)}
                        sx={{ minWidth: 140, ml: 2 }}
                        variant="contained"
                        color="primary"
                      >
                        <Typography>{t('changelog.create')}</Typography>
                      </Button>
                    </Can>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('changelog.management.title')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={onRefresh}
                        disabled={loading}
                        sx={{
                          ml: 1,
                          '&:hover': {
                            background: theme.colors.primary.lighter
                          },
                          color: theme.palette.primary.main
                        }}
                        className="changelog-refresh"
                      >
                        <RefreshTwoTone fontSize="small" />
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
                        align={header.align}
                        padding={header.padding}
                        onClick={
                          header.id === 'checkbox'
                            ? handleSelectClick
                            : undefined
                        }
                      >
                        {header.id === 'checkbox' ? (
                          <Checkbox
                            color="primary"
                            checked={selectedAllReleases}
                            indeterminate={selectedSomeReleases}
                            onChange={handleSelectAll}
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
                  ) : paginatedReleases.length > 0 ? (
                    paginatedReleases.map((release) => {
                      const isSelected = selectedReleases.some(
                        (r) => r.id === release.id
                      );
                      const itemCount = (release.items ?? []).length;
                      const firstItem = (release.items ?? [])[0];
                      return (
                        <TableRow
                          hover
                          key={release.id}
                          selected={isSelected}
                          className="changelog-row"
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={handleSelectClick}
                          >
                            <Checkbox
                              color="primary"
                              checked={isSelected}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => handleSelectOne(event, release.id)}
                              onClick={handleSelectClick}
                            />
                          </TableCell>
                          <TableCell>{release.version}</TableCell>
                          <TableCell>
                            {formatDateToDayMonthYear(release.date)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getAppLabel(release.app, t)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {itemCount > 0 ? (
                              <Chip
                                label={
                                  itemCount === 1
                                    ? (firstItem?.title ?? t('changelog.items'))
                                    : t('changelog.itemsCount', {
                                        count: itemCount
                                      })
                                }
                                size="small"
                                sx={{ maxWidth: 200 }}
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell
                            align="center"
                            onClick={handleSelectClick}
                            className="changelog-actions"
                          >
                            <Can
                              I="update"
                              a="ChangelogRelease"
                              ability={ability}
                            >
                              <Tooltip title={t('edit')} arrow>
                                <IconButton
                                  onClick={() => onEdit(release)}
                                  sx={{
                                    '&:hover': {
                                      background: theme.colors.primary.lighter
                                    },
                                    color: theme.palette.primary.main
                                  }}
                                  color="inherit"
                                  size="small"
                                >
                                  <EditTwoTone fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Can>
                            <Can
                              I="delete"
                              a="ChangelogRelease"
                              ability={ability}
                            >
                              <Tooltip title={t('delete')} arrow>
                                <IconButton
                                  onClick={() => onDelete(release.id)}
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
                      message={
                        releases.length === 0
                          ? t('changelog.management.empty')
                          : t('no.changelog.found')
                      }
                      colSpan={tableHeaders.length}
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
                page={totalCount ? page : 0}
                rowsPerPage={limit}
                rowsPerPageOptions={rowsPerPageOptions}
                className="changelog-pagination"
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChangelogTable;
