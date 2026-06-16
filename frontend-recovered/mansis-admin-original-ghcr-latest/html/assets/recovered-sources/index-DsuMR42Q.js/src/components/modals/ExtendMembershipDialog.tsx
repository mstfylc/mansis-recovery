import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Membership } from '@/types/Membership.interface';
import { MembershipPlan } from '@/types/MembershipPlan.interface';
import MembershipPlanAutocomplete from '../MembershipPlanAutocomplete';
import { useTranslation } from 'react-i18next';
import { PurchaseType } from '@/enums/purchase-type';
import { PurchaseTypeLabels } from '@/enums/purchase-type-labels';
import { membershipService } from '@/data/membershipService';

const ADMIN_MEMBERSHIP_PURCHASE_TYPES = [
  PurchaseType.CASH,
  PurchaseType.PHYSICAL_CARD
] as const;

interface ExtendMembershipDialogProps {
  open: boolean;
  onClose: () => void;
  membership: Membership | null;
  onSuccess: () => void;
}

const ExtendMembershipDialog = ({
  open,
  onClose,
  membership,
  onSuccess
}: ExtendMembershipDialogProps) => {
  const [selectedMembershipPlan, setSelectedMembershipPlan] =
    useState<MembershipPlan | null>(null);
  const [selectedPurchaseType, setSelectedPurchaseType] =
    useState<PurchaseType>(PurchaseType.CASH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      setSelectedMembershipPlan(null);
      setSelectedPurchaseType(PurchaseType.CASH);
      setError(undefined);
    }
  }, [open]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleExtend = async () => {
    if (!membership || !selectedMembershipPlan) return;

    const branchId = membership.branch?.id ?? membership.branchId;
    const userId = membership.user?.id ?? membership.userId;
    if (!branchId || !userId) {
      setError(t('membership.extend.error'));
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const result = await membershipService.extend({
        customerUserId: userId,
        branchId,
        membershipPlanId: selectedMembershipPlan.id,
        purchaseType: selectedPurchaseType
      });

      if (result?.status === 200) {
        onSuccess();
        handleClose();
      } else {
        setError(result?.message || t('membership.extend.error'));
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(message || t('membership.extend.error'));
    } finally {
      setLoading(false);
    }
  };

  const customerName = membership?.user
    ? `${membership.user.name} ${membership.user.surname}`
    : '-';

  const branchId = membership?.branch?.id ?? membership?.branchId;

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {t('membership.extend.dialog.title', { name: customerName })}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError(undefined)}
          >
            {error}
          </Alert>
        )}

        <FormControl fullWidth margin="dense" required sx={{ mt: 1 }}>
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

        <MembershipPlanAutocomplete
          value={selectedMembershipPlan}
          onChange={setSelectedMembershipPlan}
          branchId={branchId}
          required
          helperText={t('membership.plan.selection.helper')}
          sx={{ mt: 2 }}
        />

        {selectedMembershipPlan && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('membership.plan.price')}: {selectedMembershipPlan.price} TL
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleExtend}
          color="primary"
          variant="contained"
          disabled={!selectedMembershipPlan || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('saving') : t('membership.extend')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtendMembershipDialog;
