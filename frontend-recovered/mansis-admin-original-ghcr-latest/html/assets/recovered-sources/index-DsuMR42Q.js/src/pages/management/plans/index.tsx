import { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  Box,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TablePagination
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { EditTwoTone, DeleteTwoTone, SmsOutlined } from '@mui/icons-material';
import { licensingService } from '@/data/licensingService';
import { Plan, FeatureKey } from '@/types/Licensing.interface';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import PlanDialog, { CreatePlanData } from './PlanDialog';

const PlansManagement = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogError, setDialogError] = useState<string>('');

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(3);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const result = await licensingService.getPlans();
      setPlans(result || []);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || t('licensing.plans.fetch.error')
      );
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers
  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setDialogError('');
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogError('');
    setDialogOpen(true);
  };

  const handleSavePlan = async (data: CreatePlanData) => {
    try {
      if (selectedPlan) {
        // Update existing plan
        await licensingService.updatePlan(selectedPlan.id, data);
        setSuccessMessage(t('licensing.plan.edit.success'));
      } else {
        // Create new plan
        await licensingService.createPlan(data);
        setSuccessMessage(t('licensing.plan.create.success'));
      }

      await fetchPlans();
      setDialogOpen(false);
      setDialogError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('error.occurred');
      setDialogError(errorMsg);
      throw err; // Re-throw to keep dialog open
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletePlanId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePlanId) return;

    try {
      setDeleting(true);
      await licensingService.deletePlan(deletePlanId);
      setSuccessMessage(t('licensing.plan.delete.success'));

      // Fetch updated plans
      await fetchPlans();

      // Check if current page becomes empty after deletion
      const currentPagePlans = plans.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );

      // If we deleted the last item on current page and we're not on first page
      if (currentPagePlans.length === 1 && page > 0) {
        setPage(page - 1);
      }

      setDeleteDialogOpen(false);
      setDeletePlanId(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('error.occurred');
      setErrorMessage(errorMsg);
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeletePlanId(null);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getFeatureLabel = (featureKey: string): string => {
    const labelMap: Record<string, string> = {
      [FeatureKey.POS]: 'POS',
      [FeatureKey.PRODUCTS]: t('product.management'),
      [FeatureKey.USERS]: t('user.management'),
      [FeatureKey.CAMPAIGNS]: t('campaign.management'),
      [FeatureKey.ORDERS]: t('orders'),
      [FeatureKey.DESKTOP_APP]: t('licensing.feature.desktop.app'),
      [FeatureKey.ACTIVITIES]: t('activities'),
      [FeatureKey.MEMBERSHIPS]: t('membership.management.title'),
      [FeatureKey.MOBILE_LOYALTY]: t('licensing.feature.mobile.loyalty'),
      [FeatureKey.DAILY_LOGINS]: t('licensing.feature.daily.logins'),
      [FeatureKey.STOCK]: t('stock.management'),
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

  // Pagination
  const paginatedPlans = plans.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      <Helmet>
        <title>{t('licensing.plans.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader onAddPlan={handleCreatePlan} />
      </PageTitleWrapper>

      <Grid container spacing={3} sx={{ px: 8, pb: 3 }}>
        {loading ? (
          <Grid item xs={12}>
            <Typography>{t('loading')}...</Typography>
          </Grid>
        ) : paginatedPlans.length === 0 ? (
          <Grid item xs={12}>
            <Typography>{t('licensing.no.plans')}</Typography>
          </Grid>
        ) : (
          paginatedPlans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  minHeight: 480,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardHeader
                  title={plan.displayName}
                  subheader={`${formatPrice(Number(plan.price))} / ${t(`licensing.billing.${plan.billingCycle.toLowerCase()}`)}`}
                  action={
                    <Box>
                      <Tooltip title={t('edit')}>
                        <IconButton
                          onClick={() => handleEditPlan(plan)}
                          size="small"
                        >
                          <EditTwoTone />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          plan.isCustom
                            ? t('delete')
                            : t('licensing.plan.delete.disabled')
                        }
                      >
                        <span>
                          <IconButton
                            onClick={() => handleDeleteClick(plan.id)}
                            disabled={!plan.isCustom}
                            size="small"
                          >
                            <DeleteTwoTone />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  }
                />
                <Divider />
                <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
                  <Box mb={2}>
                    <Chip
                      label={
                        plan.isCustom
                          ? t('licensing.plan.custom')
                          : t('licensing.plan.standard')
                      }
                      color={plan.isCustom ? 'warning' : 'primary'}
                      size="small"
                    />
                    {plan.trialDays > 0 && (
                      <Chip
                        label={t('licensing.trial.days', {
                          days: plan.trialDays
                        })}
                        color="info"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                    <Chip
                      icon={<SmsOutlined />}
                      label={`${new Intl.NumberFormat('tr-TR').format(
                        plan.smsQuota || 0
                      )} ${t('licensing.plan.sms.right')}`}
                      color="secondary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    {t('licensing.features')} ({plan.features?.length || 0})
                  </Typography>

                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}
                  >
                    {plan.features?.map((feature) => (
                      <Chip
                        key={feature.id}
                        label={getFeatureLabel(feature.featureKey)}
                        size="small"
                        variant="outlined"
                        color={feature.enabled ? 'success' : 'default'}
                      />
                    ))}
                    {(!plan.features || plan.features.length === 0) && (
                      <Typography variant="body2" color="text.secondary">
                        {t('licensing.no.features')}
                      </Typography>
                    )}
                  </Box>

                  {plan.notes && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('licensing.plan.notes')}:
                      </Typography>
                      <Tooltip title={plan.notes}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {plan.notes}
                        </Typography>
                      </Tooltip>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination */}
      {!loading && plans.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 3 }}>
          <TablePagination
            component="div"
            count={plans.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[3]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count}`
            }
          />
        </Box>
      )}

      {/* Plan Create/Edit Dialog */}
      <PlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSavePlan}
        plan={selectedPlan}
        error={dialogError}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('licensing.plan.delete.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('licensing.plan.delete.message')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? t('deleting') : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
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

export default PlansManagement;
