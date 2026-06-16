import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  CircularProgress,
  useTheme,
  Divider,
  Stack,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { differenceInDays, format } from 'date-fns';
import { user$ } from '@/store/userStore';
import { Chart } from '@/components/Chart';
import type { ApexOptions } from 'apexcharts';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import { financeService } from '@/data/financeService';
import DateFilterBar from '@/components/filters/DateFilterBar';
import LocationFilter from '@/components/filters/LocationFilter';
import FilterPopover, {
  FilterOption
} from '@/components/filters/FilterPopover';
import { formatDateForApi, formatDateForChart } from '@/utils/dateFormatters';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { useFinanceFilters } from '@/hooks/useFinanceFilters';
import type { DateRange } from '@/types/DateRange.interface';

interface FinanceSummaryProps {
  dateRange: DateRange;
}
interface FinanceStats {
  totalEarnings: number;
  totalPaid: number;
  totalUnpaid: number;
  orderCount: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  summary: {
    date: string;
    amount: number;
  }[];
  branchDistribution: {
    branchName: string;
    amount: number;
  }[];
}

function FinanceSummary({ dateRange }: FinanceSummaryProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isBranchAdmin, currentBranch } = useUserViewMode();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<FinanceStats | null>(null);

  const fetchFinanceStats = async (filtersToUse: any) => {
    setLoading(true);
    try {
      const startDate = formatDateForApi(filtersToUse.startDate);
      const endDate = formatDateForApi(filtersToUse.endDate);
      const timezone =
        filtersToUse.timezone ??
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const summaryResponse = await financeService.getSummary({
        startDate,
        endDate,
        timezone,
        ...(filtersToUse.companyId
          ? { companyId: filtersToUse.companyId }
          : {}),
        ...(filtersToUse.branchId ? { branchId: filtersToUse.branchId } : {})
      });

      let totalEarnings = 0;
      let totalPaid = 0;
      let totalUnpaid = 0;
      let orderCount = 0;
      let pendingWithdrawals = 0;
      let approvedWithdrawals = 0;
      let branchDistribution: { branchName: string; amount: number }[] = [];
      let summary: { date: string; amount: number }[] = [];

      if (summaryResponse) {
        const summaryData = summaryResponse;
        totalEarnings = summaryData.earnings.total;
        totalPaid = summaryData.earnings.paid;
        totalUnpaid = summaryData.earnings.pending;
        orderCount = summaryData.earnings.orderCount;
        pendingWithdrawals = summaryData.withdrawals.pendingCount;
        approvedWithdrawals = summaryData.withdrawals.approvedAmount;

        if (summaryData.branches) {
          branchDistribution = summaryData.branches.map((branch) => ({
            branchName: branch.name,
            amount: branch.earnings.total
          }));
        } else if (summaryData.companies) {
          branchDistribution = summaryData.companies.map((company) => ({
            branchName: company.name,
            amount: company.earnings.total
          }));
        } else if (summaryData.branch) {
          branchDistribution = [
            {
              branchName: summaryData.branch.name,
              amount: totalEarnings
            }
          ];
        }

        if (
          summaryData.dailyBreakdown &&
          summaryData.dailyBreakdown.length > 0
        ) {
          const dateMap = new Map<string, number>();

          summaryData.dailyBreakdown.forEach((item) => {
            const itemDate = new Date(item.date);
            const dateKey = formatDateForChart(itemDate);
            const currentAmount = dateMap.get(dateKey) || 0;
            dateMap.set(dateKey, currentAmount + item.amount);
          });

          summary = Array.from(dateMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => {
              const aDay = parseInt(a.date.split(' ')[0]);
              const bDay = parseInt(b.date.split(' ')[0]);
              return aDay - bDay;
            });
        }
      }

      setStats({
        totalEarnings,
        totalPaid,
        totalUnpaid,
        orderCount,
        pendingWithdrawals,
        approvedWithdrawals,
        summary,
        branchDistribution
      });
    } catch {
      setStats({
        totalEarnings: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        orderCount: 0,
        pendingWithdrawals: 0,
        approvedWithdrawals: 0,
        summary: [],
        branchDistribution: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const {
    filters,
    appliedFilters,
    handleDateRangeChange,
    handleCompanyChange,
    handleBranchChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  } = useFinanceFilters({
    initialDateRange: dateRange,
    initialBranchId: currentBranch ? currentBranch.id : undefined,
    pageKey: 'finance-summary',
    onFilterApply: fetchFinanceStats
  });

  useEffect(() => {
    fetchFinanceStats(appliedFilters);
  }, []);

  const donutChartOptions: ApexOptions = {
    chart: {
      background: 'transparent',
      type: 'pie',
      toolbar: {
        show: false
      }
    },
    labels: stats ? [t('finance.total.paid'), t('finance.total.unpaid')] : [],
    colors: [theme.colors.success.main, theme.colors.error.main],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: {
        colors: theme.palette.text.secondary
      },
      markers: {
        size: 12
      }
    },
    stroke: {
      width: 0
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return `${val.toFixed(1)}%`;
      },
      style: {
        fontSize: '12px'
      },
      dropShadow: {
        enabled: false
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: function (value: number, { w }: any) {
          if (!w || !w.globals || !w.globals.seriesTotals) {
            return `${value.toLocaleString()} ${t('tl')}`;
          }
          const total = w.globals.seriesTotals.reduce(
            (a: number, b: number) => a + b,
            0
          );
          if (total === 0) {
            return `${value.toLocaleString()} ${t('tl')}`;
          }
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value.toLocaleString()} ${t('tl')} (${percentage}%)`;
        }
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '0%'
        }
      }
    },
    theme: {
      mode: theme.palette.mode
    }
  };

  const lineChartOptions: ApexOptions = {
    chart: {
      background: 'transparent',
      type: 'area',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    theme: {
      mode: theme.palette.mode
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 5,
        right: 0,
        bottom: 5,
        left: 0
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 0.2,
      type: 'solid'
    },
    colors: [theme.colors.primary.main],
    tooltip: {
      theme: theme.palette.mode,
      x: {
        format: 'dd MMM'
      },
      y: {
        formatter: function (val: number) {
          return val.toFixed(2) + ' ' + t('tl');
        }
      }
    },
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    }
  };

  const getChartTitle = () => {
    const days = differenceInDays(filters.endDate, filters.startDate) + 1;
    if (days > 31) {
      return t('finance.monthly.summary');
    }
    return t('finance.daily.summary');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFinanceStats(appliedFilters);
  };

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (
    !stats ||
    (stats.totalEarnings === 0 &&
      (!stats.branchDistribution || stats.branchDistribution.length === 0))
  ) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{
          p: 5,
          minHeight: 400,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.8
          )} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
          borderRadius: theme.shape.borderRadius,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {t('finance.no.earnings.found')}
        </Typography>
        <Tooltip title={t('dashboard.refresh.data')}>
          <IconButton
            onClick={handleRefresh}
            color="primary"
            className="finance-refresh-button"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  const filterOptions: FilterOption[] = [
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
          size="small"
          initialDateRange={{
            startDate: filters.startDate,
            endDate: filters.endDate,
            preset: filters.preset
          }}
        />
      )
    }
  ];

  if (!isBranchAdmin) {
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

  return (
    <Grid container spacing={1.5}>
      <Grid
        item
        xs={12}
        sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}
      >
        <FilterPopover
          filterOptions={filterOptions}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          activeFiltersCount={getActiveFiltersCount()}
        />
        <Tooltip title={t('dashboard.refresh.data')}>
          <IconButton
            onClick={handleRefresh}
            color="primary"
            disabled={refreshing}
            size="small"
            className="finance-refresh-button"
          >
            {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Grid>

      {/* First Row - Main 4 Cards */}
      <Grid item xs={12} className="finance-summary-cards">
        <Grid container spacing={1.5}>
          <Grid item xs={6} sm={3} lg={3}>
            <Card
              sx={{
                p: 1.5,
                height: '100%',
                minHeight: 85,
                background: `linear-gradient(135deg, ${alpha(
                  theme.colors.success.main,
                  0.1
                )} 0%, ${alpha(theme.colors.success.dark, 0.2)} 100%)`,
                borderRadius: 1,
                boxShadow: theme.shadows[2],
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4
                }}
              >
                <AttachMoneyIcon
                  sx={{
                    fontSize: 24,
                    color: alpha(theme.colors.success.main, 0.15),
                    transform: 'rotate(15deg)'
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="textSecondary"
                fontWeight="bold"
                sx={{
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  lineHeight: 1.2
                }}
              >
                {t('finance.total.earnings')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
                <Typography
                  variant="h5"
                  color="success.main"
                  fontWeight="bold"
                  sx={{ mr: 0.5, fontSize: '1.3rem' }}
                >
                  {stats?.totalEarnings.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {t('tl')}
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3} lg={3}>
            <Card
              sx={{
                p: 1.5,
                height: '100%',
                minHeight: 85,
                background: `linear-gradient(135deg, ${alpha(
                  theme.colors.primary.main,
                  0.1
                )} 0%, ${alpha(theme.colors.primary.dark, 0.2)} 100%)`,
                borderRadius: 1,
                boxShadow: theme.shadows[2],
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4
                }}
              >
                <AccountBalanceWalletIcon
                  sx={{
                    fontSize: 24,
                    color: alpha(theme.colors.primary.main, 0.15),
                    transform: 'rotate(15deg)'
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="textSecondary"
                fontWeight="bold"
                sx={{
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  lineHeight: 1.2
                }}
              >
                {t('finance.total.paid')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
                <Typography
                  variant="h5"
                  color="primary.main"
                  fontWeight="bold"
                  sx={{ mr: 0.5, fontSize: '1.3rem' }}
                >
                  {stats?.totalPaid.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {t('tl')}
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3} lg={3}>
            <Card
              sx={{
                p: 1.5,
                height: '100%',
                minHeight: 85,
                background: `linear-gradient(135deg, ${alpha(
                  theme.colors.error.main,
                  0.1
                )} 0%, ${alpha(theme.colors.error.dark, 0.2)} 100%)`,
                borderRadius: 1,
                boxShadow: theme.shadows[2],
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4
                }}
              >
                <MoneyOffIcon
                  sx={{
                    fontSize: 24,
                    color: alpha(theme.colors.error.main, 0.15),
                    transform: 'rotate(15deg)'
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="textSecondary"
                fontWeight="bold"
                sx={{
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  lineHeight: 1.2
                }}
              >
                {t('finance.total.unpaid')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
                <Typography
                  variant="h5"
                  color="error.main"
                  fontWeight="bold"
                  sx={{ mr: 0.5, fontSize: '1.3rem' }}
                >
                  {stats?.totalUnpaid.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {t('tl')}
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3} lg={3}>
            <Card
              sx={{
                p: 1.5,
                height: '100%',
                minHeight: 85,
                background: `linear-gradient(135deg, ${alpha(
                  theme.colors.warning.main,
                  0.1
                )} 0%, ${alpha(theme.colors.warning.dark, 0.2)} 100%)`,
                borderRadius: 1,
                boxShadow: theme.shadows[2],
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4
                }}
              >
                <CurrencyExchangeIcon
                  sx={{
                    fontSize: 24,
                    color: alpha(theme.colors.warning.main, 0.15),
                    transform: 'rotate(15deg)'
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="textSecondary"
                fontWeight="bold"
                sx={{
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  lineHeight: 1.2
                }}
              >
                {t('finance.order.count')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
                <Typography
                  variant="h5"
                  color="warning.main"
                  fontWeight="bold"
                  sx={{ mr: 0.5, fontSize: '1.3rem' }}
                >
                  {stats?.orderCount?.toLocaleString() || 0}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {t('orders')}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Second Row - Charts and Stacked Cards */}
      {/* Payment Distribution Chart */}
      <Grid item xs={12} md={6} lg={5}>
        <Card
          sx={{
            p: 2,
            height: '100%',
            minHeight: 380,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
          className="finance-payment-chart"
        >
          <Typography
            variant="h6"
            color="textPrimary"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: '1rem' }}
          >
            {t('finance.payment.status')}
          </Typography>
          <Divider sx={{ my: 1, opacity: 0.3 }} />
          <Box
            sx={{
              height: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {stats && stats.totalEarnings > 0 ? (
              <Chart
                options={donutChartOptions}
                series={[stats.totalPaid, stats.totalUnpaid]}
                type="pie"
                height={280}
              />
            ) : (
              <Typography variant="body2" color="textSecondary">
                {t('dashboard.no.data')}
              </Typography>
            )}
          </Box>
          {stats && stats.totalEarnings > 0 && (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              mt={1}
              divider={<Divider orientation="vertical" flexItem />}
            >
              <Box textAlign="center">
                <Typography
                  variant="h6"
                  color="success.main"
                  fontWeight="bold"
                  sx={{ fontSize: '1rem' }}
                >
                  {Math.round((stats?.totalPaid / stats?.totalEarnings) * 100)}%
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem' }}
                >
                  {t('finance.payment.status.paid')}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h6"
                  color="error.main"
                  fontWeight="bold"
                  sx={{ fontSize: '1rem' }}
                >
                  {Math.round(
                    (stats?.totalUnpaid / stats?.totalEarnings) * 100
                  )}
                  %
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem' }}
                >
                  {t('finance.payment.status.not.paid')}
                </Typography>
              </Box>
            </Stack>
          )}
        </Card>
      </Grid>

      {/* Daily Earnings Line Chart */}
      <Grid item xs={12} md={6} lg={4}>
        <Card
          sx={{
            p: 2,
            height: '100%',
            minHeight: 380,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
          className="finance-earnings-chart"
        >
          <Typography
            variant="h6"
            color="textPrimary"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: '1rem' }}
          >
            {getChartTitle()}
          </Typography>
          <Divider sx={{ my: 1, opacity: 0.3 }} />
          <Box
            sx={{
              height: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {stats && stats.summary && stats.summary.length > 0 ? (
              <Chart
                options={{
                  ...lineChartOptions,
                  xaxis: {
                    ...lineChartOptions.xaxis,
                    categories: stats.summary.map((item) => item.date)
                  }
                }}
                series={[
                  {
                    name: getChartTitle(),
                    data: stats.summary.slice(0, 4).map((item) => item.amount)
                  }
                ]}
                type="area"
                height={320}
              />
            ) : (
              <Typography variant="body2" color="textSecondary">
                {t('dashboard.no.data')}
              </Typography>
            )}
          </Box>
        </Card>
      </Grid>

      {/* Stacked Cards Column */}
      <Grid item xs={12} md={12} lg={3} className="finance-withdrawal-cards">
        <Stack spacing={1.5} sx={{ height: '100%' }}>
          {/* Pending Withdrawals Card */}
          <Card
            sx={{
              p: 2,
              flex: 1,
              background: `linear-gradient(135deg, ${alpha(
                theme.colors.info.main,
                0.1
              )} 0%, ${alpha(theme.colors.info.dark, 0.2)} 100%)`,
              borderRadius: 1,
              boxShadow: theme.shadows[2],
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8
              }}
            >
              <AccountBalanceWalletIcon
                sx={{
                  fontSize: 32,
                  color: alpha(theme.colors.info.main, 0.15),
                  transform: 'rotate(15deg)'
                }}
              />
            </Box>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              fontWeight="bold"
              sx={{
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                lineHeight: 1.3,
                mb: 1
              }}
            >
              {t('finance.pending.withdrawals')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
              <Typography
                variant="h4"
                color="info.main"
                fontWeight="bold"
                sx={{ mr: 0.5, fontSize: '1.3rem' }}
              >
                {stats?.pendingWithdrawals || 0}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.8rem' }}
              >
                {t('pending')}
              </Typography>
            </Box>
          </Card>

          {/* Approved Withdrawals Card */}
          <Card
            sx={{
              p: 2,
              flex: 1,
              background: `linear-gradient(135deg, ${alpha(
                theme.colors.success.main,
                0.1
              )} 0%, ${alpha(theme.colors.success.dark, 0.2)} 100%)`,
              borderRadius: 1,
              boxShadow: theme.shadows[2],
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8
              }}
            >
              <AttachMoneyIcon
                sx={{
                  fontSize: 32,
                  color: alpha(theme.colors.success.main, 0.15),
                  transform: 'rotate(15deg)'
                }}
              />
            </Box>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              fontWeight="bold"
              sx={{
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                lineHeight: 1.3,
                mb: 1
              }}
            >
              {t('finance.approved.withdrawals')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
              <Typography
                variant="h4"
                color="success.main"
                fontWeight="bold"
                sx={{ mr: 0.5, fontSize: '1.3rem' }}
              >
                {stats?.approvedWithdrawals?.toLocaleString() || 0}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.8rem' }}
              >
                {t('tl')}
              </Typography>
            </Box>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default FinanceSummary;
