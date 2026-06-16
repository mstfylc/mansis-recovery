import { Box, Button, Grid, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import RefreshIcon from '@mui/icons-material/Refresh';
import DateFilterBar from '../../components/filters/DateFilterBar';
import KPICards from './KPICards';
import SalesByType from './SalesByType';
import SalesOverview from './SalesOverview';
import { DateRange } from '@/types/DateRange.interface';
import { DashboardStats } from '@/types/DashboardStats.interface';

interface OverviewTabContentProps {
  stats: DashboardStats;
  isLoading: boolean;
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange | null) => void;
  onRefresh: () => void;
}

const OverviewTabContent = ({
  stats,
  isLoading,
  dateRange,
  onDateRangeChange,
  onRefresh
}: OverviewTabContentProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          mb: 2
        }}
      >
        <DateFilterBar
          onChange={onDateRangeChange}
          initialDateRange={dateRange}
          compact
        />
        <Tooltip title={t('dashboard.refresh.data')}>
          <Button
            variant="text"
            color="primary"
            onClick={onRefresh}
            sx={{ ml: 1 }}
          >
            <RefreshIcon />
          </Button>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <KPICards stats={stats} isLoading={isLoading} vertical={true} />
        </Grid>

        <Grid item xs={12} md={4}>
          <SalesByType stats={stats} isLoading={isLoading} />
        </Grid>

        <Grid item xs={12} md={4}>
          <SalesOverview stats={stats} isLoading={isLoading} />
        </Grid>
      </Grid>
    </>
  );
};

export default OverviewTabContent;
