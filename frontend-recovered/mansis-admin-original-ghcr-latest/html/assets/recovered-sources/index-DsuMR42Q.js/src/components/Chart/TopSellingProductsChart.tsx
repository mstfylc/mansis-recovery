import { FC, useEffect, useState } from 'react';
import {
  Card,
  Box,
  Typography,
  useTheme,
  styled,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent,
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

interface TopSellingProductsChartProps {
  className?: string;
  companyId?: number | null;
  branchId?: number | null;
}

interface ProductSalesItem {
  id: number;
  name: string;
  quantity: number;
  totalSales: number;
  price: number;
  imageUrl?: string;
}

const ChartWrapper = styled(Card)(
  ({ theme }) => `
    padding: ${theme.spacing(2)};
    height: 100%;
`
);

const TopSellingProductsChart: FC<TopSellingProductsChartProps> = ({
  className,
  companyId,
  branchId
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [limit, setLimit] = useState<string>('5');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductSalesItem[]>([]);
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
      fontFamily: theme.typography.fontFamily
    },
    colors: [theme.colors.primary.main],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return `₺${Number(val).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
      },
      offsetX: 30,
      style: {
        fontSize: '12px',
        colors: [theme.palette.mode === 'dark' ? '#fff' : '#000']
      }
    },
    theme: {
      mode: theme.palette.mode
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['transparent']
    },
    xaxis: {
      categories: products.map((p) => p.name || ''),
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        },
        formatter: (val: number) =>
          `₺${val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        }
      }
    },
    legend: {
      show: false
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
    }
  };

  const seriesData = [
    {
      name: t('dashboard.total.amount'),
      data: products.map((p) => p.totalSales)
    }
  ];

  const fetchTopSellingProducts = async () => {
    setIsLoading(true);
    try {
      const startDate = format(dateRange.startDate, 'yyyy-MM-dd');
      const endDate = format(dateRange.endDate, 'yyyy-MM-dd');
      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await dashboardService.getTopSellingProducts({
        startDate,
        endDate,
        timezone,
        limit,
        branchId: branchId || undefined,
        companyId: !branchId && companyId ? companyId : undefined
      });

      if (data && data.topProducts) {
        setProducts(data.topProducts);
      } else {
        console.error('Invalid response format:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitChange = (event: SelectChangeEvent) => {
    setLimit(event.target.value);
  };

  const handleDateRangeChange = (newDateRange: DateRange | null) => {
    if (newDateRange) {
      setDateRange(newDateRange);
    }
  };

  const handleRefresh = () => {
    fetchTopSellingProducts();
  };

  useEffect(() => {
    fetchTopSellingProducts();
  }, [limit, companyId, branchId, dateRange]);

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
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel id="limit-select-label">
                {t('dashboard.count')}
              </InputLabel>
              <Select
                labelId="limit-select-label"
                value={limit}
                label={t('dashboard.count')}
                onChange={handleLimitChange}
                size="small"
              >
                <MenuItem value="5">5</MenuItem>
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="15">15</MenuItem>
              </Select>
            </FormControl>
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
      <Box
        height={280}
        display={isLoading ? 'flex' : 'block'}
        alignItems="center"
        justifyContent="center"
      >
        {isLoading ? (
          <CircularProgress size={40} color="primary" />
        ) : products.length > 0 ? (
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

export default TopSellingProductsChart;
