import { FC, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  InputAdornment,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Plan, BillingCycle, FeatureKey } from '@/types/Licensing.interface';
import NumericInput from '@/components/NumericInput';

interface PlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreatePlanData) => Promise<void>;
  plan?: Plan | null;
  error?: string;
}

export interface CreatePlanData {
  displayName: string;
  price: number;
  billingCycle: BillingCycle;
  trialDays: number;
  smsQuota: number;
  notes?: string;
  features: Array<{
    key: FeatureKey;
    quotaLimit?: number;
  }>;
}

const ALL_FEATURES = [
  { key: FeatureKey.POS, labelKey: 'licensing.features.pos' },
  { key: FeatureKey.PRODUCTS, labelKey: 'licensing.features.products' },
  { key: FeatureKey.USERS, labelKey: 'licensing.features.users' },
  { key: FeatureKey.CAMPAIGNS, labelKey: 'licensing.features.campaigns' },
  { key: FeatureKey.ORDERS, labelKey: 'licensing.features.orders' },
  { key: FeatureKey.DESKTOP_APP, labelKey: 'licensing.features.desktop_app' },
  { key: FeatureKey.ACTIVITIES, labelKey: 'licensing.features.activities' },
  { key: FeatureKey.MEMBERSHIPS, labelKey: 'licensing.features.memberships' },
  {
    key: FeatureKey.MOBILE_LOYALTY,
    labelKey: 'licensing.features.mobile_loyalty'
  },
  {
    key: FeatureKey.DAILY_LOGINS,
    labelKey: 'licensing.features.daily_logins'
  },
  { key: FeatureKey.STOCK, labelKey: 'licensing.features.stock' },
  { key: FeatureKey.RECIPE, labelKey: 'licensing.features.recipe' },
  { key: FeatureKey.WAREHOUSE, labelKey: 'licensing.features.warehouse' },
  { key: FeatureKey.INGREDIENTS, labelKey: 'licensing.features.ingredients' },
  {
    key: FeatureKey.TABLE_MANAGEMENT,
    labelKey: 'licensing.features.table_management'
  },
  { key: FeatureKey.FINANCE, labelKey: 'licensing.features.finance' },
  { key: FeatureKey.REPORTS, labelKey: 'licensing.features.reports' },
  { key: FeatureKey.ANALYTICS, labelKey: 'licensing.features.analytics' },
  { key: FeatureKey.INTEGRATIONS, labelKey: 'licensing.features.integrations' },
  {
    key: FeatureKey.NOTIFICATIONS,
    labelKey: 'licensing.features.notifications'
  }
];

const PlanDialog: FC<PlanDialogProps> = ({
  open,
  onClose,
  onSave,
  plan,
  error
}) => {
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY
  );
  const [trialDays, setTrialDays] = useState<number>(15);
  const [smsQuota, setSmsQuota] = useState<number>(1000);
  const [notes, setNotes] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<Set<FeatureKey>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const isEditMode = !!plan;

  const resetForm = () => {
    setDisplayName('');
    setPrice(0);
    setBillingCycle(BillingCycle.MONTHLY);
    setTrialDays(15);
    setSmsQuota(1000);
    setNotes('');
    setSelectedFeatures(new Set());
    setValidationError('');
  };

  useEffect(() => {
    if (!open) return;

    if (isEditMode && plan) {
      setDisplayName(plan.displayName);
      setPrice(plan.price);
      setBillingCycle(plan.billingCycle);
      setTrialDays(plan.trialDays);
      setSmsQuota(plan.smsQuota || 1000);
      setNotes(plan.notes || '');

      // Set selected features
      if (plan.features) {
        const features = new Set(plan.features.map((f) => f.featureKey));
        setSelectedFeatures(features);
      }
    } else {
      resetForm();
    }
  }, [open, plan, isEditMode]);

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleFeatureToggle = (featureKey: FeatureKey) => {
    setSelectedFeatures((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(featureKey)) {
        newSet.delete(featureKey);
      } else {
        newSet.add(featureKey);
      }
      return newSet;
    });
  };

  const validateForm = (): boolean => {
    if (!displayName.trim()) {
      setValidationError(
        t('licensing.plan.form.validation.displayNameRequired')
      );
      return false;
    }

    if (displayName.length < 2 || displayName.length > 100) {
      setValidationError(t('licensing.plan.form.validation.displayNameLength'));
      return false;
    }

    if (price < 0) {
      setValidationError(t('licensing.plan.form.validation.priceNegative'));
      return false;
    }

    if (trialDays < 0) {
      setValidationError(t('licensing.plan.form.validation.trialDaysNegative'));
      return false;
    }

    if (smsQuota < 0) {
      setValidationError(t('licensing.plan.form.validation.smsQuotaNegative'));
      return false;
    }

    if (selectedFeatures.size === 0) {
      setValidationError(t('licensing.plan.form.validation.featuresRequired'));
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (loading) return;

    setLoading(true);

    const data: CreatePlanData = {
      displayName: displayName.trim(),
      price: Number(price),
      billingCycle,
      trialDays: Number(trialDays),
      smsQuota: Number(smsQuota),
      notes: notes.trim() || undefined,
      features: Array.from(selectedFeatures).map((key) => ({ key }))
    };

    await onSave(data);
    resetForm();
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode
          ? t('licensing.plan.edit.title')
          : t('licensing.plan.create.title')}
        {isEditMode && plan && ` - ${plan.displayName}`}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(error || validationError) && (
            <Alert severity="error">{error || validationError}</Alert>
          )}

          <TextField
            label={t('licensing.plan.form.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 100 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <NumericInput
                label={t('licensing.plan.form.price')}
                value={price}
                onChange={setPrice}
                fullWidth
                required
                allowDecimals
                decimalPlaces={2}
                min={0}
                showEmptyForZero={false}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₺</InputAdornment>
                  )
                }}
                helperText={t('licensing.plan.form.priceHelp')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('licensing.plan.form.billingCycle')}</InputLabel>
                <Select
                  value={billingCycle}
                  onChange={(e) =>
                    setBillingCycle(e.target.value as BillingCycle)
                  }
                  label={t('licensing.plan.form.billingCycle')}
                >
                  <MenuItem value={BillingCycle.MONTHLY}>
                    {t('licensing.billingCycle.monthly')}
                  </MenuItem>
                  <MenuItem value={BillingCycle.YEARLY}>
                    {t('licensing.billingCycle.yearly')}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <NumericInput
            label={t('licensing.plan.form.trialDays')}
            value={trialDays}
            onChange={setTrialDays}
            fullWidth
            required
            min={0}
            max={365}
            showEmptyForZero={false}
          />

          <NumericInput
            label={t('licensing.plan.form.smsQuota')}
            value={smsQuota}
            onChange={setSmsQuota}
            fullWidth
            required
            min={0}
            max={1000000}
            showEmptyForZero={false}
            helperText={t('licensing.plan.form.smsQuotaHelp')}
          />

          <TextField
            label={t('licensing.plan.form.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            inputProps={{ maxLength: 500 }}
            helperText={`${notes.length}/500`}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('licensing.plan.form.features')} *
            </Typography>
            <FormGroup>
              <Grid container spacing={1}>
                {ALL_FEATURES.map((feature) => (
                  <Grid item xs={12} sm={6} md={4} key={feature.key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedFeatures.has(feature.key)}
                          onChange={() => handleFeatureToggle(feature.key)}
                        />
                      }
                      label={t(feature.labelKey)}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
            {selectedFeatures.size === 0 && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 1, display: 'block' }}
              >
                {t('licensing.plan.form.selectFeatures')}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanDialog;
