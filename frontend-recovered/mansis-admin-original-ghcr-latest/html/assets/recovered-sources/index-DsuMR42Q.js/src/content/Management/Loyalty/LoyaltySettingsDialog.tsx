import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import {
  LoyaltySettingsDialogProps,
  UpdateCompanyLoyaltySettingsDto
} from '@/types/Loyalty.interface';

const LoyaltySettingsDialog: React.FC<LoyaltySettingsDialogProps> = ({
  open,
  onClose,
  onSave,
  item,
  saving = false
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<UpdateCompanyLoyaltySettingsDto>({
    isLoyaltyEnabled: false,
    dailyLoginPointsEnabled: false,
    dailyLoginPoints: 10,
    purchasePointsEnabled: false,
    purchasePointsPerUnit: 1
  });

  useEffect(() => {
    if (item) {
      setFormData({
        isLoyaltyEnabled: item.isLoyaltyEnabled,
        dailyLoginPointsEnabled: item.dailyLoginPointsEnabled,
        dailyLoginPoints: item.dailyLoginPoints || 10,
        purchasePointsEnabled: item.purchasePointsEnabled,
        purchasePointsPerUnit: item.purchasePointsPerUnit || 1
      });
    }
  }, [item]);

  const handleSave = () => {
    if (!item) return;
    onSave(item.companyId, formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">{t('loyalty.settings.edit')}</Typography>
          {item && (
            <Chip
              label={item.company.name}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          {/* Loyalty Enable/Disable */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.isLoyaltyEnabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isLoyaltyEnabled: e.target.checked
                  }))
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {t('loyalty.settings.enable')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('loyalty.settings.enable.description')}
                </Typography>
              </Box>
            }
          />

          <Divider />

          {/* Daily Login Points */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('loyalty.settings.daily.login.enable')}
            </Typography>
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Box display="flex" alignItems="center" sx={{ pt: 1.5 }}>
                <Switch
                  checked={formData.dailyLoginPointsEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dailyLoginPointsEnabled: e.target.checked
                    }))
                  }
                  disabled={!formData.isLoyaltyEnabled}
                  color="primary"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <NumericInput
                  fullWidth
                  label={t('loyalty.settings.daily.login.points')}
                  value={formData.dailyLoginPoints || 0}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      dailyLoginPoints: value
                    }))
                  }
                  disabled={
                    !formData.isLoyaltyEnabled ||
                    !formData.dailyLoginPointsEnabled
                  }
                  allowDecimals={false}
                  allowNegative={false}
                  min={1}
                  max={1000}
                />
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Purchase Points */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('loyalty.settings.purchase.enable')}
            </Typography>
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Box display="flex" alignItems="center" sx={{ pt: 1.5 }}>
                <Switch
                  checked={formData.purchasePointsEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchasePointsEnabled: e.target.checked
                    }))
                  }
                  disabled={!formData.isLoyaltyEnabled}
                  color="primary"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <NumericInput
                  fullWidth
                  label={t('loyalty.settings.purchase.points.per.unit')}
                  value={formData.purchasePointsPerUnit || 0}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchasePointsPerUnit: value
                    }))
                  }
                  disabled={
                    !formData.isLoyaltyEnabled ||
                    !formData.purchasePointsEnabled
                  }
                  allowDecimals={false}
                  allowNegative={false}
                  min={1}
                  max={100}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoyaltySettingsDialog;
