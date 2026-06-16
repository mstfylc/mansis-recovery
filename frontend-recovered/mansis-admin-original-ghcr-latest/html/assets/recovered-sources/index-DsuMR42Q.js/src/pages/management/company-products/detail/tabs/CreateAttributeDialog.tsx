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
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import { CreateAttributeFormData } from './types/AttributeDialogTypes';

interface CreateAttributeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formData: CreateAttributeFormData) => Promise<void>;
  onSaveAndAddAnother?: (formData: CreateAttributeFormData) => Promise<void>;
  errorMessage?: string | null;
  onErrorDismiss?: () => void;
}

const CreateAttributeDialog: React.FC<CreateAttributeDialogProps> = ({
  open,
  onClose,
  onSave,
  onSaveAndAddAnother,
  errorMessage,
  onErrorDismiss
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateAttributeFormData>({
    groupName: '',
    optionName: '',
    extraPrice: 0,
    isDefault: false,
    isRequired: false,
    sortOrder: 1
  });

  const handleFormChange = (
    field: keyof CreateAttributeFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      groupName: '',
      optionName: '',
      extraPrice: 0,
      isDefault: false,
      isRequired: false,
      sortOrder: 1
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating attribute:', error);
    }
  };

  const handleSaveAndAddAnother = async () => {
    if (!onSaveAndAddAnother) return;

    try {
      await onSaveAndAddAnother(formData);
      // Reset form but keep group name for better UX
      const currentGroupName = formData.groupName;
      setFormData({
        groupName: currentGroupName,
        optionName: '',
        extraPrice: 0,
        isDefault: false,
        isRequired: formData.isRequired,
        sortOrder: 1
      });
    } catch (error) {
      console.error('Error creating attribute:', error);
    }
  };

  const isFormValid =
    formData.groupName.trim() !== '' && formData.optionName.trim() !== '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('create.new.attribute')}</DialogTitle>
      <DialogContent>
        {errorMessage && (
          <Alert
            severity="error"
            onClose={onErrorDismiss}
            sx={{ mb: 2, mt: 1 }}
          >
            {errorMessage}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: errorMessage ? 0 : 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('new.group.name')}
              value={formData.groupName}
              onChange={(e) => handleFormChange('groupName', e.target.value)}
              placeholder={t('example.size.temperature')}
              autoFocus
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('option.name')}
              value={formData.optionName}
              onChange={(e) => handleFormChange('optionName', e.target.value)}
              placeholder={t('example.small.medium.large')}
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

          <Grid item xs={6}>
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

          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired}
                  onChange={(e) =>
                    handleFormChange('isRequired', e.target.checked)
                  }
                />
              }
              label={t('required.group')}
            />
            <Typography
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5, ml: 4 }}
            >
              {t('required.group.helper')}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={handleClose}>{t('cancel')}</Button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onSaveAndAddAnother && (
            <Button
              onClick={handleSaveAndAddAnother}
              variant="outlined"
              disabled={!isFormValid}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('create.and.add.another')}
            </Button>
          )}

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!isFormValid}
          >
            {t('create')}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAttributeDialog;
