import { FC, useEffect, useState } from 'react';
import {
  Card,
  Box,
  Typography,
  useTheme,
  styled,
  Grid,
  Divider,
  CircularProgress,
  Tooltip,
  Button
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chart } from './index';
import { dashboardService } from '@/data/dashboardService';
import DateFilterBar from '../filters/DateFilterBar';
import { DateRange } from '@/types/DateRange.interface';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';

interface BranchPerformanceChartProps {
  className?: string;
  companyId?: number | null;
}

interface BranchPerformanceItem {
  branchId: number;
  branchName: string;
  ordersCount: number;
  totalSales: number;
  customersCount: number;
}

const ChartWrapper = styled(Card)(
  ({ theme }) => `
    padding: ${theme.spacing(2)};
    height: 100%;
`
);

const BranchPerformanceChart: FC<BranchPerformanceChartProps> = ({
  className,
  companyId
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [branchData, setBranchData] = useState<BranchPerformanceItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);

    return {
      startDate: start,
      endDate: end,
      preset: 'last.30days',
      label: t('filters.date.last.30days')
    };
  });

  // Define the chart options
  const chartOptions = {
    chart: {
      background: 'transparent',
      toolbar: {
        show: false
      },
      type: 'bar',
      stacked: false,
      fontFamily: theme.typography.fontFamily
    },
    colors: [theme.colors.primary.main, theme.colors.success.main],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: '55%'
      }
    },
    dataLabels: {
      enabled: false
    },
    theme: {
      mode: theme.palette.mode
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: branchData.map((b) => b.branchName),
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        },
        rotate: -45,
        trim: true,
        maxHeight: 120
      }
    },
    yaxis: [
      {
        title: {
          text: t('dashboard.sales.amount')
        },
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '10px'
          },
          formatter: (val: number) =>
            `₺${val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`
        }
      },
      {
        opposite: true,
        title: {
          text: t('dashboard.order.count')
        },
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '10px'
          },
          formatter: (val: number) => Math.round(val).toString()
        },
        min: 0,
        forceNiceScale: true
      }
    ],
    legend: {
      show: true,
      position: 'top',
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
        formatter: function (value, { seriesIndex }) {
          return seriesIndex === 0 ? `₺${value.toFixed(2)}` : value.toString();
        }
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
    }
  };

  const seriesData = [
    {
      name: t('dashboard.sales'),
      data: branchData.map((b) => b.totalSales)
    },
    {
      name: t('dashboard.orders'),
      data: branchData.map((b) => b.ordersCount)
    }
  ];

  const fetchBranchPerformance = async () => {
    setIsLoading(true);
    try {
      const startDate = format(dateRange.startDate, 'yyyy-MM-dd');
      const endDate = format(dateRange.endDate, 'yyyy-MM-dd');
      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await dashboardService.getBranchPerformance({
        startDate,
        endDate,
        timezone,
        companyId: companyId || undefined
      });

      if (data && data.branchPerformance) {
        setBranchData(data.branchPerformance);
      } else {
        console.error('Invalid response format:', data);
        setBranchData([]);
      }
    } catch (error) {
      console.error('Error fetching branch performance:', error);
      setBranchData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | null) => {
    if (newDateRange) {
      setDateRange(newDateRange);
    }
  };

  const handleRefresh = () => {
    fetchBranchPerformance();
  };

  useEffect(() => {
    fetchBranchPerformance();
  }, [companyId, dateRange]);

  return (
    <ChartWrapper className={className} elevation={0}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}></Grid>
        <Grid item xs={12} sm={6}>
          <Box
            display="flex"
            justifyContent="flex-end"
            gap={1}
            alignItems="center"
          >
            <DateFilterBar
              onChange={handleDateRangeChange}
              initialDateRange={dateRange}
              compact
            />
            <Tooltip title={t('dashboard.refresh.data')}>
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={handleRefresh}
              >
                <RefreshIcon />
              </Button>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
      <Divider sx={{ mt: 1, mb: 2 }} />
      <Box
        height={280}
        display={isLoading ? 'flex' : 'block'}
        alignItems="center"
        justifyContent="center"
      >
        {isLoading ? (
          <CircularProgress size={40} color="primary" />
        ) : branchData.length > 0 ? (
          <Chart
            options={chartOptions}
            series={seriesData}
            type="bar"
            height={280}
          />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography variant="body1" color="text.secondary">
              {t('dashboard.no.data')}
            </Typography>
          </Box>
        )}
      </Box>
    </ChartWrapper>
  );
};

export default BranchPerformanceChart;
