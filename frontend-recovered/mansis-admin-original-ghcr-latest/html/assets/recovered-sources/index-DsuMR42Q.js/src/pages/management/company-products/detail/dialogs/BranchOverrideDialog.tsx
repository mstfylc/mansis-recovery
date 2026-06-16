import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert,
  Divider,
  InputAdornment,
  Chip,
  FormHelperText,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { companyProductService } from '@/data/companyProductService';
import { branchService } from '@/data/branchService';
import { useUserViewMode } from '@/hooks/useUserViewMode';

interface BranchOverride {
  id: number;
  branchId: number;
  name?: string;
  description?: string;
  price?: number;
  status?: 'ACTIVE' | 'PASSIVE' | 'PENDING';
  categoryId?: number;
  isStockTracked?: boolean;
  trackExpiry?: boolean;
  allowNegativeStock?: boolean;
  branch: {
    id: number;
    name: string;
    mapcode?: string;
  };
  file?: {
    url: string;
  };
}

interface Branch {
  id: number;
  name: string;
  mapcode?: string;
  status: string;
}

interface BranchOverrideDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  product: CompanyProduct;
  override?: BranchOverride | null;
  existingOverrides: BranchOverride[];
}

const BranchOverrideDialog: React.FC<BranchOverrideDialogProps> = ({
  open,
  onClose,
  onSave,
  product,
  override,
  existingOverrides
}) => {
  const { t } = useTranslation();
  const { currentBranch, isBranchAdmin, isAdminView } = useUserViewMode();
  const isEdit = !!override;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const currentBranchId = currentBranch?.id;

  const hasBranchContext = currentBranchId && (isBranchAdmin || !isAdminView);
  const [formData, setFormData] = useState({
    branchId: override?.branchId || (hasBranchContext ? currentBranchId : ''),
    name: override?.name || product.name,
    description: override?.description || product.description,
    price: override?.price?.toString() || product.basePrice.toString(),
    status: override?.status || product.status,
    isStockTracked: override?.isStockTracked ?? product.isStockTracked ?? false,
    trackExpiry: override?.trackExpiry ?? product.trackExpiry ?? false,
    allowNegativeStock:
      override?.allowNegativeStock ?? product.allowNegativeStock ?? false
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchBranches = React.useCallback(async () => {
    try {
      setBranchesLoading(true);

      if (isBranchAdmin && currentBranchId) {
        const branch = await branchService.getById(currentBranchId);
        setBranches([branch]);
      } else {
        const result = await branchService.getAllFlat({
          companyId: product.companyId,
          status: 'ACTIVE',
          getAll: true
        });
        setBranches(result || []);
      }
    } catch (err: any) {
      console.error('Error fetching branches:', err);
      setError(
        err.response?.data?.message || t('error.failed.to.load.branches')
      );
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }, [isBranchAdmin, currentBranchId, product.companyId, t]);

  useEffect(() => {
    if (open && !isEdit && !isBranchAdmin) {
      fetchBranches();
    } else if (!open) {
      setBranches([]);
      setError(null);
    }
  }, [open, isEdit, isBranchAdmin, fetchBranches]);

  useEffect(() => {
    if (override) {
      setFormData({
        branchId: override.branchId,
        name: override.name || product.name,
        description: override.description || product.description,
        price: override.price?.toString() || product.basePrice.toString(),
        status: override.status || product.status,
        isStockTracked:
          override.isStockTracked ?? product.isStockTracked ?? false,
        trackExpiry: override.trackExpiry ?? product.trackExpiry ?? false,
        allowNegativeStock:
          override.allowNegativeStock ?? product.allowNegativeStock ?? false
      });
    } else {
      setFormData({
        branchId: hasBranchContext ? currentBranchId : '',
        name: product.name,
        description: product.description,
        price: product.basePrice.toString(),
        status: product.status,
        isStockTracked: product.isStockTracked ?? false,
        trackExpiry: product.trackExpiry ?? false,
        allowNegativeStock: product.allowNegativeStock ?? false
      });
    }
    setImageFile(null);
    setError(null);
  }, [override, product, open, isBranchAdmin, isAdminView, currentBranchId]);

  const availableBranches = Array.isArray(branches)
    ? branches.filter(
        (branch) =>
          !existingOverrides.some((override) => override.branchId === branch.id)
      )
    : [];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value
      };

      if (field === 'isStockTracked' && !value) {
        newData.trackExpiry = false;
      }

      return newData;
    });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const submitData = new FormData();

      if (!isEdit) {
        submitData.append('companyProductId', product.id.toString());
        submitData.append('branchId', formData.branchId.toString());
      }

      if (formData.name.trim()) {
        submitData.append('name', formData.name);
      }

      if (formData.description.trim()) {
        submitData.append('description', formData.description);
      }

      if (formData.price) {
        submitData.append('price', formData.price);
      }

      const compareStatus =
        isEdit && override?.status ? override.status : product.status;
      if (formData.status !== compareStatus) {
        submitData.append('status', formData.status);
      }

      submitData.append('isStockTracked', formData.isStockTracked.toString());
      submitData.append('trackExpiry', formData.trackExpiry.toString());
      submitData.append(
        'allowNegativeStock',
        formData.allowNegativeStock.toString()
      );

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (isEdit) {
        await companyProductService.updateBranchOverride(
          override!.id,
          submitData
        );
      } else {
        await companyProductService.createBranchOverride(submitData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving branch override:', err);
      setError(
        err.response?.data?.message || t('error.failed.to.save.override')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Validation logic
  const isFormValid = () => {
    // For new overrides, branch selection is required
    if (!isEdit && !formData.branchId) {
      return false;
    }

    // Always valid - backend will handle what to save
    return true;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <StoreIcon />
          {isEdit ? t('edit.branch.override') : t('create.branch.override')}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {!isEdit && !isBranchAdmin && isAdminView && (
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>{t('branch')}</InputLabel>
                <Select
                  value={formData.branchId}
                  onChange={(e) =>
                    handleInputChange('branchId', e.target.value)
                  }
                  label={t('branch')}
                  disabled={branchesLoading}
                >
                  {branchesLoading ? (
                    <MenuItem disabled>{t('loading.branches')}</MenuItem>
                  ) : availableBranches.length > 0 ? (
                    availableBranches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        <Box>
                          <Typography variant="body2">{branch.name}</Typography>
                          {branch.mapcode && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {branch.mapcode}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>{t('no.available.branches')}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider>
              <Chip label={t('override.settings')} />
            </Divider>
          </Grid>

          {/* Custom Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('name')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={product.name}
              helperText={`${t('default')}: ${product.name}`}
            />
          </Grid>

          {/* Custom Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('description')}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={2}
              placeholder={product.description}
              helperText={`${t('default')}: ${product.description}`}
            />
          </Grid>

          {/* Custom Price */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('price')}
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              placeholder={product.basePrice.toString()}
              helperText={`${t('default')}: ₺${product.basePrice.toFixed(2)}`}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₺</InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Custom Status */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>{t('status')}</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label={t('status')}
              >
                <MenuItem value="ACTIVE">{t('product.status.active')}</MenuItem>
                <MenuItem value="PASSIVE">
                  {t('product.status.passive')}
                </MenuItem>
                <MenuItem value="PENDING">
                  {t('product.status.pending')}
                </MenuItem>
              </Select>
              <FormHelperText>
                {`${t('default')}: ${t(`product.status.${product.status.toLowerCase()}`)}`}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default'
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isStockTracked}
                    onChange={(e) =>
                      handleInputChange('isStockTracked', e.target.checked)
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2">
                      {t('stock.tracking.enabled')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('stock.tracking.enabled.description')}
                    </Typography>
                  </Box>
                }
              />
              <FormHelperText>
                {`${t('default')}: ${(product.isStockTracked ?? false) ? t('enabled') : t('disabled')}`}
              </FormHelperText>
            </Box>
          </Grid>

          {formData.isStockTracked && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.default'
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.trackExpiry}
                      onChange={(e) =>
                        handleInputChange('trackExpiry', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2">
                        {t('product.enable.batch.tracking')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('product.enable.batch.tracking.help')}
                      </Typography>
                    </Box>
                  }
                />
                <FormHelperText>
                  {`${t('default')}: ${(product.trackExpiry ?? false) ? t('enabled') : t('disabled')}`}
                </FormHelperText>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default'
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowNegativeStock}
                    onChange={(e) =>
                      handleInputChange('allowNegativeStock', e.target.checked)
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2">
                      {t('stock.allow.negative')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('stock.allow.negative.description')}
                    </Typography>
                  </Box>
                }
              />
              <FormHelperText>
                {`${t('default')}: ${(product.allowNegativeStock ?? false) ? t('enabled') : t('disabled')}`}
              </FormHelperText>
            </Box>
          </Grid>

          {/* Custom Image */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {t('custom.image')} ({t('optional')})
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              {imageFile ? imageFile.name : t('upload.custom.image')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            <Typography color="text.secondary">
              {t('custom.image.help')}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || branchesLoading || !isFormValid()}
          variant="contained"
          startIcon={<SaveIcon />}
        >
          {loading ? t('saving') : isEdit ? t('update') : t('create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BranchOverrideDialog;
