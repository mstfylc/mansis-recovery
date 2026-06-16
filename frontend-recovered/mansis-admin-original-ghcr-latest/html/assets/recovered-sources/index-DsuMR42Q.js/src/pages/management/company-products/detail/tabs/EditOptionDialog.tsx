import React, { useState, useEffect } from 'react';
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
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import { ProductAttributeOption } from '@/types/ProductAttribute.interface';
import { EditOptionFormData } from './types/AttributeDialogTypes';

interface EditOptionDialogProps {
  open: boolean;
  option: ProductAttributeOption | null;
  onClose: () => void;
  onSave: (optionId: number, formData: EditOptionFormData) => Promise<void>;
}

const EditOptionDialog: React.FC<EditOptionDialogProps> = ({
  open,
  option,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<EditOptionFormData>({
    optionName: '',
    extraPrice: 0,
    isDefault: false,
    sortOrder: 1
  });

  // Populate form when option changes
  useEffect(() => {
    if (option) {
      setFormData({
        optionName: option.name,
        extraPrice: option.extraPrice,
        isDefault: option.isDefault,
        sortOrder: option.sortOrder
      });
    }
  }, [option]);

  const handleFormChange = (
    field: keyof EditOptionFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    if (option) {
      setFormData({
        optionName: option.name,
        extraPrice: option.extraPrice,
        isDefault: option.isDefault,
        sortOrder: option.sortOrder
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!option) return;

    try {
      await onSave(option.id, formData);
      handleClose();
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const isFormValid = formData.optionName.trim() !== '';

  if (!option) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('edit.option')}</DialogTitle>
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
          {t('update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditOptionDialog;
