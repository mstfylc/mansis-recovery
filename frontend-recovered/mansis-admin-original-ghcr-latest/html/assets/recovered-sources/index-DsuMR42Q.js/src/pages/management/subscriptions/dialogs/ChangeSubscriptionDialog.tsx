import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { licensingService } from '@/data/licensingService';
import {
  Plan,
  UpdateSubscriptionData,
  BranchSubscriptionDetailed,
  SubscriptionStatus
} from '@/types/Licensing.interface';
import NumericInput from '@/components/NumericInput';
import StyledDatePicker from '@/components/date&time/StyledDatePicker';

type ChangeSubscriptionDialogProps = {
  open: boolean;
  onClose: () => void;
  subscription: BranchSubscriptionDetailed | null;
  onSubmit: (data: UpdateSubscriptionData) => Promise<void>;
};

const ChangeSubscriptionDialog = ({
  open,
  onClose,
  subscription,
  onSubmit
}: ChangeSubscriptionDialogProps) => {
  const { t } = useTranslation();
  const [planId, setPlanId] = useState<number | ''>('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [priceOverride, setPriceOverride] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const resetForm = () => {
    setPlanId('');
    setStatus('');
    setStartDate(null);
    setEndDate(null);
    setTrialEndsAt(null);
    setPriceOverride(0);
    setError(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchPlans = async () => {
    try {
      setLoadingData(true);
      const result = await licensingService.getPlans();
      setPlans(result || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPlans();
      if (subscription) {
        setPlanId(subscription.planId);
        setStatus(subscription.status);
        setStartDate(
          subscription.startDate ? new Date(subscription.startDate) : null
        );
        setEndDate(
          subscription.endDate ? new Date(subscription.endDate) : null
        );
        setTrialEndsAt(
          subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null
        );
        setPriceOverride(subscription.priceOverride || 0);
      }
    }
  }, [open, subscription]);

  const handleSubmit = async () => {
    if (!subscription) {
      setError(t('common.error'));
      return;
    }

    // Validasyon: Bitiş tarihi geçmişte olamaz
    if (endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      if (end < today) {
        setError(
          'Bitiş tarihi geçmişte olamaz. Bugün veya gelecekte bir tarih olmalıdır.'
        );
        return;
      }
    }

    try {
      setLoading(true);
      setError(undefined);

      const data: UpdateSubscriptionData = {
        branchId: subscription.branchId
      };

      if (planId && planId !== subscription.planId) {
        data.newPlanId = planId as number;
      }

      if (status && status !== subscription.status) {
        data.status = status as SubscriptionStatus;
      }

      if (startDate) {
        data.startDate = startDate.toISOString();
      }

      if (endDate) {
        data.endDate = endDate.toISOString();
      }

      if (trialEndsAt) {
        data.trialEndsAt = trialEndsAt.toISOString();
      }

      // Her zaman gönder - 0 ise backend null'a çevirecek (override'ı temizler)
      data.priceOverride = priceOverride;

      await onSubmit(data);
      handleClose();
    } catch (err: any) {
      console.error('Error updating subscription:', err);
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    {
      value: SubscriptionStatus.TRIALING,
      label: t('licensing.subscription.status.trialing')
    },
    {
      value: SubscriptionStatus.ACTIVE,
      label: t('licensing.subscription.status.active')
    },
    {
      value: SubscriptionStatus.PAST_DUE,
      label: t('licensing.subscription.status.past_due')
    },
    {
      value: SubscriptionStatus.EXPIRED,
      label: t('licensing.subscription.status.expired')
    },
    {
      value: SubscriptionStatus.CANCELLED,
      label: t('licensing.subscription.status.cancelled')
    }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('licensing.subscription.change')}</DialogTitle>
      <DialogContent>
        {loadingData ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}

            {subscription && (
              <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    {t('licensing.subscription.currentInfo')}
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.75}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {t('branch.name')}:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {subscription.branch.name}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {t('company.name')}:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {subscription.branch.company.name}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {t('licensing.subscription.currentPlan')}:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color="primary.main"
                      >
                        {subscription.plan.displayName}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('licensing.plan.name')}</InputLabel>
                  <Select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value as number)}
                    label={t('licensing.plan.name')}
                  >
                    {plans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.displayName} - ₺{plan.price}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>
                    {t('licensing.subscription.status.label')}
                  </InputLabel>
                  <Select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as SubscriptionStatus)
                    }
                    label={t('licensing.subscription.status.label')}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <NumericInput
                  label={t('licensing.subscription.priceOverride')}
                  value={priceOverride}
                  onChange={setPriceOverride}
                  fullWidth
                  allowDecimals
                  decimalPlaces={2}
                  min={0}
                  showEmptyForZero={true}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <StyledDatePicker
                  label={t('licensing.subscription.startDate')}
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <StyledDatePicker
                  label={t('licensing.subscription.endDate')}
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                />
              </Grid>

              {status === SubscriptionStatus.TRIALING && (
                <Grid item xs={12} sm={6}>
                  <StyledDatePicker
                    label={t('licensing.subscription.trialEndsAt')}
                    selected={trialEndsAt}
                    onChange={(date) => setTrialEndsAt(date)}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loadingData || loading}
        >
          {loading ? <CircularProgress size={24} /> : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeSubscriptionDialog;
