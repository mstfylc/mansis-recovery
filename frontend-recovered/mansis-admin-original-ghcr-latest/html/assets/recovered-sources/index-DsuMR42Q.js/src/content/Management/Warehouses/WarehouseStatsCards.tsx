import { FC } from 'react';
import { Grid, Card, Box, Typography, Avatar, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { WarehouseStatisticsResponse } from '@/types/stock';
import InventoryTwoToneIcon from '@mui/icons-material/InventoryTwoTone';
import CategoryTwoToneIcon from '@mui/icons-material/CategoryTwoTone';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import TrendingDownTwoToneIcon from '@mui/icons-material/TrendingDownTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import AttachMoneyTwoToneIcon from '@mui/icons-material/AttachMoneyTwoTone';
import PieChartTwoToneIcon from '@mui/icons-material/PieChartTwoTone';
import SyncAltTwoToneIcon from '@mui/icons-material/SyncAltTwoTone';

interface WarehouseStatsCardsProps {
  statistics: WarehouseStatisticsResponse;
}

const WarehouseStatsCards: FC<WarehouseStatsCardsProps> = ({ statistics }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const stats = statistics.statistics;

  const statsCards = [
    {
      title: t('warehouseDetails.totalProducts'),
      value: stats.totalProducts.toLocaleString(),
      icon: CategoryTwoToneIcon,
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light
    },
    {
      title: t('warehouseDetails.totalStockQuantity'),
      value: stats.totalStockQuantity.toLocaleString(),
      icon: InventoryTwoToneIcon,
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light
    },
    {
      title: t('warehouseDetails.criticalLevelProducts'),
      value: stats.criticalLevelProducts.toLocaleString(),
      icon: WarningTwoToneIcon,
      color: theme.palette.error.main,
      bgColor: theme.palette.error.light
    },
    {
      title: t('warehouseDetails.lowStockProducts'),
      value: stats.lowStockProducts.toLocaleString(),
      icon: TrendingDownTwoToneIcon,
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light
    },
    {
      title: t('warehouseDetails.optimalStockProducts'),
      value: stats.optimalStockProducts.toLocaleString(),
      icon: CheckCircleTwoToneIcon,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light
    },
    {
      title: t('warehouseDetails.totalStockValue'),
      value: `₺${stats.totalStockValue.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      icon: AttachMoneyTwoToneIcon,
      color: theme.palette.success.dark,
      bgColor: theme.palette.success.light
    },
    {
      title: t('warehouseDetails.utilizationPercentage'),
      value: `${stats.utilizationPercentage}%`,
      icon: PieChartTwoToneIcon,
      color: theme.palette.info.dark,
      bgColor: theme.palette.info.light
    },
    {
      title: t('warehouseDetails.recentMovements'),
      value: stats.recentMovementsCount.toLocaleString(),
      icon: SyncAltTwoToneIcon,
      color: theme.palette.secondary.main,
      bgColor: theme.palette.secondary.light
    }
  ];

  return (
    <Grid container spacing={3}>
      {statsCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              px: 2,
              py: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box display="flex" alignItems="center" mb={1}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  background: stat.bgColor,
                  color: stat.color,
                  mr: 2
                }}
              >
                <stat.icon />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h3" gutterBottom noWrap>
                  {stat.value}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: '0.8125rem' }}
                >
                  {stat.title}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default WarehouseStatsCards;
