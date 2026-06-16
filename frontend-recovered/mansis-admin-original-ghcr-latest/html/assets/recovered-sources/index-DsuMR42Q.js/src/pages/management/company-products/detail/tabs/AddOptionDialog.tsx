import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Grid,
  InputAdornment,
  Typography,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import { ProductAttribute } from '@/types/ProductAttribute.interface';
import { AddOptionFormData } from './types/AttributeDialogTypes';

interface AddOptionDialogProps {
  open: boolean;
  group: ProductAttribute | null;
  onClose: () => void;
  onSave: (formData: AddOptionFormData) => Promise<void>;
}

const AddOptionDialog: React.FC<AddOptionDialogProps> = ({
  open,
  group,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<AddOptionFormData>({
    optionName: '',
    extraPrice: 0,
    isDefault: false,
    sortOrder: 1
  });

  // Update sort order when group changes
  React.useEffect(() => {
    if (group) {
      setFormData((prev) => ({
        ...prev,
        sortOrder: group.options.length + 1
      }));
    }
  }, [group]);

  const handleFormChange = (
    field: keyof AddOptionFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      optionName: '',
      extraPrice: 0,
      isDefault: false,
      sortOrder: group?.options.length ? group.options.length + 1 : 1
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!group) return;

    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error adding option:', error);
    }
  };

  const isFormValid = formData.optionName.trim() !== '';

  if (!group) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {t('add.option.to.group', { group: group.name })}
          {group.isRequired && (
            <Chip label={t('required')} size="small" color="primary" />
          )}
        </div>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('option.name')}
              value={formData.optionName}
              onChange={(e) => handleFormChange('optionName', e.target.value)}
              placeholder={t('example.small.medium.large')}
              autoFocus
            />
          </Grid>

          <Grid item xs={12}>
            <NumericInput
              fullWidth
              label={t('extra.price')}
              value={formData.extraPrice}
              onChange={(value) => handleFormChange('extraPrice', value)}
              allowDecimals={true}
              decimalPlaces={2}
              min={0}
              helperText={t('extra.price.helper')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₺</InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <NumericInput
              fullWidth
              label={t('sort.order')}
              value={formData.sortOrder}
              onChange={(value) => handleFormChange('sortOrder', value)}
              allowDecimals={false}
              min={1}
              helperText={t('sort.order.helper')}
              emptyPlaceholder="1"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault}
                  onChange={(e) =>
                    handleFormChange('isDefault', e.target.checked)
                  }
                />
              }
              label={t('default.option')}
            />
            <Typography
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5, ml: 4 }}
            >
              {t('default.option.helper')}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={handleClose}>{t('cancel')}</Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isFormValid}
        >
          {t('add.option')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOptionDialog;
