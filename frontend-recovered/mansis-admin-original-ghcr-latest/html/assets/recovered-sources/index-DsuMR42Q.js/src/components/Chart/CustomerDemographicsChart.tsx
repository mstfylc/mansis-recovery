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
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Tooltip
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SchoolIcon from '@mui/icons-material/School';
import WcIcon from '@mui/icons-material/Wc';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Chart } from './index';
import { dashboardService } from '@/data/dashboardService';
import DateFilterBar from '../filters/DateFilterBar';
import { DateRange } from '@/types/DateRange.interface';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';

interface CustomerDemographicsChartProps {
  companyId: number | null;
  branchId: number | null;
}

interface GenderDistribution {
  male: number;
  female: number;
  other: number;
  notSpecified: number;
}

interface AgeGroups {
  under18: number;
  '18-24': number;
  '25-34': number;
  '35-44': number;
  '45-54': number;
  '55Plus': number;
  unknown: number;
}

interface PurchaseTypes {
  cashCount: number;
  walletCount: number;
  campaignCount: number;
  cashTotal: number;
  walletTotal: number;
  campaignTotal: number;
}

interface DemographicsData {
  period: number;
  demographics: {
    genderDistribution: GenderDistribution;
    ageGroups: AgeGroups;
    totalCustomers: number;
  };
  behavior: {
    purchaseTypes: PurchaseTypes;
    avgOrdersPerCustomer: number;
    avgOrderValue: number;
  };
}

function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`demographics-tabpanel-${index}`}
      aria-labelledby={`demographics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `demographics-tab-${index}`,
    'aria-controls': `demographics-tabpanel-${index}`
  };
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82ca9d'
];

const CustomerDemographicsChart: React.FC<CustomerDemographicsChartProps> = ({
  companyId,
  branchId
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DemographicsData | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
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

  const fetchDemographics = async () => {
    setLoading(true);
    try {
      const startDate = format(dateRange.startDate, 'yyyy-MM-dd');
      const endDate = format(dateRange.endDate, 'yyyy-MM-dd');
      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await dashboardService.getCustomerDemographics({
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
      console.error('Error fetching customer demographics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleDateRangeChange = (newDateRange: DateRange | null) => {
    if (newDateRange) {
      setDateRange(newDateRange);
    }
  };

  const handleRefresh = () => {
    fetchDemographics();
  };

  useEffect(() => {
    fetchDemographics();
  }, [companyId, branchId, dateRange]);

  // Helper function to safely check if data exists
  const getGenderLabels = () => {
    if (!data || !data.demographics || !data.demographics.genderDistribution) {
      return [];
    }

    return Object.entries(data.demographics.genderDistribution)
      .filter(([, value]) => value > 0)
      .map(([key]) => {
        switch (key) {
          case 'male':
            return t('demographics.gender.male');
          case 'female':
            return t('demographics.gender.female');
          case 'other':
            return t('demographics.gender.other');
          case 'notSpecified':
            return t('demographics.gender.not.specified');
          default:
            return key;
        }
      });
  };

  // Helper function to safely get gender chart series
  const getGenderSeries = () => {
    if (!data || !data.demographics || !data.demographics.genderDistribution) {
      return [];
    }

    return Object.entries(data.demographics.genderDistribution)
      .filter(([, value]) => value > 0)
      .map(([, value]) => value);
  };

  // Helper function to safely get age categories
  const getAgeCategories = () => {
    if (!data || !data.demographics || !data.demographics.ageGroups) {
      return [];
    }

    return Object.keys(data.demographics.ageGroups)
      .filter((key) => data.demographics.ageGroups[key as keyof AgeGroups] > 0)
      .map((key) => {
        switch (key) {
          case 'under18':
            return t('demographics.age.under18');
          case '18-24':
            return t('demographics.age.18-24');
          case '25-34':
            return t('demographics.age.25-34');
          case '35-44':
            return t('demographics.age.35-44');
          case '45-54':
            return t('demographics.age.45-54');
          case '55Plus':
            return t('demographics.age.55Plus');
          case 'unknown':
            return t('demographics.age.unknown');
          default:
            return key;
        }
      });
  };

  // Helper function to safely get age series data
  const getAgeSeriesData = () => {
    if (!data || !data.demographics || !data.demographics.ageGroups) {
      return [];
    }

    return Object.keys(data.demographics.ageGroups)
      .filter((key) => data.demographics.ageGroups[key as keyof AgeGroups] > 0)
      .map((key) => data.demographics.ageGroups[key as keyof AgeGroups]);
  };

  // Prepare data for gender distribution chart
  const genderChartOptions = {
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
    labels: getGenderLabels(),
    colors: COLORS,
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

  const genderChartSeries = getGenderSeries();

  // Prepare data for age distribution chart
  const ageChartOptions = {
    chart: {
      type: 'bar',
      background: 'transparent',
      stacked: false,
      toolbar: {
        show: false
      },
      fontFamily: theme.typography.fontFamily
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4
      }
    },
    colors: [theme.colors.primary.main],
    dataLabels: {
      enabled: false
    },
    theme: {
      mode: theme.palette.mode
    },
    xaxis: {
      categories: getAgeCategories(),
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      },
      title: {
        text: t('demographics.customers'),
        style: {
          color: theme.palette.text.secondary
        }
      }
    },
    legend: {
      show: false
    },
    tooltip: {
      theme: theme.palette.mode
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      padding: {
        right: 5,
        left: 5
      }
    }
  };

  const ageChartSeries = [
    {
      name: t('demographics.customers'),
      data: getAgeSeriesData()
    }
  ];

  // Helper function to safely get purchase labels
  const getPurchaseLabels = () => {
    if (!data || !data.behavior || !data.behavior.purchaseTypes) {
      return [];
    }
    return [
      t('demographics.purchase.cash'),
      t('demographics.purchase.wallet'),
      t('demographics.purchase.campaign')
    ];
  };

  // Helper function to safely get purchase series data
  const getPurchaseSeries = () => {
    if (!data || !data.behavior || !data.behavior.purchaseTypes) {
      return [];
    }
    return [
      data.behavior.purchaseTypes.cashCount,
      data.behavior.purchaseTypes.walletCount,
      data.behavior.purchaseTypes.campaignCount || 0
    ];
  };

  // Prepare data for purchase type distribution chart
  const purchaseChartOptions = {
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
    labels: getPurchaseLabels(),
    colors: [
      theme.colors.success.main,
      theme.colors.primary.main,
      theme.colors.warning.main
    ],
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

  const purchaseChartSeries = getPurchaseSeries();

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
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="demographics tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<WcIcon />}
                iconPosition="start"
                label={t('demographics.gender')}
                {...a11yProps(0)}
              />
              <Tab
                icon={<SchoolIcon />}
                iconPosition="start"
                label={t('demographics.age')}
                {...a11yProps(1)}
              />
              <Tab
                icon={<PeopleAltIcon />}
                iconPosition="start"
                label={t('demographics.summary')}
                {...a11yProps(2)}
              />
              <Tab
                icon={<ShoppingCartIcon />}
                iconPosition="start"
                label={t('demographics.purchase')}
                {...a11yProps(3)}
              />
            </Tabs>
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

        <Divider sx={{ mt: 1, mb: 0 }} />

        <TabPanel value={tabIndex} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                {t('demographics.gender.distribution')}
              </Typography>
              <Box height={300}>
                {genderChartSeries.length > 0 ? (
                  <Chart
                    options={genderChartOptions}
                    series={genderChartSeries}
                    type="pie"
                    height={300}
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
            <Grid item xs={12} md={5}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('demographics.gender.insights')}
                </Typography>
                <List dense>
                  {data?.demographics?.genderDistribution &&
                    Object.entries(data.demographics.genderDistribution)
                      .filter(([, value]) => value > 0)
                      .map(([key, value], index) => {
                        const total = Object.values(
                          data.demographics.genderDistribution
                        ).reduce((sum, val) => sum + val, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        let label = '';
                        switch (key) {
                          case 'male':
                            label = t('demographics.gender.male');
                            break;
                          case 'female':
                            label = t('demographics.gender.female');
                            break;
                          case 'other':
                            label = t('demographics.gender.other');
                            break;
                          case 'notSpecified':
                            label = t('demographics.gender.not.specified');
                            break;
                          default:
                            label = key;
                        }

                        return (
                          <ListItem key={index}>
                            <ListItemText
                              primary={
                                <Typography variant="body1">{label}</Typography>
                              }
                              secondary={
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {value} {t('demographics.customers')} (
                                  {percentage}%)
                                </Typography>
                              }
                            />
                            <Chip
                              label={`${value}`}
                              color={
                                index === 0
                                  ? 'primary'
                                  : index === 1
                                    ? 'secondary'
                                    : index === 2
                                      ? 'warning'
                                      : 'default'
                              }
                            />
                          </ListItem>
                        );
                      })}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('demographics.age.distribution')}
              </Typography>
              <Box height={300}>
                {ageChartSeries[0].data.length > 0 ? (
                  <Chart
                    options={ageChartOptions}
                    series={ageChartSeries}
                    type="bar"
                    height={300}
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
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {t('demographics.age.insights')}
                </Typography>
                <Grid container spacing={2}>
                  {data?.demographics?.ageGroups &&
                    Object.entries(data.demographics.ageGroups)
                      .filter(([, value]) => value > 0)
                      .map(([key, value], index) => {
                        let label = '';
                        switch (key) {
                          case 'under18':
                            label = t('demographics.age.under18');
                            break;
                          case '18-24':
                            label = t('demographics.age.18-24');
                            break;
                          case '25-34':
                            label = t('demographics.age.25-34');
                            break;
                          case '35-44':
                            label = t('demographics.age.35-44');
                            break;
                          case '45-54':
                            label = t('demographics.age.45-54');
                            break;
                          case '55Plus':
                            label = t('demographics.age.55Plus');
                            break;
                          case 'unknown':
                            label = t('demographics.age.unknown');
                            break;
                          default:
                            label = key;
                        }

                        return (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Box
                              sx={{
                                p: 2,
                                textAlign: 'center',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                              >
                                {label}
                              </Typography>
                              <Typography variant="h5" color="primary">
                                {value}
                              </Typography>
                              <Typography variant="caption">
                                {t('demographics.customers')}
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabIndex} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                {t('demographics.customer.insights')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('demographics.overview.description')}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('demographics.total.customers')}
                </Typography>
                <Box display="flex" alignItems="center">
                  <PeopleAltIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h3">
                    {data?.demographics?.totalCustomers?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom color="success.main">
                  {t('demographics.avg.order.value')}
                </Typography>
                <Box display="flex" alignItems="center">
                  <ShoppingCartIcon
                    color="success"
                    sx={{ mr: 1, fontSize: 40 }}
                  />
                  <Typography variant="h3">
                    ₺
                    {data?.behavior?.avgOrderValue?.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || '0.00'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom color="warning.main">
                  {t('demographics.avg.orders.per.customer')}
                </Typography>
                <Box display="flex" alignItems="center">
                  <ShoppingCartIcon
                    color="warning"
                    sx={{ mr: 1, fontSize: 40 }}
                  />
                  <Typography variant="h3">
                    {data?.behavior?.avgOrdersPerCustomer || 0}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabIndex} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {t('demographics.purchase.type.distribution')}
              </Typography>
              <Box height={300}>
                {purchaseChartSeries.length > 0 &&
                purchaseChartSeries.some((v) => v > 0) ? (
                  <Chart
                    options={purchaseChartOptions}
                    series={purchaseChartSeries}
                    type="pie"
                    height={300}
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
                  {t('demographics.purchase.insights')}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: theme.colors.success.lighter,
                        bgcolor: theme.colors.success.lighter,
                        borderRadius: 1
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="success.main"
                        gutterBottom
                      >
                        {t('demographics.purchase.cash')}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('demographics.orders')}:
                          </Typography>
                          <Typography variant="h5" color="success.main">
                            {data?.behavior?.purchaseTypes?.cashCount || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('demographics.total')}:
                          </Typography>
                          <Typography variant="h5" color="success.main">
                            ₺
                            {data?.behavior?.purchaseTypes?.cashTotal?.toLocaleString(
                              'tr-TR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: theme.colors.primary.lighter,
                        bgcolor: theme.colors.primary.lighter,
                        borderRadius: 1
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="primary.main"
                        gutterBottom
                      >
                        {t('demographics.purchase.wallet')}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('demographics.orders')}:
                          </Typography>
                          <Typography variant="h5" color="primary.main">
                            {data?.behavior?.purchaseTypes?.walletCount || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('demographics.total')}:
                          </Typography>
                          <Typography variant="h5" color="primary.main">
                            ₺
                            {data?.behavior?.purchaseTypes?.walletTotal?.toLocaleString(
                              'tr-TR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: theme.colors.warning.lighter,
                        bgcolor: theme.colors.warning.lighter,
                        borderRadius: 1
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="warning.main"
                        gutterBottom
                      >
                        {t('demographics.purchase.campaign')}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('demographics.orders')}:
                          </Typography>
                          <Typography variant="h5" color="warning.main">
                            {data?.behavior?.purchaseTypes?.campaignCount || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('demographics.total')}:
                          </Typography>
                          <Typography variant="h5" color="warning.main">
                            ₺
                            {data?.behavior?.purchaseTypes?.campaignTotal?.toLocaleString(
                              'tr-TR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Card>
  );
};

export default CustomerDemographicsChart;
