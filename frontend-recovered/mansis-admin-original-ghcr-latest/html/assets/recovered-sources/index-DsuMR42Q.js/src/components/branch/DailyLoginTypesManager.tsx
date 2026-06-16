import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Paper,
  InputAdornment,
  Snackbar,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useTranslation } from 'react-i18next';
import { dailyLoginService } from '@/data/dailyLoginService';
import { voucherService } from '@/data/voucherService';
import {
  BranchDailyLoginType,
  CreateDailyLoginTypeDto,
  UpdateDailyLoginTypeDto
} from '@/types/DailyLoginType.interface';
import { VoucherTemplate } from '@/types/Voucher.interface';
import NumericInput from '@/components/NumericInput';

interface DailyLoginTypesManagerProps {
  branchId: number;
}

const DailyLoginTypesManager = ({ branchId }: DailyLoginTypesManagerProps) => {
  const { t } = useTranslation();

  // State
  const [dailyLoginTypes, setDailyLoginTypes] = useState<
    BranchDailyLoginType[]
  >([]);
  const [voucherTemplates, setVoucherTemplates] = useState<VoucherTemplate[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BranchDailyLoginType | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState<CreateDailyLoginTypeDto>({
    name: '',
    description: '',
    price: 0,
    voucherTemplateId: 0,
    isActive: true,
    sortOrder: 0
  });
  const [selectedVoucherTemplate, setSelectedVoucherTemplate] =
    useState<VoucherTemplate | null>(null);

  // Fetch daily login types
  const fetchDailyLoginTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dailyLoginService.getTypes(branchId, true);
      setDailyLoginTypes(data || []);
    } catch (error) {
      console.error('Error fetching daily login types:', error);
      setNotification({
        open: true,
        message: t('dailyLoginTypes.error.fetch'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, t]);

  // Fetch voucher templates for autocomplete
  const fetchVoucherTemplates = useCallback(async () => {
    try {
      const result = await voucherService.getAll({ branchId, getAll: true });
      const templates = result?.items || [];
      setVoucherTemplates(Array.isArray(templates) ? templates : []);
    } catch (error) {
      console.error('Error fetching voucher templates:', error);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDailyLoginTypes();
    fetchVoucherTemplates();
  }, [fetchDailyLoginTypes, fetchVoucherTemplates]);

  // Handle dialog open for create
  const handleCreateClick = () => {
    setSelectedType(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      voucherTemplateId: 0,
      isActive: true,
      sortOrder: dailyLoginTypes.length
    });
    setSelectedVoucherTemplate(null);
    setDialogOpen(true);
  };

  // Handle dialog open for edit
  const handleEditClick = (type: BranchDailyLoginType) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      price: type.price,
      voucherTemplateId: type.voucherTemplateId,
      isActive: type.isActive,
      sortOrder: type.sortOrder
    });
    const template = voucherTemplates.find(
      (t) => t.id === type.voucherTemplateId
    );
    setSelectedVoucherTemplate(template || null);
    setDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (type: BranchDailyLoginType) => {
    setSelectedType(type);
    setDeleteDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedType(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      voucherTemplateId: 0,
      isActive: true,
      sortOrder: 0
    });
    setSelectedVoucherTemplate(null);
  };

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setNotification({
        open: true,
        message: t('dailyLoginTypes.error.nameRequired'),
        severity: 'error'
      });
      return;
    }

    if (!formData.voucherTemplateId) {
      setNotification({
        open: true,
        message: t('dailyLoginTypes.error.voucherRequired'),
        severity: 'error'
      });
      return;
    }

    if (formData.price < 0) {
      setNotification({
        open: true,
        message: t('dailyLoginTypes.error.invalidPrice'),
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);

      if (selectedType) {
        // Update
        const updateData: UpdateDailyLoginTypeDto = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          voucherTemplateId: formData.voucherTemplateId,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder
        };
        await dailyLoginService.updateType(
          branchId,
          selectedType.id,
          updateData
        );
        setNotification({
          open: true,
          message: t('dailyLoginTypes.success.updated'),
          severity: 'success'
        });
      } else {
        // Create
        await dailyLoginService.createType(branchId, formData);
        setNotification({
          open: true,
          message: t('dailyLoginTypes.success.created'),
          severity: 'success'
        });
      }

      handleDialogClose();
      fetchDailyLoginTypes();
    } catch (error: any) {
      console.error('Error saving daily login type:', error);
      setNotification({
        open: true,
        message:
          error?.response?.data?.message || t('dailyLoginTypes.error.save'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedType) return;

    try {
      setSaving(true);
      await dailyLoginService.deleteType(branchId, selectedType.id);
      setNotification({
        open: true,
        message: t('dailyLoginTypes.success.deleted'),
        severity: 'success'
      });
      setDeleteDialogOpen(false);
      setSelectedType(null);
      fetchDailyLoginTypes();
    } catch (error: any) {
      console.error('Error deleting daily login type:', error);
      setNotification({
        open: true,
        message:
          error?.response?.data?.message || t('dailyLoginTypes.error.delete'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <LocalOfferIcon color="primary" />
          <Typography variant="h5">{t('dailyLoginTypes.title')}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          {t('dailyLoginTypes.add')}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {dailyLoginTypes.length === 0 ? (
        <Alert severity="info">{t('dailyLoginTypes.empty')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {dailyLoginTypes.map((type) => (
            <Grid item xs={12} md={6} lg={4} key={type.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  opacity: type.isActive ? 1 : 0.6,
                  borderColor: type.isActive ? 'primary.main' : 'grey.400'
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6" component="div">
                          {type.name}
                        </Typography>
                        {!type.isActive && (
                          <Chip
                            label={t('inactive')}
                            size="small"
                            color="default"
                          />
                        )}
                      </Box>

                      {type.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          {type.description}
                        </Typography>
                      )}

                      <Typography
                        variant="h5"
                        color="primary"
                        fontWeight="bold"
                        mb={1}
                      >
                        {type.price} TL
                      </Typography>

                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CardGiftcardIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {type.voucherTemplate?.name || t('unknown')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Tooltip title={t('edit')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(type)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(type)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedType
            ? t('dailyLoginTypes.edit')
            : t('dailyLoginTypes.create')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label={t('name')}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <TextField
              fullWidth
              label={t('description')}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={2}
            />

            <NumericInput
              fullWidth
              label={t('price')}
              value={formData.price}
              onChange={(value) =>
                setFormData({ ...formData, price: value || 0 })
              }
              allowDecimals={true}
              allowNegative={false}
              min={0}
              max={100000}
              decimalPlaces={2}
              InputProps={{
                endAdornment: <InputAdornment position="end">TL</InputAdornment>
              }}
            />

            <Autocomplete
              fullWidth
              options={voucherTemplates}
              value={selectedVoucherTemplate}
              onChange={(_, newValue) => {
                setSelectedVoucherTemplate(newValue);
                setFormData({
                  ...formData,
                  voucherTemplateId: newValue?.id || 0
                });
              }}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description || t('noDescription')}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('dailyLoginTypes.voucherTemplate')}
                  required
                  helperText={t('dailyLoginTypes.voucherTemplateHelp')}
                />
              )}
              noOptionsText={t('dailyLoginTypes.noVoucherTemplates')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label={t('active')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('dailyLoginTypes.deleteConfirm.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('dailyLoginTypes.deleteConfirm.message', {
              name: selectedType?.name
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DailyLoginTypesManager;
