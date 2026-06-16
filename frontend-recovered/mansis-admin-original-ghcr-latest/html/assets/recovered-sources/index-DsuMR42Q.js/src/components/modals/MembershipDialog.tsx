import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Branch } from '@/types/Branch.interface';
import { Membership } from '@/types/Membership.interface';
import { MembershipPlan } from '@/types/MembershipPlan.interface';
import { User } from '@/types/User.interface';
import StyledDatePicker from '../date&time/StyledDatePicker';
import UserAutocomplete from '../UserAutocomplete';
import MembershipPlanAutocomplete from '../MembershipPlanAutocomplete';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Role } from '@/enums/role';
import { PurchaseType } from '@/enums/purchase-type';
import { PurchaseTypeLabels } from '@/enums/purchase-type-labels';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { Company } from '@/types/Company.interface';

const ADMIN_MEMBERSHIP_PURCHASE_TYPES = [
  PurchaseType.CASH,
  PurchaseType.PHYSICAL_CARD
] as const;

type MembershipDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  membership?: Membership | null;
  onSave: (membership: {
    startDate: Date;
    endDate: Date;
    userId?: number;
    branchId?: number;
    membershipPlanId?: number;
    remainingDayCount?: number;
    purchaseType?: PurchaseType;
  }) => Promise<void>;
};

const MembershipDialog = ({
  open,
  onClose,
  onSave,
  error,
  membership
}: MembershipDialogProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMembershipPlan, setSelectedMembershipPlan] =
    useState<MembershipPlan | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    number | undefined
  >(undefined);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [remainingDayCount, setRemainingDayCount] = useState<number | ''>('');
  const [selectedPurchaseType, setSelectedPurchaseType] =
    useState<PurchaseType>(PurchaseType.CASH);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fetchingCompanies, setFetchingCompanies] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);

  const isEditMode = !!membership;
  const { t } = useTranslation();
  const {
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    isAdminView,
    company,
    currentBranch
  } = useUserViewMode();

  // Effect 1: Form initialization/reset - only when dialog opens or membership changes
  useEffect(() => {
    if (!open) return;

    if (membership) {
      setStartDate(membership.startDate);
      setEndDate(membership.endDate || new Date());
      setRemainingDayCount(membership.remainingDayCount || '');

      if (membership.user) {
        setSelectedUser(membership.user);
      }

      if (membership.branch) {
        setSelectedBranchId(membership.branch.id);
        if (membership.branch.company) {
          setSelectedCompanyId(membership.branch.company.id);
          if (isSuperAdmin) {
            fetchBranches(membership.branch.company.id);
          }
        }
        // Note: Membership plans will be fetched by MembershipPlanAutocomplete component
      }

      // Set membership plan if available
      if (membership.membershipPlan) {
        setSelectedMembershipPlan(membership.membershipPlan);
      }
    } else {
      resetForm();
    }
  }, [open, membership]);

  // Effect 2: Role-based data fetching - does NOT reset the form
  useEffect(() => {
    if (open && !isEditMode) {
      if (isSuperAdmin) {
        fetchCompanies();
      } else if (isCompanyAdmin && company?.id) {
        fetchBranches(company.id);
      } else if (isBranchAdmin && currentBranch?.id) {
        // For branch admin, automatically set the branch ID
        setSelectedBranchId(currentBranch.id);
      }
    }
  }, [
    open,
    isEditMode,
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    company?.id,
    currentBranch?.id
  ]);

  const fetchCompanies = async () => {
    try {
      setFetchingCompanies(true);
      const data = await companyService.getAll({});
      setCompanies(data.items || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setFetchingCompanies(false);
    }
  };

  const fetchBranches = async (companyId: number) => {
    try {
      setFetchingBranches(true);
      const result = await branchService.getAllFlat({ companyId });
      setBranches(result || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setFetchingBranches(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedMembershipPlan(null);
    setSelectedCompanyId(undefined);
    setSelectedBranchId(undefined);
    setStartDate(new Date());
    setEndDate(new Date());
    setRemainingDayCount('');
    setSelectedPurchaseType(PurchaseType.CASH);
    setCompanies([]);
    setBranches([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setSelectedBranchId(undefined); // Reset branch when company changes
    setSelectedMembershipPlan(null); // Reset membership plan when company changes
    // Membership plans will be cleared by MembershipPlanAutocomplete component
    if (companyId) {
      fetchBranches(companyId);
    } else {
      setBranches([]);
    }
  };

  const handleSave = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // For branch admin, use their branch ID
      const finalBranchId = isBranchAdmin
        ? currentBranch?.id
        : selectedBranchId;

      await onSave({
        userId: isEditMode ? undefined : selectedUser?.id,
        branchId: isEditMode ? undefined : finalBranchId,
        membershipPlanId: isEditMode ? undefined : selectedMembershipPlan?.id,
        startDate,
        endDate,
        remainingDayCount:
          remainingDayCount !== '' ? Number(remainingDayCount) : undefined,
        purchaseType: isEditMode ? undefined : selectedPurchaseType
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
    }
  };
  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setEndDate(date);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {isEditMode ? t('edit.membership') : t('new.membership')}
        {isEditMode &&
          membership?.user &&
          ` - ${membership.user.name} ${membership.user.surname}`}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isEditMode && (
          <>
            <UserAutocomplete
              value={selectedUser}
              onChange={setSelectedUser}
              required
              roles={[Role.CUSTOMER]}
              helperText={t('membership.customer.selection.helper')}
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 2 }}>
              {isSuperAdmin && (
                <FormControl fullWidth margin="dense" required>
                  <InputLabel>{t('company')}</InputLabel>
                  <Select
                    value={selectedCompanyId || ''}
                    onChange={(e) =>
                      handleCompanyChange(e.target.value as number)
                    }
                    label={t('company')}
                    disabled={fetchingCompanies}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {(isSuperAdmin || isCompanyAdmin) && isAdminView && (
                <FormControl fullWidth margin="dense" required>
                  <InputLabel>{t('branch')}</InputLabel>
                  <Select
                    value={selectedBranchId || ''}
                    onChange={(e) =>
                      setSelectedBranchId(e.target.value as number)
                    }
                    label={t('branch')}
                    disabled={
                      fetchingBranches || (isSuperAdmin && !selectedCompanyId)
                    }
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Show current branch info for branch admin */}
              {isBranchAdmin && currentBranch && (
                <TextField
                  fullWidth
                  margin="dense"
                  label={t('branch')}
                  value={currentBranch.name}
                  disabled
                  variant="outlined"
                />
              )}
            </Box>

            <FormControl fullWidth margin="dense" required>
              <InputLabel>{t('payment.type')}</InputLabel>
              <Select
                value={selectedPurchaseType}
                onChange={(e) =>
                  setSelectedPurchaseType(e.target.value as PurchaseType)
                }
                label={t('payment.type')}
              >
                {ADMIN_MEMBERSHIP_PURCHASE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(PurchaseTypeLabels[type])}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Membership Plan Selection */}
            <MembershipPlanAutocomplete
              value={selectedMembershipPlan}
              onChange={setSelectedMembershipPlan}
              branchId={isBranchAdmin ? currentBranch?.id : selectedBranchId}
              required
              helperText={t('membership.plan.selection.helper')}
              sx={{ mt: 2 }}
            />
          </>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('membership.date.helper')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: isEditMode ? 2 : 0 }}>
          <StyledDatePicker
            label={t('start.date')}
            selected={startDate}
            onChange={handleStartDateChange}
            required
          />

          <StyledDatePicker
            label={t('end.date')}
            selected={endDate}
            onChange={handleEndDateChange}
            minDate={startDate}
          />
        </Box>

        <TextField
          margin="dense"
          label={t('remaining.days')}
          type="number"
          fullWidth
          value={remainingDayCount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || parseInt(value) >= 0) {
              setRemainingDayCount(value === '' ? '' : parseInt(value));
            }
          }}
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ mt: 2 }}
          required
          helperText={t('membership.remaining.days.helper')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          disabled={
            (isEditMode
              ? false
              : !selectedUser ||
                (!isBranchAdmin && !selectedBranchId) ||
                !selectedMembershipPlan ||
                !remainingDayCount) || loading
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MembershipDialog;
