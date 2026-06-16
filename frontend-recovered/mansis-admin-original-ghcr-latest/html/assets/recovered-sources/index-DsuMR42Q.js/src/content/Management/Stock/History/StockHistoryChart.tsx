import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chart } from '@/components/Chart';
import type { BranchStock, StockMovement } from '@/types/stock';
import { useMemo } from 'react';
import { ApexOptions } from 'apexcharts';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';

interface StockHistoryChartProps {
  movements: StockMovement[];
  loading: boolean;
  stock: BranchStock | null;
}

const StockHistoryChart = ({
  movements,
  loading,
  stock
}: StockHistoryChartProps) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!movements.length) return { series: [], categories: [] };

    // Sort movements by date ascending
    const sortedMovements = [...movements].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const series = sortedMovements.map((m) => m.newQuantity);
    const categories = sortedMovements.map((m) =>
      formatDateToDayMonthYearTime(new Date(m.createdAt))
    );

    return { series, categories };
  }, [movements]);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 400,
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      zoom: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#5569ff'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        rotate: -45,
        rotateAlways: true,
        style: {
          fontSize: '11px'
        }
      },
      title: {
        text: t('stock.history.chart.date')
      }
    },
    yaxis: {
      title: {
        text: t('stock.history.chart.quantity.label')
      },
      labels: {
        formatter: (value: number) => {
          return Math.round(value).toString();
        }
      }
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy HH:mm'
      },
      y: {
        formatter: (value: number) => {
          const unit = stock
            ? t(`stock.unit.${stock.companyProduct.stockUnit.toLowerCase()}`)
            : '';
          return `${value} ${unit}`;
        }
      }
    },
    markers: {
      size: 4,
      colors: ['#5569ff'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 7
      }
    }
  };

  const series = [
    {
      name: t('stock.history.chart.quantity.label'),
      data: chartData.series
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={400}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!movements.length) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={400}
          >
            <Typography variant="h5" color="text.secondary">
              {t('stock.history.chart.no.data')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          {t('stock.history.chart.title')}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Chart
            options={chartOptions}
            series={series}
            type="area"
            height={400}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockHistoryChart;
