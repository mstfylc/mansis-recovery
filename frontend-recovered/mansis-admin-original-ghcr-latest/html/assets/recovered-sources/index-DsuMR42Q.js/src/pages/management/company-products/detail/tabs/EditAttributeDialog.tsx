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
  Typography,
  Box,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ProductAttribute } from '@/types/ProductAttribute.interface';
import { EditAttributeFormData } from './types/AttributeDialogTypes';

interface EditAttributeDialogProps {
  open: boolean;
  attribute: ProductAttribute | null;
  onClose: () => void;
  onSave: (formData: EditAttributeFormData) => Promise<void>;
  errorMessage?: string | null;
  onErrorDismiss?: () => void;
}

const EditAttributeDialog: React.FC<EditAttributeDialogProps> = ({
  open,
  attribute,
  onClose,
  onSave,
  errorMessage,
  onErrorDismiss
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<EditAttributeFormData>({
    attributeName: '',
    isRequired: false,
    sortOrder: 0
  });

  // Populate form when attribute changes
  useEffect(() => {
    if (attribute) {
      setFormData({
        attributeName: attribute.name,
        isRequired: attribute.isRequired,
        sortOrder: attribute.sortOrder
      });
    }
  }, [attribute]);

  const handleFormChange = (
    field: keyof EditAttributeFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    if (attribute) {
      setFormData({
        attributeName: attribute.name,
        isRequired: attribute.isRequired,
        sortOrder: attribute.sortOrder
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!attribute) return;

    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error updating attribute:', error);
    }
  };

  const isFormValid = formData.attributeName.trim() !== '';

  if (!attribute) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('edit.attribute')}</DialogTitle>
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
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('edit.attribute.with.options', {
                  count: attribute.options.length
                })}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('attribute.name')}
              value={formData.attributeName}
              onChange={(e) =>
                handleFormChange('attributeName', e.target.value)
              }
              placeholder={t('example.size.temperature')}
              autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label={t('sort.order')}
              value={formData.sortOrder}
              onChange={(e) =>
                handleFormChange('sortOrder', parseInt(e.target.value) || 0)
              }
              placeholder="0"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired}
                  onChange={(e) =>
                    handleFormChange('isRequired', e.target.checked)
                  }
                />
              }
              label={t('required.attribute')}
            />
            <Typography
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5, ml: 4 }}
            >
              {t('required.attribute.helper')}
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

export default EditAttributeDialog;
