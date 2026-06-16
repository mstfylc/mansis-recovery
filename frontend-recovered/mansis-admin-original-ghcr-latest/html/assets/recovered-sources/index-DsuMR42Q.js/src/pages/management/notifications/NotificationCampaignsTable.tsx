import React, { FC, ChangeEvent, useContext } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
  Button
} from '@mui/material';
import {
  Add,
  SearchOutlined,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import StatusLabel from '@/components/StatusLabel';
import NoDataFound from '@/components/NoDataFound';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import StatusFilter from '@/components/filters/StatusFilter';
import { useTableFilters } from '@/hooks/useTableFilters';
import { NotificationCampaign } from '@/types/Notification.interface';
import { Filters } from '@/types/Filters';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { debounce } from '@/utils/helpers';

interface NotificationCampaignsTableProps {
  campaigns: NotificationCampaign[];
  loading: boolean;
  totalCount: number;
  onFilterChange: (filters: Filters) => void;
}

const NotificationCampaignsTable: FC<NotificationCampaignsTableProps> = ({
  campaigns,
  loading,
  totalCount,
  onFilterChange
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const notificationStatusMap = {
    DRAFT: {
      text: t('notification.status.draft'),
      color: 'secondary' as const
    },
    SCHEDULED: {
      text: t('notification.status.scheduled'),
      color: 'info' as const
    },
    SENDING: {
      text: t('notification.status.sending'),
      color: 'warning' as const
    },
    SENT: { text: t('notification.status.sent'), color: 'success' as const },
    CANCELLED: {
      text: t('notification.status.cancelled'),
      color: 'error' as const
    },
    FAILED: { text: t('notification.status.failed'), color: 'error' as const },
    PARTIALLY_SENT: {
      text: t('notification.status.partially_sent'),
      color: 'warning' as const
    }
  };
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
    pageKey: 'notification-campaigns'
  });

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

  const handleSearch = debounce((value: string) => {
    handleSearchFilter(value);
  }, 500);

  const tableHeaders = [
    {
      id: 'title',
      label: t('notification.campaign.title'),
      align: 'left' as const
    },
    {
      id: 'category',
      label: t('notification.campaign.category'),
      align: 'center' as const
    },
    {
      id: 'status',
      label: t('notification.campaign.status'),
      align: 'center' as const
    },
    {
      id: 'totalRecipients',
      label: t('notification.campaign.recipients'),
      align: 'center' as const
    },
    {
      id: 'sentAt',
      label: t('notification.campaign.sentAt'),
      align: 'center' as const
    },
    { id: 'actions', label: t('actions'), align: 'center' as const }
  ];

  const filterOptions: FilterOption[] = [
    {
      id: 'status',
      label: t('filters.status'),
      component: (
        <StatusFilter
          value={filters.status}
          onChange={handleStatusChange}
          size="small"
        />
      )
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
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="span">
                    {t('notification.campaign.list')}
                  </Typography>
                  <Tooltip arrow title={t('refresh.list')}>
                    <IconButton
                      onClick={() => onFilterChange({ ...filters })}
                      sx={{
                        ml: 1,
                        '&:hover': { background: theme.colors.primary.lighter },
                        color: theme.palette.primary.main
                      }}
                    >
                      <RefreshTwoToneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
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
                  <Can I="create" a="Notification" ability={ability}>
                    <Button
                      startIcon={<Add />}
                      onClick={() =>
                        navigate('/management/notifications/create')
                      }
                      sx={{ minWidth: 140, ml: 2 }}
                      variant="contained"
                      color="primary"
                    >
                      <Typography>
                        {t('notification.campaign.create')}
                      </Typography>
                    </Button>
                  </Can>
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
                  ) : campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <TableRow hover key={campaign.id}>
                        <TableCell>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color="text.primary"
                            noWrap
                          >
                            {campaign.title}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={t(
                              `notification.category.${campaign.category?.toLowerCase()}`
                            )}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <StatusLabel
                            status={campaign.status}
                            customMap={notificationStatusMap}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1">
                            {campaign.totalRecipients}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {campaign.sentAt
                            ? formatDateToDayMonthYearTime(campaign.sentAt)
                            : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={t('common.detail')} arrow>
                            <IconButton
                              onClick={() =>
                                navigate(
                                  `/management/notifications/${campaign.id}`
                                )
                              }
                              sx={{
                                '&:hover': {
                                  background: theme.colors.info.lighter
                                },
                                color: theme.palette.info.main
                              }}
                              size="small"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <NoDataFound
                      message={t('notification.campaign.noData')}
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
                rowsPerPageOptions={[10, 25, 50]}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NotificationCampaignsTable;
