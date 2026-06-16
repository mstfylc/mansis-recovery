import React, { useState, ChangeEvent, useEffect, useContext } from 'react';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import {
  Box,
  Card,
  CardHeader,
  Checkbox,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Grid,
  Typography,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
  Button,
  useTheme,
  Tooltip,
  IconButton
} from '@mui/material';
import BulkActions from '@/components/BulkActions';
import { ChildActivity } from '@/types/ChildActivity.interface';
import { Add, DeleteTwoTone, SearchOutlined } from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import NoDataFound from '@/components/NoDataFound';

interface ChildActivitiesTableProps {
  childActivities: ChildActivity[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
  tableTitle?: string;
  customButtons?: any[];
  notApplyPadding?: boolean;
  rowsPerPageOptions?: number[];
  limit?: number;
  hideColumns?: string[];
  onSelectedChildActivitiesChange?: (childActivities: ChildActivity[]) => void;
  hideDeleteButton?: boolean;
  hideAddButton?: boolean;
  addButtonText?: string;
  setShowNewChildActivityDialog?: (show: boolean) => void;
}

const ChildActivitiesTable = ({
  childActivities = [],
  loading,
  totalCount,
  onFilterChange,
  tableTitle,
  customButtons = [],
  notApplyPadding = false,
  rowsPerPageOptions = [10, 30, 50, 100],
  limit: initialLimit,
  hideColumns = [],
  onSelectedChildActivitiesChange,
  hideDeleteButton = false,
  hideAddButton = false,
  addButtonText,
  setShowNewChildActivityDialog
}: ChildActivitiesTableProps) => {
  const [selectedChildActivities, setSelectedChildActivities] = useState<
    ChildActivity[]
  >([]);
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const selectedBulkActions = selectedChildActivities.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(initialLimit || 10);
  const selectedSomeChildActivities =
    selectedChildActivities.length > 0 &&
    selectedChildActivities.length < childActivities.length;
  const selectedAllChildActivities =
    selectedChildActivities.length === childActivities.length;

  const [filters, setFilters] = useState<Filters>({
    search: ''
  });
  const { t } = useTranslation();

  const tableHeaders = [
    {
      id: 'checkbox',
      label: '',
      align: 'left',
      padding: 'checkbox'
    },
    {
      id: 'title',
      label: t('name'),
      align: 'left'
    },
    {
      id: 'activity',
      label: t('activity'),
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
      id: 'price',
      label: t('price'),
      align: 'right'
    },
    {
      id: 'capacity',
      label: t('capacity'),
      align: 'center'
    },
    {
      id: 'location',
      label: t('location'),
      align: 'left'
    }
  ].filter((header) => !hideColumns.includes(header.id));

  useEffect(() => {
    if (onSelectedChildActivitiesChange) {
      onSelectedChildActivitiesChange(selectedChildActivities);
    }
  }, [selectedChildActivities, onSelectedChildActivitiesChange]);

  const handleSelectAllChildActivities = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedChildActivities(event.target.checked ? childActivities : []);
  };

  const handleSelectOneChildActivity = (
    _event: ChangeEvent<HTMLInputElement> | null,
    childActivityId: number
  ): void => {
    const childActivity = childActivities.find((u) => u.id === childActivityId);
    if (!childActivity) return;

    if (!selectedChildActivities.find((u) => u.id === childActivityId)) {
      setSelectedChildActivities((prevSelected) => [
        ...prevSelected,
        childActivity
      ]);
    } else {
      setSelectedChildActivities((prevSelected) =>
        prevSelected.filter((u) => u.id !== childActivityId)
      );
    }
  };

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setPage(newPage);
    onFilterChange({
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
      search: filters.search,
      page: 0,
      limit: newLimit
    });
  };

  const handleSearch = debounce((searchTerm: string) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm
    }));
    setPage(0);
    onFilterChange({
      search: searchTerm,
      page: 0,
      limit
    });
  }, 300);

  const handleSelectClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleRowClick = (childActivity: ChildActivity) => {
    handleSelectOneChildActivity(null, childActivity.id);
  };

  const formatDateTime = (dateTime: string | Date) => {
    try {
      return format(new Date(dateTime), 'dd/MM/yyyy HH:mm');
    } catch {
      return '';
    }
  };

  const deleteButton = hideDeleteButton
    ? null
    : {
        label: 'delete',
        icon: <DeleteTwoTone />,
        color: 'error',
        onClick: () => {},
        showCondition: ability.can(Action.Delete, 'Activity'),
        disabled: selectedChildActivities.length === 0,
        position: 'left',
        showConfirmDialog: true,
        confirmTitle: t('confirm.bulk.delete'),
        confirmMessage: t('confirm.bulk.delete.question'),
        variant: 'contained'
      };

  const allButtons = deleteButton
    ? [deleteButton, ...customButtons]
    : [...customButtons];

  return (
    <Grid
      container
      spacing={3}
      sx={{
        padding: notApplyPadding ? 0 : 3
      }}
    >
      <Grid item xs={12}>
        <Card>
          {selectedBulkActions && (
            <Box flex={1} p={2}>
              <BulkActions<ChildActivity>
                selected={selectedChildActivities}
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
                      onChange={(e) => handleSearch(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <SearchOutlined />
                        </InputAdornment>
                      }
                      size="small"
                    />
                  </FormControl>

                  {!hideAddButton && (
                    <Can I="create" a="Activity" ability={ability}>
                      <Button
                        sx={{ ml: 2 }}
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setShowNewChildActivityDialog?.(true)}
                      >
                        {addButtonText || t('new.child.activity')}
                      </Button>
                    </Can>
                  )}
                </Box>
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {tableTitle || t('child.activities')}
                  </Typography>
                  <Tooltip arrow title={t('refresh.list')}>
                    <IconButton
                      onClick={() => {
                        onFilterChange({
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
                    >
                      <RefreshTwoToneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableCell
                      key={header.id}
                      align={header.align as 'left' | 'center' | 'right'}
                      padding={header.padding as 'checkbox' | 'none' | 'normal'}
                      onClick={
                        header.id === 'checkbox' ? handleSelectClick : undefined
                      }
                    >
                      {header.id === 'checkbox' ? (
                        <Checkbox
                          color="primary"
                          checked={selectedAllChildActivities}
                          indeterminate={selectedSomeChildActivities}
                          onChange={handleSelectAllChildActivities}
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
                ) : childActivities.length > 0 ? (
                  childActivities.map((childActivity) => {
                    const isChildActivitySelected =
                      selectedChildActivities.some(
                        (u) => u.id === childActivity.id
                      );
                    return (
                      <TableRow
                        hover
                        key={childActivity.id}
                        selected={isChildActivitySelected}
                        onClick={() => handleRowClick(childActivity)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isChildActivitySelected}
                            onChange={() =>
                              handleSelectOneChildActivity(
                                null,
                                childActivity.id
                              )
                            }
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
                            {childActivity.title}
                          </Typography>
                          {childActivity.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {childActivity.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body1"
                            color="text.primary"
                            gutterBottom
                            noWrap
                          >
                            {childActivity.activity?.title || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(childActivity.startDateTime)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(childActivity.endDateTime)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color="text.primary"
                            gutterBottom
                            noWrap
                          >
                            {childActivity.price}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body1"
                            color="text.primary"
                            gutterBottom
                            noWrap
                          >
                            {childActivity.capacity || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body1"
                            color="text.primary"
                            gutterBottom
                            noWrap
                          >
                            {childActivity.location || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <NoDataFound
                    message={t('no.child.activity.found')}
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
            />
          </Box>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ChildActivitiesTable;
