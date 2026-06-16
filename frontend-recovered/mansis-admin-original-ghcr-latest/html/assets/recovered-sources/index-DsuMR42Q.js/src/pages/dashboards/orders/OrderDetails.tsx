import {
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Grid,
  Container,
  CircularProgress,
  Box
} from '@mui/material';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import {
  preparePurchaseTypeLabel,
  prepareOrderStatusLabel
} from '@/utils/helpers';
import { PurchaseType } from '@/enums/purchase-type';
import { useObservable } from '@legendapp/state/react';
import { order$, setOrder } from '@/store/orderStore';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { orderService } from '@/data/orderService';
import { Order } from '@/types/Order.interface';

const OrderDetails = () => {
  const { t } = useTranslation();
  const { id: orderId } = useParams<{ id: string }>();
  const location = useLocation();
  const orderState = useObservable(order$);

  const findOrderFromStore = () => {
    const currentOrder = orderState.get();
    if (currentOrder && orderId && currentOrder.id === parseInt(orderId)) {
      return currentOrder;
    }
    return null;
  };

  const initialOrder = location.state?.order || findOrderFromStore();

  const [order, setOrderData] = useState<Order | null>(initialOrder);
  const [loading, setLoading] = useState<boolean>(!order);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setOrder(order);
    }
  }, [order]);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const result = await orderService.getById(Number(orderId));
      setOrderData(result);
      setOrder(result);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(t('order.fetch.error'));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    if (order) return;
    fetchOrderDetails();
  }, [fetchOrderDetails, order]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h4" color="error" gutterBottom>
          {error}
        </Typography>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom>
          {t('order.not.found')}
        </Typography>
      </Container>
    );
  }

  const {
    id,
    userName,
    userSurname,
    branchName,
    createdAt: orderCreatedAt,
    purchaseType,
    products,
    totalAmount,
    status,
    pointsSpent,
    netTotalPrice,
    tableCheck
  } = order;

  const partialPayments = tableCheck?.partialPayments;

  return (
    <>
      <Helmet>
        <title>{t('orders')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader showBackButton />
      </PageTitleWrapper>
      <Container>
        <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('order.id')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {id}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('order.date')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDateToDayMonthYearTime(orderCreatedAt)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('customer')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {userName} {userSurname}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('purchase.type')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {t(preparePurchaseTypeLabel(purchaseType))}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('branch')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {branchName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('order.status')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {t(prepareOrderStatusLabel(status))}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('order.total')}
              </Typography>
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                {totalAmount} TL
              </Typography>
            </Grid>
            {(purchaseType === PurchaseType.LOYALTY_POINTS ||
              purchaseType === PurchaseType.LOYALTY_POINTS_HYBRID) &&
              pointsSpent != null &&
              pointsSpent > 0 && (
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('order.points.spent')}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ color: '#8B5CF6' }}
                  >
                    {pointsSpent} Puan
                  </Typography>
                </Grid>
              )}
            {purchaseType === PurchaseType.LOYALTY_POINTS_HYBRID &&
              netTotalPrice != null &&
              netTotalPrice > 0 && (
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('order.extras.charged')}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ color: '#EDA600' }}
                  >
                    {netTotalPrice} TL
                  </Typography>
                </Grid>
              )}
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            {t('products')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {products && products.length > 0 ? (
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('name')}</TableCell>
                  <TableCell align="right">{t('quantity')}</TableCell>
                  <TableCell align="right">{t('price')}</TableCell>
                  <TableCell align="right">{t('total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {product.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={product.quantity}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{product.price} TL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {(product.price * product.quantity).toFixed(2)} TL
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              py={2}
            >
              {t('no.product.information')}
            </Typography>
          )}
        </Paper>

        {partialPayments && partialPayments.length > 1 && (
          <Paper elevation={3} sx={{ p: 3, mt: 2, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              {t('payment.details')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('payment.type')}</TableCell>
                  <TableCell align="right">{t('amount')}</TableCell>
                  <TableCell>{t('taken.by')}</TableCell>
                  <TableCell align="right">{t('payment.time')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partialPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(preparePurchaseTypeLabel(payment.paymentType))}
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {payment.amount} TL
                    </TableCell>
                    <TableCell>
                      {payment.takenByEmployee
                        ? `${payment.takenByEmployee.name} ${payment.takenByEmployee.surname}`
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {formatDateToDayMonthYearTime(payment.paidAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>
    </>
  );
};
export default OrderDetails;
