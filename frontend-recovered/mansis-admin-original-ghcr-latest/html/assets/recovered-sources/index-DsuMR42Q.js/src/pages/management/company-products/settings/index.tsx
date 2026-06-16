import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Box,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Container
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Settings,
  Business,
  Store,
  Security,
  Speed
} from '@mui/icons-material';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import { useTranslation } from 'react-i18next';
import { user$ } from '@/store/userStore';
import { companyProductService } from '@/data/companyProductService';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

// Types
interface CompanyProductSettings {
  id?: number;
  companyId: number;
  productStrategy: CompanyProductStrategy;
  allowBranchOverrides: boolean;
  allowCustomProducts: boolean;
  requireApproval: boolean;
  autoSyncMenuPrices: boolean;
}

enum CompanyProductStrategy {
  CENTRALIZED = 'CENTRALIZED',
  PRICE_FLEXIBLE = 'PRICE_FLEXIBLE',
  MIXED = 'MIXED',
  DECENTRALIZED = 'DECENTRALIZED'
}

interface StrategyInfo {
  strategy: CompanyProductStrategy;
  allowBranchOverrides: boolean;
  allowCustomProducts: boolean;
  requireApproval: boolean;
}

const CompanyProductSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const user = user$.get();

  const [settings, setSettings] = useState<CompanyProductSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [strategyInfo, setStrategyInfo] = useState<StrategyInfo | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingStrategy, setPendingStrategy] =
    useState<CompanyProductStrategy | null>(null);

  // Get strategy constraints when strategy changes
  const fetchStrategyConstraints = async (companyId: number) => {
    try {
      const result =
        await companyProductService.getStrategyConstraints(companyId);
      setStrategyInfo(result);
    } catch (error) {
      console.error('Error fetching strategy constraints:', error);
      // For now, set a default strategy info to prevent layout issues
      setStrategyInfo({
        strategy: CompanyProductStrategy.MIXED,
        allowBranchOverrides: true,
        allowCustomProducts: true,
        requireApproval: false
      });
    }
  };

  // Fetch current settings
  const fetchSettings = async () => {
    if (!user?.company?.id) return;

    try {
      setLoading(true);
      const result = await companyProductService.getSettings(user.company.id);
      setSettings(result);
      await fetchStrategyConstraints(user.company.id);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      // Create default settings for any error (including network errors)
      const defaultSettings: CompanyProductSettings = {
        companyId: user.company.id,
        productStrategy: CompanyProductStrategy.MIXED,
        allowBranchOverrides: true,
        allowCustomProducts: true,
        requireApproval: false,
        autoSyncMenuPrices: false
      };
      setSettings(defaultSettings);
      await fetchStrategyConstraints(user.company.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStrategyChangeRequest = (newStrategy: CompanyProductStrategy) => {
    if (!settings || newStrategy === settings.productStrategy) return;

    setPendingStrategy(newStrategy);
    setConfirmDialogOpen(true);
  };

  const handleConfirmStrategyChange = async () => {
    if (!settings || !pendingStrategy) return;

    setConfirmDialogOpen(false);
    setSaving(true);

    try {
      const result = await companyProductService.updateStrategy(
        user?.company?.id || 0,
        { strategy: pendingStrategy }
      );
      setSettings(result);
      setSuccessMessage(t('company.product.settings.strategy.updated'));
      await fetchStrategyConstraints(user!.company!.id);
    } catch (error) {
      console.error('Error updating strategy:', error);
      setErrorMessage(t('company.product.settings.strategy.update.error'));
    } finally {
      setSaving(false);
      setPendingStrategy(null);
    }
  };

  const handleCancelStrategyChange = () => {
    setConfirmDialogOpen(false);
    setPendingStrategy(null);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const result = await companyProductService.createSettings(settings);
      setSettings(result);
      setSuccessMessage(t('company.product.settings.saved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage(t('company.product.settings.save.error'));
    } finally {
      setSaving(false);
    }
  };

  const getStrategyDescription = (strategy: CompanyProductStrategy) => {
    switch (strategy) {
      case CompanyProductStrategy.CENTRALIZED:
        return t('company.product.strategy.centralized.description');
      case CompanyProductStrategy.PRICE_FLEXIBLE:
        return t('company.product.strategy.price_flexible.description');
      case CompanyProductStrategy.MIXED:
        return t('company.product.strategy.mixed.description');
      case CompanyProductStrategy.DECENTRALIZED:
        return t('company.product.strategy.decentralized.description');
      default:
        return '';
    }
  };

  const getStrategyIcon = (strategy: CompanyProductStrategy) => {
    switch (strategy) {
      case CompanyProductStrategy.CENTRALIZED:
        return <Business color="primary" />;
      case CompanyProductStrategy.PRICE_FLEXIBLE:
        return <Speed color="secondary" />;
      case CompanyProductStrategy.MIXED:
        return <Settings color="action" />;
      case CompanyProductStrategy.DECENTRALIZED:
        return <Store color="success" />;
      default:
        return <Settings />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">{t('company.product.settings.not.found')}</Alert>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('company.product.settings')}</title>
      </Helmet>

      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3} justifyContent="center">
          {strategyInfo && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  {getStrategyIcon(strategyInfo.strategy)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {t(
                      `company.product.strategy.${strategyInfo.strategy.toLowerCase()}`
                    )}
                  </Typography>
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    icon={
                      strategyInfo.allowBranchOverrides ? (
                        <CheckCircle />
                      ) : (
                        <Cancel />
                      )
                    }
                    label={t('company.product.settings.allow.branch.overrides')}
                    color={
                      strategyInfo.allowBranchOverrides ? 'success' : 'default'
                    }
                    variant={
                      strategyInfo.allowBranchOverrides ? 'filled' : 'outlined'
                    }
                  />
                  <Chip
                    icon={
                      strategyInfo.allowCustomProducts ? (
                        <CheckCircle />
                      ) : (
                        <Cancel />
                      )
                    }
                    label={t('company.product.settings.allow.custom.products')}
                    color={
                      strategyInfo.allowCustomProducts ? 'success' : 'default'
                    }
                    variant={
                      strategyInfo.allowCustomProducts ? 'filled' : 'outlined'
                    }
                  />
                  <Chip
                    icon={
                      strategyInfo.requireApproval ? (
                        <Security />
                      ) : (
                        <CheckCircle />
                      )
                    }
                    label={t('company.product.settings.require.approval')}
                    color={strategyInfo.requireApproval ? 'warning' : 'success'}
                  />
                </Box>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title={t('company.product.strategy.selection')}
                subheader={t('company.product.strategy.selection.subtitle')}
              />
              <CardContent>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={settings.productStrategy}
                    onChange={(e) =>
                      handleStrategyChangeRequest(
                        e.target.value as CompanyProductStrategy
                      )
                    }
                  >
                    {Object.values(CompanyProductStrategy).map((strategy) => (
                      <Paper
                        key={strategy}
                        sx={{
                          p: 2,
                          mb: 2,
                          border: settings.productStrategy === strategy ? 2 : 1,
                          borderColor:
                            settings.productStrategy === strategy
                              ? 'primary.main'
                              : 'divider'
                        }}
                      >
                        <FormControlLabel
                          value={strategy}
                          control={<Radio />}
                          label={
                            <Box>
                              <Box display="flex" alignItems="center">
                                {getStrategyIcon(strategy)}
                                <Typography variant="h6" sx={{ ml: 1 }}>
                                  {t(
                                    `company.product.strategy.${strategy.toLowerCase()}`
                                  )}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                              >
                                {getStrategyDescription(strategy)}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', width: '100%' }}
                        />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title={t('company.product.settings.additional')}
                subheader={t('company.product.settings.additional.subtitle')}
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText
                      primary={t(
                        'company.product.settings.auto.sync.menu.prices'
                      )}
                      secondary={t(
                        'company.product.settings.auto.sync.menu.prices.description'
                      )}
                    />
                    <Switch
                      checked={settings.autoSyncMenuPrices}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoSyncMenuPrices: e.target.checked
                        })
                      }
                      disabled={saving}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSaveSettings}
                  disabled={saving}
                  startIcon={
                    saving ? <CircularProgress size={20} /> : <Settings />
                  }
                >
                  {saving ? t('saving') : t('save.settings')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert
          variant="filled"
          severity="success"
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
      >
        <Alert
          variant="filled"
          severity="error"
          onClose={() => setErrorMessage('')}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={handleCancelStrategyChange}
        onConfirm={handleConfirmStrategyChange}
        title={t('company.product.settings.strategy.change.confirm.title')}
        message={
          pendingStrategy
            ? t('company.product.settings.strategy.change.confirm.message', {
                strategy: t(
                  `company.product.strategy.${pendingStrategy.toLowerCase()}`
                )
              })
            : ''
        }
        confirmButtonText={t(
          'company.product.settings.strategy.change.confirm.button'
        )}
        confirmButtonColor="warning"
      />
    </>
  );
};

export default CompanyProductSettingsPage;
