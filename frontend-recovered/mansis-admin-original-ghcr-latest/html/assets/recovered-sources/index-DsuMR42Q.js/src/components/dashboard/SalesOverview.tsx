import {
  Box,
  Card,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DashboardStats } from '@/types/DashboardStats.interface';

interface SalesOverviewProps {
  stats: DashboardStats;
  isLoading: boolean;
}

const SalesOverview = ({ stats, isLoading }: SalesOverviewProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2,
        height: '100%',
        boxShadow: theme.shadows[2],
        background: theme.palette.background.paper
      }}
    >
      <Typography variant="h5" gutterBottom fontWeight="medium">
        {t('dashboard.sales.overview')}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ height: 300, position: 'relative', mt: 1 }}>
        {isLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            <Typography
              variant="h5"
              align="center"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {`₺${stats.totalSales.toLocaleString('tr-TR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}`}
            </Typography>
            <svg width="100%" height="100%" viewBox="0 0 42 42">
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="none"
                stroke={alpha(theme.colors.primary.light, 0.2)}
                strokeWidth="3"
              />
              {stats.totalSales > 0 && (
                <>
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="none"
                    stroke={theme.colors.success.main}
                    strokeWidth="3"
                    strokeDasharray={`${(stats.orderSales / stats.totalSales) * 100} 100`}
                    strokeDashoffset="25"
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="none"
                    stroke={theme.colors.primary.main}
                    strokeWidth="3"
                    strokeDasharray={`${(stats.dailyLoginSales / stats.totalSales) * 100} 100`}
                    strokeDashoffset={`${100 - (stats.orderSales / stats.totalSales) * 100 + 25}`}
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="none"
                    stroke={theme.colors.warning.main}
                    strokeWidth="3"
                    strokeDasharray={`${(stats.membershipSales / stats.totalSales) * 100} 100`}
                    strokeDashoffset={`${100 - ((stats.orderSales + stats.dailyLoginSales) / stats.totalSales) * 100 + 25}`}
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="none"
                    stroke={theme.colors.info.main}
                    strokeWidth="3"
                    strokeDasharray={`${(stats.ticketSales / stats.totalSales) * 100} 100`}
                    strokeDashoffset={`${100 - ((stats.orderSales + stats.dailyLoginSales + stats.membershipSales) / stats.totalSales) * 100 + 25}`}
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="none"
                    stroke={theme.colors.error.main}
                    strokeWidth="3"
                    strokeDasharray={`${(stats.packageSales / stats.totalSales) * 100} 100`}
                    strokeDashoffset={`${100 - ((stats.orderSales + stats.dailyLoginSales + stats.membershipSales + stats.ticketSales) / stats.totalSales) * 100 + 25}`}
                  />
                </>
              )}
            </svg>
          </div>
        )}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
          {t('dashboard.revenue.sources')}
        </Typography>
        <Stack spacing={1}>
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: theme.colors.success.main,
                mr: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.order.sales')}:
              {isLoading
                ? '-'
                : ` ₺${stats.orderSales.toLocaleString('tr-TR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })} (${stats.totalOrders})`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: theme.colors.primary.main,
                mr: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.daily.login.sales')}:
              {isLoading
                ? '-'
                : ` ₺${stats.dailyLoginSales.toLocaleString('tr-TR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })} (${stats.dailyLoginCount})`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: theme.colors.warning.main,
                mr: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.membership.sales')}:
              {isLoading
                ? '-'
                : ` ₺${stats.membershipSales.toLocaleString('tr-TR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })} (${stats.membershipCount})`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: theme.colors.info.main,
                mr: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.ticket.sales')}:
              {isLoading
                ? '-'
                : ` ₺${stats.ticketSales.toLocaleString('tr-TR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })} (${stats.ticketCount})`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: theme.colors.error.main,
                mr: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.package.sales')}:
              {isLoading
                ? '-'
                : ` ₺${stats.packageSales.toLocaleString('tr-TR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })} (${stats.packageCount})`}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};

export default SalesOverview;
