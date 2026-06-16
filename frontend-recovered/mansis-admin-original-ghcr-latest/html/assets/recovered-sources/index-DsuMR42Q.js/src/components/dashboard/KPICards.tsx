import {
  CircularProgress,
  Grid,
  Card,
  Box,
  Typography,
  alpha,
  useTheme,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { DashboardStats } from '@/types/DashboardStats.interface';

interface KPICardsProps {
  stats: DashboardStats;
  isLoading: boolean;
  vertical?: boolean;
}

const KPICards = ({ stats, isLoading, vertical = false }: KPICardsProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Grid
      container
      spacing={vertical ? 3 : 2}
      direction={vertical ? 'column' : 'row'}
    >
      <Grid item xs={12} md={vertical ? 12 : 4}>
        <Tooltip title={t('dashboard.pending.orders.tooltip')} arrow>
          <Card
            sx={{
              py: vertical ? 1.5 : 2,
              px: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.colors.info.main, 0.1)} 0%, ${alpha(theme.colors.info.dark, 0.2)} 100%)`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[2],
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, boxShadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              },
              '&:focus-within': {
                outline: `2px solid ${theme.palette.info.main}`
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                p: 1
              }}
            >
              <StorefrontIcon
                sx={{
                  fontSize: vertical ? 40 : 60,
                  color: alpha(theme.colors.info.main, 0.15),
                  transform: 'rotate(15deg)'
                }}
                aria-hidden="true"
              />
            </Box>
            <Typography
              variant="overline"
              color="textSecondary"
              fontWeight="bold"
            >
              {t('dashboard.pending.orders')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
              <Typography
                variant={vertical ? 'h4' : 'h3'}
                color="info.main"
                fontWeight="bold"
                sx={{ mr: 1 }}
                aria-label={`Beklemede olan sipariş: ${stats.pendingOrders.toLocaleString('tr-TR')}`}
              >
                {isLoading ? (
                  <CircularProgress
                    size={30}
                    color="info"
                    aria-label="Beklemede olan sipariş yükleniyor"
                  />
                ) : (
                  stats.pendingOrders.toLocaleString('tr-TR')
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.orders')}
              </Typography>
            </Box>
          </Card>
        </Tooltip>
      </Grid>
      <Grid item xs={12} md={vertical ? 12 : 3}>
        <Tooltip title={t('dashboard.ready.orders.tooltip')} arrow>
          <Card
            sx={{
              py: vertical ? 1.5 : 2,
              px: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.colors.success.main, 0.1)} 0%, ${alpha(theme.colors.success.dark, 0.2)} 100%)`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[2],
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, boxShadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              },
              '&:focus-within': {
                outline: `2px solid ${theme.palette.success.main}`
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                p: 1
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: vertical ? 40 : 60,
                  color: alpha(theme.colors.success.main, 0.15),
                  transform: 'rotate(15deg)'
                }}
                aria-hidden="true"
              />
            </Box>
            <Typography
              variant="overline"
              color="textSecondary"
              fontWeight="bold"
            >
              {t('dashboard.ready.orders')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
              <Typography
                variant={vertical ? 'h4' : 'h3'}
                color="success.main"
                fontWeight="bold"
                sx={{ mr: 1 }}
                aria-label={`Hazır sipariş: ${(stats.readyOrders ?? 0).toLocaleString('tr-TR')}`}
              >
                {isLoading ? (
                  <CircularProgress
                    size={30}
                    color="success"
                    aria-label="Hazır sipariş yükleniyor"
                  />
                ) : (
                  (stats.readyOrders ?? 0).toLocaleString('tr-TR')
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.orders')}
              </Typography>
            </Box>
          </Card>
        </Tooltip>
      </Grid>
      <Grid item xs={12} md={vertical ? 12 : 3}>
        <Tooltip title={t('dashboard.canceled.orders.tooltip')} arrow>
          <Card
            sx={{
              py: vertical ? 1.5 : 2,
              px: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.colors.error.main, 0.1)} 0%, ${alpha(theme.colors.error.dark, 0.2)} 100%)`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[2],
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, boxShadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              },
              '&:focus-within': {
                outline: `2px solid ${theme.palette.error.main}`
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                p: 1
              }}
            >
              <CancelIcon
                sx={{
                  fontSize: vertical ? 40 : 60,
                  color: alpha(theme.colors.error.main, 0.15),
                  transform: 'rotate(15deg)'
                }}
                aria-hidden="true"
              />
            </Box>
            <Typography
              variant="overline"
              color="textSecondary"
              fontWeight="bold"
            >
              {t('dashboard.canceled.orders')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
              <Typography
                variant={vertical ? 'h4' : 'h3'}
                color="error.main"
                fontWeight="bold"
                sx={{ mr: 1 }}
                aria-label={`İptal edilen sipariş: ${(stats.canceledOrders ?? 0).toLocaleString('tr-TR')}`}
              >
                {isLoading ? (
                  <CircularProgress
                    size={30}
                    color="error"
                    aria-label="İptal edilen sipariş yükleniyor"
                  />
                ) : (
                  (stats.canceledOrders ?? 0).toLocaleString('tr-TR')
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.orders')}
              </Typography>
            </Box>
          </Card>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default KPICards;
