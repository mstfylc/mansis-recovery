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
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { licensingService } from '@/data/licensingService';
import { branchService } from '@/data/branchService';
import { Branch } from '@/types/Branch.interface';
import { Plan, AssignPlanData } from '@/types/Licensing.interface';
import NumericInput from '@/components/NumericInput';
import StyledDatePicker from '@/components/date&time/StyledDatePicker';

type AssignSubscriptionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssignPlanData) => Promise<void>;
};

const AssignSubscriptionDialog = ({
  open,
  onClose,
  onSubmit
}: AssignSubscriptionDialogProps) => {
  const { t } = useTranslation();
  const [branchId, setBranchId] = useState<number | ''>('');
  const [planId, setPlanId] = useState<number | ''>('');
  const [startTrial, setStartTrial] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [priceOverride, setPriceOverride] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [canStartTrial, setCanStartTrial] = useState(false);
  const [existingSubscriptionWarning, setExistingSubscriptionWarning] =
    useState<string | undefined>();
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const resetForm = () => {
    setBranchId('');
    setPlanId('');
    setStartTrial(false);
    setStartDate(null);
    setPriceOverride(0);
    setError(undefined);
    setExistingSubscriptionWarning(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [branchesData, plansRes] = await Promise.all([
        branchService.getAllFlat({ getAll: true }),
        licensingService.getPlans()
      ]);

      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setPlans(plansRes || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      resetForm();
    }
  }, [open]);

  // Check for existing subscription when branch is selected
  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (!branchId) {
        setExistingSubscriptionWarning(undefined);
        return;
      }

      try {
        setCheckingSubscription(true);
        const subscription = await licensingService.getSubscription({
          branchId
        });

        if (subscription) {
          const isActive = ['ACTIVE', 'TRIALING'].includes(subscription.status);
          const isNonActive = ['PAST_DUE', 'EXPIRED', 'CANCELLED'].includes(
            subscription.status
          );

          if (isActive || isNonActive) {
            // Get localized status text
            const getStatusText = (status: string): string => {
              switch (status) {
                case 'ACTIVE':
                  return t('licensing.subscription.status.active');
                case 'TRIALING':
                  return t('licensing.subscription.status.trialing');
                case 'PAST_DUE':
                  return t('licensing.subscription.status.pastDue');
                case 'EXPIRED':
                  return t('licensing.subscription.status.expired');
                default:
                  return t('licensing.subscription.status.cancelled');
              }
            };

            const statusText = getStatusText(subscription.status);
            const warningKey = isActive
              ? 'licensing.subscription.warning.existingActiveSubscription'
              : 'licensing.subscription.warning.existingSubscription';

            setExistingSubscriptionWarning(
              t(warningKey, {
                status: statusText,
                plan: subscription.plan?.displayName || '-'
              })
            );
          } else {
            setExistingSubscriptionWarning(undefined);
          }
        } else {
          setExistingSubscriptionWarning(undefined);
        }
      } catch (error: any) {
        // 404 is expected if no subscription exists
        if (error?.response?.status !== 404) {
          console.error('Error checking subscription:', error);
        }
        setExistingSubscriptionWarning(undefined);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkExistingSubscription();
  }, [branchId, t]);

  useEffect(() => {
    if (planId && plans.length > 0) {
      const plan = plans.find((p) => p.id === planId);
      setSelectedPlan(plan || null);

      const trialSupported = !!(plan && plan.trialDays > 0);
      setCanStartTrial(trialSupported);

      if (!trialSupported && startTrial) {
        setStartTrial(false);
      }
    } else {
      setSelectedPlan(null);
      setCanStartTrial(false);
    }
  }, [planId, plans, startTrial]);

  const handleSubmit = async () => {
    if (!branchId || !planId) {
      setError(t('licensing.subscription.form.validation.required'));
      return;
    }

    if (!startTrial && !startDate) {
      setError(t('licensing.subscription.form.validation.startDateRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const data: AssignPlanData = {
        branchId: branchId,
        planId: planId
      };

      if (startTrial) {
        data.startTrial = true;
      } else if (startDate) {
        data.startDate = startDate.toISOString();
      }

      if (!startTrial && priceOverride > 0) {
        data.priceOverride = priceOverride;
      }

      await onSubmit(data);
      handleClose();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('licensing.subscription.assign')}</DialogTitle>
      <DialogContent>
        {loadingData ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}

            {existingSubscriptionWarning && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  '& .MuiAlert-message': { width: '100%' },
                  border: '2px solid',
                  borderColor: 'error.main'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {existingSubscriptionWarning}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: 'error.dark' }}
                >
                  ⚠️ {t('licensing.subscription.warning.willBeCancelled')}
                </Typography>
              </Alert>
            )}

            <FormControl fullWidth required>
              <InputLabel>{t('branch.name')}</InputLabel>
              <Select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value as number)}
                label={t('branch.name')}
                disabled={checkingSubscription}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name} ({branch.company?.name || '-'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
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

            {selectedPlan && (
              <>
                {canStartTrial ? (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={startTrial}
                        onChange={(e) => setStartTrial(e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {t('licensing.subscription.startWithTrialDays', {
                          trialDays: selectedPlan.trialDays
                        })}
                      </Typography>
                    }
                  />
                ) : (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    <Typography variant="body2">
                      {t('licensing.subscription.noTrialAvailable')}
                    </Typography>
                  </Alert>
                )}
              </>
            )}

            {!startTrial && (
              <>
                <StyledDatePicker
                  label={t('licensing.subscription.startDate')}
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholder={t('licensing.subscription.form.startDateHelp')}
                  required
                />

                <NumericInput
                  label={t('licensing.subscription.priceOverride')}
                  value={priceOverride}
                  onChange={setPriceOverride}
                  fullWidth
                  allowDecimals
                  decimalPlaces={2}
                  min={0}
                  showEmptyForZero={true}
                  helperText={t(
                    'licensing.subscription.form.priceOverrideHelp'
                  )}
                />
              </>
            )}
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

export default AssignSubscriptionDialog;
