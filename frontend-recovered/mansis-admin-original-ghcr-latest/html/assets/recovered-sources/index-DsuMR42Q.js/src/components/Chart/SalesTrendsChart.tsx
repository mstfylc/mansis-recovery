import { FC, useEffect, useState, useMemo } from 'react';
import {
  Card,
  Box,
  useTheme,
  styled,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chart } from './index';
import { dashboardService } from '@/data/dashboardService';
import { PurchaseType } from '@/enums/purchase-type';
import DateFilterBar from '../filters/DateFilterBar';
import { DateRange } from '@/types/DateRange.interface';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { alpha } from '@mui/material/styles';
import { user$ } from '@/store/userStore';

type ChartSalesType =
  | 'all'
  | PurchaseType.CASH
  | PurchaseType.WALLET
  | PurchaseType.CAMPAIGN
  | PurchaseType.CARD
  | PurchaseType.DIRECT
  | PurchaseType.PHYSICAL_CARD
  | PurchaseType.LOYALTY_POINTS
  | PurchaseType.LOYALTY_POINTS_HYBRID
  | PurchaseType.MEMBERSHIP
  | PurchaseType.MIXED;

interface SalesTrendsChartProps {
  companyId?: number | null;
  branchId?: number | null;
}

function getSalesTypeSeriesKey(salesType: ChartSalesType): string {
  switch (salesType) {
    case 'all':
      return 'dashboard.all.sales';
    case PurchaseType.CASH:
      return 'dashboard.cash.sales';
    case PurchaseType.WALLET:
      return 'dashboard.wallet.sales';
    case PurchaseType.CAMPAIGN:
      return 'dashboard.campaign.sales';
    case PurchaseType.CARD:
      return 'dashboard.card.sales';
    case PurchaseType.DIRECT:
      return 'dashboard.direct.sales';
    case PurchaseType.PHYSICAL_CARD:
      return 'dashboard.physical.card.sales';
    case PurchaseType.LOYALTY_POINTS:
      return 'dashboard.loyalty.points.sales';
    case PurchaseType.LOYALTY_POINTS_HYBRID:
      return 'dashboard.loyalty.hybrid.sales';
    case PurchaseType.MEMBERSHIP:
      return 'dashboard.membership.purchase.sales';
    case PurchaseType.MIXED:
      return 'dashboard.mixed.sales';
  }
}

const SalesTrendsChartWrapper = styled(Card)(
  ({ theme }) => `
    padding: ${theme.spacing(2)};
    height: 100%;
`
);

const SalesTrendsChart: FC<SalesTrendsChartProps> = ({
  companyId,
  branchId
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [salesType, setSalesType] = useState<ChartSalesType>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);

    return {
      startDate: startOfDay(sevenDaysAgo),
      endDate: endOfDay(today),
      preset: 'last.7days',
      label: t('filters.date.last.7days')
    };
  });

  // Update series names when language changes
  useEffect(() => {
    if (seriesData.length > 0) {
      setSeriesData([
        {
          ...seriesData[0],
          name: t(getSalesTypeSeriesKey(salesType))
        }
      ]);
    }
  }, [i18n.language, t, salesType]);

  // Define chart series with memoization
  const chartSeries = useMemo(
    () => [
      {
        name: t(getSalesTypeSeriesKey(salesType)),
        data: seriesData.length > 0 ? seriesData[0].data : []
      }
    ],
    [salesType, seriesData, t]
  );

  const getSalesTypeColor = (type: ChartSalesType): string => {
    switch (type) {
      case 'all':
        return theme.colors.primary.main;
      case PurchaseType.CASH:
        return theme.colors.success.main;
      case PurchaseType.WALLET:
        return theme.colors.info.main;
      case PurchaseType.CAMPAIGN:
        return theme.colors.warning.main;
      case PurchaseType.CARD:
        return theme.colors.error.main;
      case PurchaseType.PHYSICAL_CARD:
        return theme.palette.grey[800];
      case PurchaseType.DIRECT:
        return theme.colors.secondary.main;
      case PurchaseType.LOYALTY_POINTS:
        return theme.colors.success.dark;
      case PurchaseType.LOYALTY_POINTS_HYBRID:
        return theme.colors.info.dark;
      case PurchaseType.MEMBERSHIP:
        return theme.colors.primary.dark;
      case PurchaseType.MIXED:
        return '#607D8B';
    }
  };

  // Define the chart options
  const chartOptions = {
    chart: {
      background: 'transparent',
      toolbar: {
        show: false
      },
      type: 'area',
      zoom: {
        enabled: false
      },
      sparkline: {
        enabled: false
      },
      fontFamily: theme.typography.fontFamily
    },
    colors: [getSalesTypeColor(salesType)],
    dataLabels: {
      enabled: false
    },
    theme: {
      mode: theme.palette.mode
    },
    fill: {
      opacity: 0.15,
      type: 'solid'
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      type: 'category',
      categories: categories,
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        },
        trim: true
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
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        },
        formatter: (val: number) =>
          `₺${val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      labels: {
        colors: theme.palette.text.secondary
      },
      itemMargin: {
        horizontal: 8
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val: number) => `₺${val.toFixed(2)}`
      }
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      padding: {
        right: 5,
        left: 5,
        top: 0,
        bottom: 5
      },
      show: true
    },
    markers: {
      size: 3,
      strokeWidth: 0
    }
  };

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      // Determine interval based on date range span
      const daysDiff = Math.ceil(
        (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let interval = 'day';
      if (daysDiff > 90) {
        interval = 'month';
      }

      // Format dates for API request
      const startDateStr = format(dateRange.startDate, 'yyyy-MM-dd');
      const endDateStr = format(dateRange.endDate, 'yyyy-MM-dd');
      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await dashboardService.getSalesTrends({
        startDate: startDateStr,
        endDate: endDateStr,
        interval,
        timezone,
        purchaseType: salesType !== 'all' ? salesType : undefined,
        branchId: branchId || undefined,
        companyId: !branchId && companyId ? companyId : undefined
      });

      if (data && data.salesData) {
        // Update chart data
        setSeriesData([
          {
            name: t('dashboard.all.sales'),
            data: data.salesData.map((item) => item.total)
          }
        ]);
        setCategories(data.salesData.map((item) => item.date));
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Show empty chart on error
      setSeriesData([
        {
          name: t('dashboard.all.sales'),
          data: []
        }
      ]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalesTypeChange = (event: SelectChangeEvent<ChartSalesType>) => {
    setSalesType(event.target.value as ChartSalesType);
  };

  const handleDateRangeChange = (newDateRange: DateRange | null) => {
    if (newDateRange) {
      setDateRange(newDateRange);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [salesType, dateRange, companyId, branchId]);

  return (
    <SalesTrendsChartWrapper>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <DateFilterBar
            onChange={handleDateRangeChange}
            initialDateRange={dateRange}
            compact
            presets={[
              'last.7days',
              'last.30days',
              'this.month',
              'last.month',
              'custom'
            ]}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <FormControl fullWidth size="small">
            <InputLabel id="sales-type-select-label">
              {t('dashboard.sales.type')}
            </InputLabel>
            <Select
              labelId="sales-type-select-label"
              value={salesType}
              label={t('dashboard.sales.type')}
              onChange={handleSalesTypeChange}
              size="small"
            >
              <MenuItem value="all">{t('dashboard.all.sales')}</MenuItem>
              <MenuItem value={PurchaseType.CASH}>
                {t('dashboard.cash.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.WALLET}>
                {t('dashboard.wallet.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.CAMPAIGN}>
                {t('dashboard.campaign.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.CARD}>
                {t('dashboard.card.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.DIRECT}>
                {t('dashboard.direct.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.PHYSICAL_CARD}>
                {t('dashboard.physical.card.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.LOYALTY_POINTS}>
                {t('dashboard.loyalty.points.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.LOYALTY_POINTS_HYBRID}>
                {t('dashboard.loyalty.hybrid.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.MEMBERSHIP}>
                {t('dashboard.membership.purchase.sales')}
              </MenuItem>
              <MenuItem value={PurchaseType.MIXED}>
                {t('dashboard.mixed.sales')}
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box
        sx={{
          height: 320,
          position: 'relative'
        }}
      >
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              zIndex: 2
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Chart
          options={chartOptions}
          series={chartSeries}
          type="area"
          height={320}
        />
      </Box>
    </SalesTrendsChartWrapper>
  );
};

export default SalesTrendsChart;
