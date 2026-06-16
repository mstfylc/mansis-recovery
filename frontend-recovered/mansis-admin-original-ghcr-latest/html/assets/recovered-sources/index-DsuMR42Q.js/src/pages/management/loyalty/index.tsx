import { useState, useEffect, useCallback, useContext } from 'react';
import {
  Typography,
  Grid,
  Container,
  Paper,
  Box,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { loyaltyService } from '@/data/loyaltyService';
import {
  CompanyLoyaltySettingsListItem,
  UpdateCompanyLoyaltySettingsDto
} from '@/types/Loyalty.interface';
import NumericInput from '@/components/NumericInput';
import { user$ } from '@/store/userStore';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import AbilityContext from '@/contexts/AbilityContext';
import { Can } from '@casl/react';
import { Action } from '@/types/permissions';
import PageHeader from '@/content/Management/Loyalty/SettingsPageHeader';
import LoyaltySettingsTable from '@/content/Management/Loyalty/LoyaltySettingsTable';
import LoyaltySettingsDialog from '@/content/Management/Loyalty/LoyaltySettingsDialog';
import { Filters } from '@/types/Filters';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const LoyaltySettingsPage = () => {
  const { t } = useTranslation();
  const ability = useContext(AbilityContext);
  const { isSuperAdmin, isCompanyAdmin } = useUserViewMode();
  const companyId = user$.company.get()?.id;

  const [settingsItems, setSettingsItems] = useState<
    CompanyLoyaltySettingsListItem[]
  >([]);
  const [settingsTotalCount, setSettingsTotalCount] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] =
    useState<CompanyLoyaltySettingsListItem | null>(null);
  const [dialogSaving, setDialogSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateCompanyLoyaltySettingsDto>({
    isLoyaltyEnabled: false,
    dailyLoginPointsEnabled: true,
    dailyLoginPoints: 10,
    purchasePointsEnabled: false,
    purchasePointsPerUnit: 1
  });

  const canManageLoyaltySettings = ability.can(
    Action.Manage,
    'LoyaltySettings'
  );

  const fetchAllSettings = useCallback(
    async (filters: Filters) => {
      try {
        setSettingsLoading(true);
        const apiParams = transformFiltersToApiParams(filters);

        const result = await loyaltyService.getSettings(apiParams);

        setSettingsItems(result.items);
        setSettingsTotalCount(result.total);
      } catch (err: any) {
        console.error('Error fetching all loyalty settings:', err);
        setError(
          err.response?.data?.message || t('loyalty.settings.error.fetch')
        );
      } finally {
        setSettingsLoading(false);
      }
    },
    [t]
  );

  const handleEditSettings = (item: CompanyLoyaltySettingsListItem) => {
    setEditItem(item);
    setEditDialogOpen(true);
  };

  const handleSaveSettings = async (
    itemCompanyId: number,
    data: UpdateCompanyLoyaltySettingsDto
  ) => {
    try {
      setDialogSaving(true);
      await loyaltyService.updateSettings(itemCompanyId, data);
      setSuccess(t('loyalty.settings.save.success'));
      setEditDialogOpen(false);
      setEditItem(null);
      // Refresh list
      fetchAllSettings({ page: 0, limit: 10 });
    } catch (err: any) {
      console.error('Error saving loyalty settings:', err);
      setError(err.response?.data?.message || t('loyalty.settings.save.error'));
    } finally {
      setDialogSaving(false);
    }
  };

  // ============================================
  // COMPANY_ADMIN: Fetch own company settings
  // ============================================
  const fetchSettings = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const data = await loyaltyService.getSettingsByCompany(companyId);

      if (data.settings) {
        setFormData({
          isLoyaltyEnabled: data.settings.isLoyaltyEnabled,
          dailyLoginPointsEnabled: data.settings.dailyLoginPointsEnabled,
          dailyLoginPoints: data.settings.dailyLoginPoints,
          purchasePointsEnabled: data.settings.purchasePointsEnabled,
          purchasePointsPerUnit: data.settings.purchasePointsPerUnit
        });
      }
    } catch (err: any) {
      console.error('Error fetching loyalty settings:', err);
      setError(t('loyalty.settings.error.fetch'));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    if (isCompanyAdmin) {
      fetchSettings();
    }
  }, [isCompanyAdmin, fetchSettings]);

  const handleSave = async () => {
    if (!companyId) return;

    try {
      setSaving(true);
      await loyaltyService.updateSettings(companyId, formData);
      setSuccess(t('loyalty.settings.save.success'));
      fetchSettings();
    } catch (err) {
      console.error('Error saving loyalty settings:', err);
      setError(t('loyalty.settings.save.error'));
    } finally {
      setSaving(false);
    }
  };

  if (isSuperAdmin) {
    return (
      <>
        <Helmet>
          <title>{t('loyalty.settings.title')}</title>
        </Helmet>
        <PageTitleWrapper>
          <PageHeader />
        </PageTitleWrapper>

        <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <LoyaltySettingsTable
                items={settingsItems}
                loading={settingsLoading}
                totalCount={settingsTotalCount}
                onFilterChange={fetchAllSettings}
                onEditSettings={handleEditSettings}
                pageKey="loyalty-settings"
              />
            </Grid>
          </Grid>
        </Container>

        <LoyaltySettingsDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setEditItem(null);
          }}
          onSave={handleSaveSettings}
          item={editItem}
          saving={dialogSaving}
        />

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            variant="filled"
            severity="error"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            variant="filled"
            severity="success"
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // ============================================
  // COMPANY_ADMIN: Inline form view
  // ============================================
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('loyalty.settings.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Main Settings */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="h5">
                  {t('loyalty.settings.general')}
                </Typography>
                <Chip
                  label={
                    formData.isLoyaltyEnabled ? t('active') : t('inactive')
                  }
                  color={formData.isLoyaltyEnabled ? 'success' : 'default'}
                />
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isLoyaltyEnabled}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isLoyaltyEnabled: e.target.checked
                          }))
                        }
                        color="primary"
                        disabled={!canManageLoyaltySettings}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {t('loyalty.settings.enable')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('loyalty.settings.enable.description')}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Daily Login Points */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {t('loyalty.settings.daily.login')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.dailyLoginPointsEnabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dailyLoginPointsEnabled: e.target.checked
                      }))
                    }
                    disabled={
                      !formData.isLoyaltyEnabled || !canManageLoyaltySettings
                    }
                  />
                }
                label={t('loyalty.settings.daily.login.enable')}
                sx={{ mb: 2 }}
              />

              <NumericInput
                fullWidth
                label={t('loyalty.settings.daily.login.points')}
                value={formData.dailyLoginPoints || 0}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dailyLoginPoints: value
                  }))
                }
                disabled={
                  !formData.isLoyaltyEnabled ||
                  !formData.dailyLoginPointsEnabled ||
                  !canManageLoyaltySettings
                }
                allowDecimals={false}
                allowNegative={false}
                min={1}
                max={1000}
                helperText={t('loyalty.settings.daily.login.points.helper')}
              />
            </Paper>
          </Grid>

          {/* Purchase Points */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {t('loyalty.settings.purchase')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.purchasePointsEnabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        purchasePointsEnabled: e.target.checked
                      }))
                    }
                    disabled={
                      !formData.isLoyaltyEnabled || !canManageLoyaltySettings
                    }
                  />
                }
                label={t('loyalty.settings.purchase.enable')}
                sx={{ mb: 2 }}
              />

              <NumericInput
                fullWidth
                label={t('loyalty.settings.purchase.points.per.unit')}
                value={formData.purchasePointsPerUnit || 0}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchasePointsPerUnit: value
                  }))
                }
                disabled={
                  !formData.isLoyaltyEnabled ||
                  !formData.purchasePointsEnabled ||
                  !canManageLoyaltySettings
                }
                allowDecimals={false}
                allowNegative={false}
                min={1}
                max={100}
                helperText={t(
                  'loyalty.settings.purchase.points.per.unit.helper'
                )}
              />
            </Paper>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Can I="manage" a="LoyaltySettings" ability={ability}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : t('save')}
                </Button>
              </Can>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert variant="filled" severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          variant="filled"
          severity="success"
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LoyaltySettingsPage;
