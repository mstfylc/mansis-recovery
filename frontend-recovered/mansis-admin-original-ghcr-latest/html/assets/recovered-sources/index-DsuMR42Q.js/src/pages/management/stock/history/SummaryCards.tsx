import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { BranchStock, StockMovement } from '@/types/stock';
import { useMemo } from 'react';

interface SummaryCardsProps {
  movements: StockMovement[];
  stock: BranchStock | null;
}

const SummaryCards = ({ movements, stock }: SummaryCardsProps) => {
  const { t } = useTranslation();

  const summary = useMemo(() => {
    const totalInbound = movements
      .filter((m) =>
        ['INBOUND', 'TRANSFER_IN', 'RETURN', 'INITIAL'].includes(m.movementType)
      )
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalOutbound = movements
      .filter((m) =>
        ['OUTBOUND', 'TRANSFER_OUT', 'WASTE'].includes(m.movementType)
      )
      .reduce((sum, m) => sum + m.quantity, 0);

    const netChange = totalInbound - totalOutbound;
    const movementCount = movements.length;

    return {
      totalInbound,
      totalOutbound,
      netChange,
      movementCount
    };
  }, [movements]);

  const cards = [
    {
      title: t('stock.history.summary.total.inbound'),
      value: summary.totalInbound,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: 'success.main',
      bgColor: 'success.lighter'
    },
    {
      title: t('stock.history.summary.total.outbound'),
      value: Math.abs(summary.totalOutbound),
      icon: <TrendingDownIcon sx={{ fontSize: 40 }} />,
      color: 'error.main',
      bgColor: 'error.lighter'
    },
    {
      title: t('stock.history.summary.net.change'),
      value: summary.netChange,
      icon: <SwapVertIcon sx={{ fontSize: 40 }} />,
      color: summary.netChange >= 0 ? 'success.main' : 'error.main',
      bgColor: summary.netChange >= 0 ? 'success.lighter' : 'error.lighter'
    },
    {
      title: t('stock.history.summary.movement.count'),
      value: summary.movementCount,
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      color: 'primary.main',
      bgColor: 'primary.lighter'
    }
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={card.color}>
                    {card.value}
                    {stock && index < 3 && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        {t(
                          `stock.unit.${stock.companyProduct.stockUnit.toLowerCase()}`
                        )}
                      </Typography>
                    )}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: card.bgColor,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
