import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SmsPackage } from '@/types/Licensing.interface';
import { formatCurrency } from '@/utils/formatters';
import { branchService } from '@/data/branchService';
import { purchaseSmsPackage } from '@/data/smsPackageService';

interface Branch {
  id: number;
  name: string;
  status: string;
}

interface PurchaseSmsPackageDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedPackage: SmsPackage | null;
}

function PurchaseSmsPackageDialog({
  open,
  onClose,
  onSuccess,
  selectedPackage
}: PurchaseSmsPackageDialogProps) {
  const { t } = useTranslation();

  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Fetch active branches
  useEffect(() => {
    const fetchBranches = async () => {
      setBranchesLoading(true);
      try {
        const result = await branchService.getAllFlat({
          getAll: true,
          status: 'active'
        });
        const branchList = result || [];
        // Filter only active branches
        const activeBranches = branchList.filter(
          (b: Branch) => b.status !== 'DELETED'
        );
        setBranches(activeBranches);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError(t('branch.fetch.error'));
      } finally {
        setBranchesLoading(false);
      }
    };

    if (open) {
      fetchBranches();
    }
  }, [open, t]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedBranchId('');
      setNotes('');
      setError(undefined);
      setLoading(false);
    }
  }, [open]);

  const handleBranchChange = (event: SelectChangeEvent<number | ''>) => {
    setSelectedBranchId(event.target.value as number | '');
  };

  const handleSubmit = async () => {
    if (loading || !selectedPackage || !selectedBranchId) return;

    try {
      setLoading(true);
      setError(undefined);

      // Call purchase service
      await purchaseSmsPackage({
        branchId: selectedBranchId as number,
        packageId: selectedPackage.id,
        notes: notes.trim() || undefined
      });

      // Call onSuccess callback passed from parent
      onSuccess();

      // Close dialog
      onClose();
    } catch (err: any) {
      console.error('Error assigning SMS package:', err);
      setError(err.response?.data?.message || t('sms.package.assign.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const isValid = selectedBranchId !== '' && selectedPackage !== null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('assign.sms.package')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Package Info Display */}
          {selectedPackage && (
            <Box
              sx={{
                bgcolor: 'background.default',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                {t('package.info')}
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {selectedPackage.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('sms.amount')}: {selectedPackage.amount.toLocaleString()} SMS
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {formatCurrency(Number(selectedPackage.price))}
              </Typography>
            </Box>
          )}

          {/* Branch Selector */}
          <FormControl fullWidth required>
            <InputLabel id="branch-select-label">
              {t('assign.to.branch')}
            </InputLabel>
            <Select
              labelId="branch-select-label"
              id="branch-select"
              value={selectedBranchId}
              label={t('assign.to.branch')}
              onChange={handleBranchChange}
              disabled={branchesLoading || loading}
            >
              {branchesLoading ? (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>{t('loading')}...</Typography>
                  </Box>
                </MenuItem>
              ) : branches.length === 0 ? (
                <MenuItem disabled>
                  <Typography color="text.secondary">
                    {t('no.branches.available')}
                  </Typography>
                </MenuItem>
              ) : (
                branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Notes Field */}
          <TextField
            label={t('notes.optional')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder={t('notes.placeholder')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {t('assign')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PurchaseSmsPackageDialog;
