import { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Box,
  Button,
  Alert,
  AlertTitle,
  Divider,
  LinearProgress,
  Snackbar,
  Tooltip
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { licensingService } from '@/data/licensingService';
import {
  BranchSubscription,
  SubscriptionStatus,
  FeatureKey,
  SmsQuotaStatus
} from '@/types/Licensing.interface';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './Subscription/PageHeader';
import { differenceInDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';

const SubscriptionPage = () => {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<BranchSubscription | null>(
    null
  );
  const [smsQuota, setSmsQuota] = useState<SmsQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getFeatureLabel = (featureKey: string): string => {
    const labelMap: Record<string, string> = {
      [FeatureKey.POS]: 'POS',
      [FeatureKey.PRODUCTS]: t('product.management'),
      [FeatureKey.USERS]: t('user.management'),
      [FeatureKey.CAMPAIGNS]: t('campaign.management'),
      [FeatureKey.ORDERS]: t('orders'),
      [FeatureKey.DESKTOP_APP]: t('licensing.feature.desktop.app'),
      [FeatureKey.MOBILE_LOYALTY]: t('licensing.feature.mobile.loyalty'),
      [FeatureKey.DAILY_LOGINS]: t('licensing.feature.daily.logins'),
      [FeatureKey.ACTIVITIES]: t('licensing.feature.activities'),
      [FeatureKey.TICKETS]: t('licensing.feature.tickets'),
      [FeatureKey.MEMBERSHIPS]: t('licensing.feature.memberships'),
      [FeatureKey.STOCK]: t('stock.management'),
      [FeatureKey.BATCHES]: t('licensing.feature.batches'),
      [FeatureKey.RECIPE]: t('recipes.management.title'),
      [FeatureKey.WAREHOUSE]: t('warehouse.management'),
      [FeatureKey.INGREDIENTS]: t('ingredients.management.title'),
      [FeatureKey.FINANCE]: t('finance.management'),
      [FeatureKey.REPORTS]: t('licensing.feature.reports'),
      [FeatureKey.ANALYTICS]: t('licensing.feature.analytics'),
      [FeatureKey.INTEGRATIONS]: t('integrations.title'),
      [FeatureKey.NOTIFICATIONS]: t('notification.management')
    };
    return labelMap[featureKey] || featureKey;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subResult, quotaResult] = await Promise.all([
        licensingService.getSubscription(),
        licensingService.getSmsQuota()
      ]);

      setSubscription(subResult || null);
      setSmsQuota(quotaResult || null);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || t('licensing.subscription.fetch.error')
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    const colorMap: Record<
      SubscriptionStatus,
      'success' | 'warning' | 'error' | 'info' | 'default'
    > = {
      [SubscriptionStatus.ACTIVE]: 'success',
      [SubscriptionStatus.TRIALING]: 'info',
      [SubscriptionStatus.PAST_DUE]: 'warning',
      [SubscriptionStatus.EXPIRED]: 'error',
      [SubscriptionStatus.CANCELLED]: 'default'
    };
    return colorMap[status] || 'default';
  };

  const getStatusLabel = (status: SubscriptionStatus) => {
    const labelMap: Record<SubscriptionStatus, string> = {
      [SubscriptionStatus.ACTIVE]: t('licensing.status.active'),
      [SubscriptionStatus.TRIALING]: t('licensing.status.trialing'),
      [SubscriptionStatus.PAST_DUE]: t('licensing.status.past.due'),
      [SubscriptionStatus.EXPIRED]: t('licensing.status.expired'),
      [SubscriptionStatus.CANCELLED]: t('licensing.status.cancelled')
    };
    return labelMap[status] || status;
  };

  const getDaysRemaining = (): number | null => {
    if (!subscription) return null;

    if (
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.trialEndsAt
    ) {
      return differenceInDays(new Date(subscription.trialEndsAt), new Date());
    }

    if (subscription.endDate) {
      return differenceInDays(new Date(subscription.endDate), new Date());
    }

    return null;
  };

  const formatDate = (date: string | Date): string => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: tr });
  };

  const daysRemaining = getDaysRemaining();

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{t('licensing.subscription.title')}</title>
        </Helmet>
        <LinearProgress />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('licensing.subscription.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Grid container spacing={3} sx={{ px: 8 }}>
        {/* Current Subscription */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title={t('licensing.current.subscription')} />
            <Divider />
            <CardContent>
              {subscription ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Typography variant="h4">
                      {subscription.plan?.displayName}
                    </Typography>
                    <Chip
                      label={getStatusLabel(subscription.status)}
                      color={getStatusColor(subscription.status)}
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('licensing.start.date')}
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(subscription.startDate)}
                      </Typography>
                    </Grid>

                    {subscription.endDate && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('licensing.end.date')}
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(subscription.endDate)}
                        </Typography>
                      </Grid>
                    )}

                    {subscription.trialEndsAt &&
                      subscription.status === SubscriptionStatus.TRIALING && (
                        <Grid item xs={6} sm={3}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('licensing.trial.ends')}
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(subscription.trialEndsAt)}
                          </Typography>
                        </Grid>
                      )}

                    {daysRemaining !== null && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('licensing.days.remaining')}
                        </Typography>
                        <Typography
                          variant="body1"
                          color={
                            daysRemaining <= 3
                              ? 'error'
                              : daysRemaining <= 15
                                ? 'warning.main'
                                : 'text.primary'
                          }
                          fontWeight="bold"
                        >
                          {daysRemaining > 0 ? daysRemaining : 0}{' '}
                          {t('licensing.days')}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {subscription.status === SubscriptionStatus.EXPIRED && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <AlertTitle>{t('subscription.system.locked')}</AlertTitle>
                      {t('subscription.expired.message')}
                    </Alert>
                  )}

                  {subscription.status === SubscriptionStatus.TRIALING && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {t('licensing.trial.info')}
                    </Alert>
                  )}

                  <Box mt={3}>
                    <Tooltip title={t('licensing.coming.soon')} arrow>
                      <span>
                        <Button
                          variant="contained"
                          color="primary"
                          size="large"
                          disabled
                        >
                          {subscription.status === SubscriptionStatus.EXPIRED
                            ? t('subscription.renew')
                            : t('licensing.extend.subscription')}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              ) : (
                <Alert severity="warning">
                  {t('licensing.no.subscription')}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SMS Quota */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title={t('licensing.sms.quota')} />
            <Divider />
            <CardContent>
              {smsQuota ? (
                <Box>
                  <Box mb={2}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('licensing.sms.used')}
                        </Typography>
                        <Typography variant="h4">
                          {smsQuota.usedThisMonth} / {smsQuota.totalQuota}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">
                          {t('licensing.sms.extra')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {smsQuota.extraPurchased}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        smsQuota.totalQuota > 0
                          ? Math.min(
                              (smsQuota.usedThisMonth / smsQuota.totalQuota) *
                                100,
                              100
                            )
                          : 0
                      }
                      color={
                        smsQuota.remaining <= 0
                          ? 'error'
                          : smsQuota.remaining < 100
                            ? 'warning'
                            : 'primary'
                      }
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Tooltip title={t('licensing.coming.soon')} arrow>
                    <span>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ mt: 2 }}
                        disabled
                      >
                        {t('licensing.sms.buy.extra')}
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('licensing.sms.no.data')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Available Features */}
        {subscription?.plan?.features && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title={t('licensing.available.features')} />
              <Divider />
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {subscription.plan.features.map((feature) => (
                    <Chip
                      key={feature.id}
                      label={getFeatureLabel(feature.featureKey)}
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SubscriptionPage;
