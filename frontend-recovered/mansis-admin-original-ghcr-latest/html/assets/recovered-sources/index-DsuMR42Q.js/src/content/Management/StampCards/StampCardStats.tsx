import { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  BarChartTwoTone,
  PeopleTwoTone,
  LoopTwoTone,
  TrendingUpTwoTone,
  StorefrontTwoTone
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { stampCardService } from '@/data/stampCardService';
import {
  StampCard,
  StampCardStats as StampCardStatsType
} from '@/types/StampCard.interface';

interface StampCardStatsProps {
  stampCard: StampCard;
}

const StampCardStats = ({ stampCard }: StampCardStatsProps) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StampCardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await stampCardService.getStats(
          stampCard.companyId,
          stampCard.id
        );
        setStats(result?.stats || result);
      } catch (err) {
        console.error('Error fetching stamp card stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [stampCard]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!stats) return null;

  const progressPercent =
    stats.requiredStamps > 0
      ? Math.min((stats.averageProgress / stats.requiredStamps) * 100, 100)
      : 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <BarChartTwoTone color="primary" />
        <Typography variant="h5">{t('stampCard.stats.title')}</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Participants */}
        <Grid item xs={12} sm={4}>
          <Paper
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', height: '100%' }}
          >
            <PeopleTwoTone
              sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}
            />
            <Typography variant="h3">{stats.totalParticipants}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('stampCard.stats.participants')}
            </Typography>
          </Paper>
        </Grid>

        {/* Completed Cycles */}
        <Grid item xs={12} sm={4}>
          <Paper
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', height: '100%' }}
          >
            <LoopTwoTone sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h3">{stats.totalCompletedCycles}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('stampCard.stats.completedCycles')}
            </Typography>
          </Paper>
        </Grid>

        {/* Average Progress */}
        <Grid item xs={12} sm={4}>
          <Paper
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', height: '100%' }}
          >
            <TrendingUpTwoTone
              sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}
            />
            <Typography variant="h3">
              {stats.averageProgress} / {stats.requiredStamps}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('stampCard.stats.averageProgress')}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ mt: 1, borderRadius: 1, height: 6 }}
            />
          </Paper>
        </Grid>

        {/* Branch Products Distribution */}
        {stats.branchProducts.length > 0 && (
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <StorefrontTwoTone fontSize="small" />
              {t('stampCard.stats.branchProducts')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {stats.branchProducts.map((bp) => (
                <Chip
                  key={bp.branchId}
                  label={`${bp.branchName}: ${bp.productCount} ürün`}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default StampCardStats;
