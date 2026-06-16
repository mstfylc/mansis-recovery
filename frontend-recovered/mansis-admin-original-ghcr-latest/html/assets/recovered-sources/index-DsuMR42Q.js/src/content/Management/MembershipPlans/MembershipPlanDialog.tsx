import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Box,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { membershipPlanService } from '@/data/membershipPlanService';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import {
  MembershipPlan,
  MembershipPlanStatus
} from '@/types/MembershipPlan.interface';

interface MembershipPlanDialogProps {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  plan: MembershipPlan | null;
  branchId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MembershipPlanDialog = ({
  open,
  mode,
  plan,
  branchId,
  onClose,
  onSuccess
}: MembershipPlanDialogProps) => {
  const { t } = useTranslation();
  const {
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    isAdminView,
    company,
    currentBranch
  } = useUserViewMode();

  const [formData, setFormData] = useState({
    name: '',
    durationDays: 30,
    validityDays: 45,
    price: 0,
    status: MembershipPlanStatus.PASSIVE as MembershipPlanStatus,
    branchId: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    number | undefined
  >(undefined);
  const [fetchingCompanies, setFetchingCompanies] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);

  const fetchCompanies = useCallback(async () => {
    if (!isSuperAdmin) return;

    setFetchingCompanies(true);
    try {
      const result = await companyService.getAllFlat({ getAll: true });
      setCompanies((result as Company[]) || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError(t('common.error.failedToFetchCompanies'));
      setOpenErrorSnackbar(true);
    } finally {
      setFetchingCompanies(false);
    }
  }, [isSuperAdmin, t]);

  // Fetch branches based on user role
  const fetchBranches = useCallback(
    async (companyId?: number) => {
      setFetchingBranches(true);
      try {
        let companyIdParam = companyId;

        if (!companyId && isCompanyAdmin) {
          const userCompanyId = company?.id;
          if (userCompanyId) {
            companyIdParam = userCompanyId;
          }
        }

        if (!companyIdParam) {
          setBranches([]);
          return;
        }

        const result = await branchService.getAllFlat({
          companyId: companyIdParam,
          getAll: true
        } as any);
        setBranches((result as Branch[]) || []);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setError(t('common.error.failedToFetchBranches'));
        setOpenErrorSnackbar(true);
      } finally {
        setFetchingBranches(false);
      }
    },
    [isCompanyAdmin, company?.id, t]
  );

  // Handle company selection change
  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setFormData((prev) => ({ ...prev, branchId: 0 }));
    setBranches([]);
    fetchBranches(companyId);
  };

  useEffect(() => {
    if (open) {
      if (isSuperAdmin) {
        fetchCompanies();
      } else if (isCompanyAdmin) {
        fetchBranches();
      }

      if (mode === 'create') {
        let initialBranchId = branchId || 0;

        if (isBranchAdmin) {
          const userBranchId = currentBranch?.id;
          if (userBranchId) {
            initialBranchId = userBranchId;
          }
        }

        setFormData({
          name: '',
          durationDays: 30,
          validityDays: 45,
          price: 0,
          status: MembershipPlanStatus.PASSIVE,
          branchId: initialBranchId
        });
        setSelectedCompanyId(undefined);
      } else if (plan) {
        setFormData({
          name: plan.name,
          durationDays: plan.durationDays,
          validityDays: plan.validityDays,
          price: plan.price,
          status: plan.status,
          branchId: plan.branchId
        });

        // For edit mode, if user is super admin and plan has branch,
        // we need to set the company and fetch its branches
        if (isSuperAdmin && plan.branchId && plan.branch?.company?.id) {
          setSelectedCompanyId(plan.branch.company.id);
          fetchBranches(plan.branch.company.id);
        }
      }
      setError(null);
      setValidationErrors({});
    }
  }, [
    open,
    mode,
    plan,
    branchId,
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    fetchCompanies,
    fetchBranches,
    currentBranch?.id
  ]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t('membership.plan.validation.name.required');
    }

    if (formData.durationDays <= 0) {
      errors.durationDays = t(
        'membership.plan.validation.duration.greater.than.zero'
      );
    }

    if (formData.validityDays <= 0) {
      errors.validityDays = t(
        'membership.plan.validation.validity.greater.than.zero'
      );
    }

    if (formData.validityDays < formData.durationDays) {
      errors.validityDays = t(
        'membership.plan.validation.validity.greater.than.duration'
      );
    }

    if (formData.price < 0) {
      errors.price = t('membership.plan.validation.price.not.negative');
    }

    if (!formData.branchId) {
      errors.branchId = t('membership.plan.validation.branch.required');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (mode === 'create') {
        await membershipPlanService.create(formData as any);
      } else if (mode === 'edit' && plan) {
        await membershipPlanService.update(plan.id, formData as any);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      setOpenErrorSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const isReadOnly = mode === 'view';
  const title =
    mode === 'create'
      ? t('membership.plan.add.new.dialog')
      : mode === 'edit'
        ? t('membership.plan.edit.dialog')
        : t('membership.plan.view.dialog');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Company selection for super admin - only in create mode */}
          {isSuperAdmin && mode === 'create' && (
            <Grid item xs={12}>
              <FormControl fullWidth error={!!validationErrors.companyId}>
                <InputLabel id="company-select-label">
                  {t('company')}
                </InputLabel>
                <Select
                  labelId="company-select-label"
                  value={selectedCompanyId || ''}
                  onChange={(e) => handleCompanyChange(Number(e.target.value))}
                  disabled={isReadOnly || fetchingCompanies}
                >
                  {fetchingCompanies ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      {t('common.loading')}
                    </MenuItem>
                  ) : (
                    companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Branch selection for super admin and company admin - only in create mode */}
          {(isSuperAdmin || isCompanyAdmin) &&
            mode === 'create' &&
            isAdminView && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!validationErrors.branchId}>
                  <InputLabel id="branch-select-label">
                    {t('branch')}
                  </InputLabel>
                  <Select
                    labelId="branch-select-label"
                    value={formData.branchId || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        branchId: Number(e.target.value)
                      }))
                    }
                    disabled={
                      isReadOnly ||
                      fetchingBranches ||
                      (isSuperAdmin && !selectedCompanyId)
                    }
                  >
                    {fetchingBranches ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        {t('common.loading')}
                      </MenuItem>
                    ) : (
                      branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {validationErrors.branchId && (
                    <Typography
                      color="error"
                      variant="caption"
                      sx={{ mt: 0.5 }}
                    >
                      {validationErrors.branchId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}

          {isBranchAdmin && mode === 'create' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('branch')}
                value={currentBranch?.name || t('current.branch')}
                disabled
                variant="outlined"
              />
            </Grid>
          )}

          {(mode === 'edit' || mode === 'view') && plan?.branch && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('branch')}
                value={`${plan.branch.name}${plan.branch.company ? ` (${plan.branch.company.name})` : ''}`}
                disabled
                variant="outlined"
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('membership.plan.name')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              disabled={isReadOnly}
              placeholder={t('membership.plan.name.placeholder')}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('membership.plan.duration.days')}
              type="number"
              value={formData.durationDays}
              onChange={(e) =>
                handleInputChange('durationDays', parseInt(e.target.value) || 0)
              }
              error={!!validationErrors.durationDays}
              helperText={
                validationErrors.durationDays ||
                t('membership.plan.duration.helper')
              }
              disabled={isReadOnly}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('membership.plan.validity.days')}
              type="number"
              value={formData.validityDays}
              onChange={(e) =>
                handleInputChange('validityDays', parseInt(e.target.value) || 0)
              }
              error={!!validationErrors.validityDays}
              helperText={
                validationErrors.validityDays ||
                t('membership.plan.validity.helper')
              }
              disabled={isReadOnly}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('price')}
              type="number"
              value={formData.price}
              onChange={(e) =>
                handleInputChange('price', parseFloat(e.target.value) || 0)
              }
              error={!!validationErrors.price}
              helperText={validationErrors.price}
              disabled={isReadOnly}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                endAdornment: (
                  <Typography variant="body2" color="textSecondary">
                    ₺
                  </Typography>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label={t('status')}
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={isReadOnly}
            >
              <MenuItem value="ACTIVE">{t('active')}</MenuItem>
              <MenuItem value="PASSIVE">{t('passive')}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                mt: 1
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                {t('membership.plan.example')}:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('membership.plan.example.customer.will.have')}{' '}
                <strong>
                  {formData.durationDays} {t('days')}
                </strong>{' '}
                {t('membership.plan.example.usage.rights')}
                {t('membership.plan.example.must.use.within')}{' '}
                <strong>
                  {formData.validityDays} {t('days')}
                </strong>{' '}
                {t('membership.plan.example.from.purchase')}.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        {!isReadOnly && (
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading
              ? t('common.saving')
              : mode === 'create'
                ? t('create')
                : t('save')}
          </Button>
        )}
      </DialogActions>

      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenErrorSnackbar(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default MembershipPlanDialog;
