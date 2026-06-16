import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import { SmsPackage } from '@/types/Licensing.interface';

interface SmsPackageDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: number;
    price: number;
    description?: string;
    isActive: boolean;
    sortOrder: number;
  }) => Promise<void>;
  editingPackage: SmsPackage | null;
  error?: string;
}

function SmsPackageDialog({
  open,
  onClose,
  onSave,
  editingPackage,
  error
}: SmsPackageDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!editingPackage;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingPackage) {
      setName(editingPackage.name);
      setAmount(editingPackage.amount);
      setPrice(Number(editingPackage.price));
      setDescription(editingPackage.description || '');
      setIsActive(editingPackage.isActive);
      setSortOrder(editingPackage.sortOrder);
    } else {
      setName('');
      setAmount(0);
      setPrice(0);
      setDescription('');
      setIsActive(true);
      setSortOrder(1);
    }
    setLoading(false);
  }, [editingPackage, open]);

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    await onSave({
      name,
      amount,
      price,
      description: description || undefined,
      isActive,
      sortOrder
    });
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const isValid =
    name.trim() !== '' && amount > 0 && price > 0 && sortOrder >= 1;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t('sms.package.edit') : t('sms.package.create')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label={t('sms.package.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            variant="outlined"
          />

          <NumericInput
            label={t('sms.package.amount')}
            value={amount}
            onChange={(val) => setAmount(val)}
            min={1}
            max={999999}
            allowDecimals={false}
          />

          <NumericInput
            label={t('sms.package.price')}
            value={price}
            onChange={(val) => setPrice(val)}
            min={0}
            max={9999999}
            allowDecimals={true}
          />

          <TextField
            label={t('sms.package.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
          />

          <NumericInput
            label={t('sms.package.sortOrder')}
            value={sortOrder}
            onChange={(val) => setSortOrder(val)}
            min={1}
            max={9999}
            allowDecimals={false}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label={t('active')}
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
          {isEdit ? t('update') : t('create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SmsPackageDialog;
