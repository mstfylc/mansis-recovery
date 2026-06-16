import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Divider,
  useTheme,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Tooltip,
  Avatar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import RepeatIcon from '@mui/icons-material/Repeat';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

import { Chart } from './index';
import { dashboardService } from '@/data/dashboardService';
import DateFilterBar from '../filters/DateFilterBar';
import { DateRange } from '@/types/DateRange.interface';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';

interface CustomerSegmentationChartProps {
  companyId: number | null;
  branchId: number | null;
}

interface Segment {
  count: number;
  percentage: number;
  avgOrderValue: number;
  totalSpent: number;
}

interface SegmentationData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totalCustomers: number;
  segments: {
    loyal: Segment;
    regular: Segment;
    occasional: Segment;
    new: Segment;
    inactive: Segment;
    atRisk: Segment;
  };
}

const CustomerSegmentationChart: React.FC<CustomerSegmentationChartProps> = ({
  companyId,
  branchId
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<SegmentationData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29); // Default to 30 days

    return {
      startDate: start,
      endDate: end,
      preset: 'last.30days',
      label: t('filters.date.last.30days')
    };
  });

  const fetchSegmentation = async () => {
    setLoading(true);
    try {
      const startDate = format(dateRange.startDate, 'yyyy-MM-dd');
      const endDate = format(dateRange.endDate, 'yyyy-MM-dd');
      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await dashboardService.getCustomerSegmentation({
        startDate,
        endDate,
        timezone,
        branchId: branchId || undefined,
        companyId: !branchId && companyId ? companyId : undefined
      });

      if (data) {
        setData(data);
      }
    } catch (error) {
      console.error('Error fetching customer segmentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | null) => {
    if (newDateRange) {
      setDateRange(newDateRange);
    }
  };

  const handleRefresh = () => {
    fetchSegmentation();
  };

  useEffect(() => {
    fetchSegmentation();
  }, [companyId, branchId, dateRange]);

  // Helper function to get segment colors
  const getSegmentColor = (segmentKey: string) => {
    switch (segmentKey) {
      case 'loyal':
        return theme.colors.success.main;
      case 'regular':
        return theme.colors.primary.main;
      case 'occasional':
        return theme.colors.info.main;
      case 'new':
        return theme.colors.warning.main;
      case 'atRisk':
        return theme.colors.error.main;
      case 'inactive':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[300];
    }
  };

  // Helper function to get segment icon
  const getSegmentIcon = (segmentKey: string) => {
    switch (segmentKey) {
      case 'loyal':
        return <LoyaltyIcon />;
      case 'regular':
        return <RepeatIcon />;
      case 'occasional':
        return <ShoppingBagIcon />;
      case 'new':
        return <PersonAddIcon />;
      case 'atRisk':
        return <WarningIcon />;
      case 'inactive':
        return <PersonOffIcon />;
      default:
        return null;
    }
  };

  // Helper function to get segment label
  const getSegmentLabel = (segmentKey: string) => {
    switch (segmentKey) {
      case 'loyal':
        return t('segmentation.loyal');
      case 'regular':
        return t('segmentation.regular');
      case 'occasional':
        return t('segmentation.occasional');
      case 'new':
        return t('segmentation.new');
      case 'atRisk':
        return t('segmentation.atRisk');
      case 'inactive':
        return t('segmentation.inactive');
      default:
        return segmentKey;
    }
  };

  // Helper function to get segment description
  const getSegmentDescription = (segmentKey: string) => {
    switch (segmentKey) {
      case 'loyal':
        return t('segmentation.loyal.description');
      case 'regular':
        return t('segmentation.regular.description');
      case 'occasional':
        return t('segmentation.occasional.description');
      case 'new':
        return t('segmentation.new.description');
      case 'atRisk':
        return t('segmentation.atRisk.description');
      case 'inactive':
        return t('segmentation.inactive.description');
      default:
        return '';
    }
  };

  // Prepare data for pie chart
  const pieChartOptions = {
    chart: {
      type: 'pie',
      background: 'transparent',
      stacked: false,
      toolbar: {
        show: false
      },
      fontFamily: theme.typography.fontFamily
    },
    theme: {
      mode: theme.palette.mode
    },
    labels: data
      ? Object.keys(data.segments).map((key) => getSegmentLabel(key))
      : [],
    colors: data
      ? Object.keys(data.segments).map((key) => getSegmentColor(key))
      : [],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: {
        colors: theme.palette.text.secondary
      },
      markers: {
        radius: 12
      }
    },
    stroke: {
      width: 0
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: any) {
        const name = opts.w.globals.labels[opts.seriesIndex];
        return `${name}: ${val.toFixed(1)}%`;
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
          const total = w.globals.seriesTotals.reduce(
            (a: number, b: number) => a + b,
            0
          );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value} (${percentage}%)`;
        }
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '0%'
        }
      }
    }
  };

  const pieChartSeries = data
    ? Object.values(data.segments).map((segment) => segment.count)
    : [];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={300}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0}>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h5">{t('segmentation.title')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('segmentation.description')}
            </Typography>
          </Grid>
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

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box height={400}>
              {pieChartSeries.length > 0 ? (
                <Chart
                  options={pieChartOptions}
                  series={pieChartSeries}
                  type="pie"
                  height={400}
                />
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <Typography variant="body1" color="text.secondary">
                    {t('dashboard.no.data.available')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {t('segmentation.summary')}
              </Typography>
              <Divider sx={{ my: 1 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('segmentation.total.customers')}:
                </Typography>
                <Typography variant="h4" color="primary">
                  {data?.totalCustomers?.toLocaleString() || 0}
                </Typography>
              </Box>

              <List dense>
                {data &&
                  Object.entries(data.segments)
                    .filter(([, segment]) => segment.count > 0)
                    .map(([key, segment], index) => (
                      <ListItem
                        key={index}
                        sx={{
                          mb: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      >
                        <Avatar
                          sx={{
                            mr: 2,
                            bgcolor: getSegmentColor(key)
                          }}
                        >
                          {getSegmentIcon(key)}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1">
                              {getSegmentLabel(key)} ({segment.count}{' '}
                              {t('segmentation.customers')})
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 0.5 }}
                              >
                                {getSegmentDescription(key)}
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" display="block">
                                    {t('segmentation.percentage')}:
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={`${segment.percentage}%`}
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" display="block">
                                    {t('segmentation.avg.order')}:
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={`₺${
                                      segment.avgOrderValue?.toLocaleString(
                                        'tr-TR',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        }
                                      ) || '0.00'
                                    }`}
                                    color="success"
                                    variant="outlined"
                                  />
                                </Grid>
                              </Grid>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
};

export default CustomerSegmentationChart;
