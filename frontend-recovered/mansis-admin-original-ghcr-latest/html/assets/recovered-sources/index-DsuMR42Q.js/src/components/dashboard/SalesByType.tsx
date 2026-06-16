import {
  Box,
  Card,
  CircularProgress,
  Divider,
  Typography,
  alpha,
  useTheme,
  Stack,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DashboardStats } from '@/types/DashboardStats.interface';
import { PAYMENT_TYPES } from '@/config/paymentTypes';

interface SalesByTypeProps {
  stats: DashboardStats;
  isLoading: boolean;
}

const SalesByType = ({ stats, isLoading }: SalesByTypeProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const totalSales = stats?.totalSales || 0;

  const paymentTypes = PAYMENT_TYPES.map((paymentType) => ({
    label: t(paymentType.label),
    value: stats?.[paymentType.key] || 0,
    color: paymentType.color
  })).filter((payment) => payment.value > 0 || totalSales === 0);

  const hasData = paymentTypes.length > 0;

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
        {t('dashboard.sales.by.type')}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {!hasData && !isLoading && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">{t('dashboard.no.data')}</Typography>
        </Box>
      )}

      {hasData && (
        <Stack spacing={3}>
          {paymentTypes.map((payment, index) => {
            const percentage =
              totalSales > 0 ? (payment.value / totalSales) * 100 : 0;
            const tooltipLabel = `${payment.label}: ₺${payment.value.toLocaleString(
              'tr-TR',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            )} (${percentage.toFixed(1)}%)`;

            return (
              <Tooltip key={index} title={tooltipLabel} arrow>
                <Box
                  sx={{
                    cursor: 'pointer',
                    '&:hover .sales-bar': {
                      opacity: 0.8
                    }
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {payment.label}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ color: payment.color }}
                      aria-label={`${payment.label} satış ${payment.value}`}
                    >
                      {isLoading ? (
                        <CircularProgress
                          size={20}
                          color="inherit"
                          aria-label={`${payment.label} yükleniyor`}
                        />
                      ) : (
                        `₺${payment.value.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`
                      )}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      background: alpha(payment.color, 0.2),
                      borderRadius: 1,
                      height: 6
                    }}
                  >
                    <Box
                      className="sales-bar"
                      sx={{
                        width: `${percentage}%`,
                        background: payment.color,
                        borderRadius: 1,
                        height: '100%',
                        transition: 'opacity 0.3s ease'
                      }}
                      role="progressbar"
                      aria-valuenow={Math.round(percentage)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${payment.label} %${percentage.toFixed(1)}`}
                    />
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      )}
    </Card>
  );
};

export default SalesByType;
