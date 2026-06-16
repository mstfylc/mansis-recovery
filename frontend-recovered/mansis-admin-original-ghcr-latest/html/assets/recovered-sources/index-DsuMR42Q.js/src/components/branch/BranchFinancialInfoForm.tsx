import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  BranchFinancialInfo,
  FinancialEntityType,
  CreateBranchFinancialInfoDto
} from '@/types/BranchFinancialInfo.interface';
import {
  getBranchFinancialInfo,
  createBranchFinancialInfo,
  updateBranchFinancialInfo
} from '@/data/branchFinancialInfoService';
import { validateIBAN, formatIBANPretty } from '@/utils/ibanValidator';
import { validateTaxId } from '@/utils/taxIdValidator';
import { deleteBranchFinancialInfo } from '@/data/branchFinancialInfoService';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '../modals/ConfirmDialog';

interface BranchFinancialInfoFormProps {
  branchId: number;
}

const BranchFinancialInfoForm = ({
  branchId
}: BranchFinancialInfoFormProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [financialInfo, setFinancialInfo] =
    useState<BranchFinancialInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<
    'success' | 'error'
  >('success');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState<CreateBranchFinancialInfoDto>({
    entityType: FinancialEntityType.COMPANY,
    companyTitle: '',
    fullName: '',
    taxIdNumber: '',
    taxOffice: '',
    iban: ''
  });

  const [validationErrors, setValidationErrors] = useState<{
    taxIdNumber?: string;
    taxOffice?: string;
    iban?: string;
    companyTitle?: string;
    fullName?: string;
  }>({});

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setOpenNotification(true);
  };

  const handleCloseNotification = () => {
    setOpenNotification(false);
  };

  const loadFinancialInfo = async () => {
    try {
      setLoading(true);
      const data = await getBranchFinancialInfo(branchId);
      if (data) {
        setFinancialInfo(data);
        setFormData({
          entityType: data.entityType,
          companyTitle: data.companyTitle || '',
          fullName: data.fullName || '',
          taxIdNumber: data.taxIdNumber,
          taxOffice: data.taxOffice || '',
          iban: data.iban
        });
      } else {
        // No financial info exists, enable editing mode
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading financial info:', error);
      showNotification(t('error.loading.financial.info'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Validate entity type specific fields
    if (formData.entityType === FinancialEntityType.COMPANY) {
      if (!formData.companyTitle?.trim()) {
        errors.companyTitle = t('company.title.required');
      }
    } else {
      if (!formData.fullName?.trim()) {
        errors.fullName = t('full.name.required');
      }
    }

    // Validate Tax ID
    const taxIdValidation = validateTaxId(formData.taxIdNumber);
    if (!taxIdValidation.isValid) {
      errors.taxIdNumber = taxIdValidation.errorKey
        ? t(taxIdValidation.errorKey)
        : t('invalid.tax.id');
    }

    // Validate Tax Office (required)
    if (!formData.taxOffice?.trim()) {
      errors.taxOffice = t('tax.office.required');
    }

    // Validate IBAN
    const ibanValidation = validateIBAN(formData.iban);
    if (!ibanValidation.isValid) {
      errors.iban = ibanValidation.errorKey
        ? t(ibanValidation.errorKey)
        : t('invalid.iban');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Prepare base data
      const baseData = {
        entityType: formData.entityType,
        taxIdNumber: formData.taxIdNumber.replace(/\s/g, ''),
        taxOffice: formData.taxOffice || undefined,
        iban: formData.iban.replace(/\s/g, '').toUpperCase()
      };

      // Add entity type specific fields
      const dataToSave: CreateBranchFinancialInfoDto = {
        ...baseData,
        companyTitle:
          formData.entityType === FinancialEntityType.COMPANY
            ? formData.companyTitle
            : undefined,
        fullName:
          formData.entityType === FinancialEntityType.INDIVIDUAL
            ? formData.fullName
            : undefined
      };

      if (financialInfo) {
        // Update existing
        const updated = await updateBranchFinancialInfo(
          financialInfo.id,
          dataToSave
        );
        setFinancialInfo(updated);
        showNotification(t('financial.info.updated.successfully'), 'success');
      } else {
        // Create new
        const created = await createBranchFinancialInfo(branchId, dataToSave);
        setFinancialInfo(created);
        showNotification(t('financial.info.created.successfully'), 'success');
      }

      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving financial info:', err);
      const errorMessage =
        err?.response?.data?.message || t('error.saving.financial.info');
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (financialInfo) {
      // Reset to existing data
      setFormData({
        entityType: financialInfo.entityType,
        companyTitle: financialInfo.companyTitle || '',
        fullName: financialInfo.fullName || '',
        taxIdNumber: financialInfo.taxIdNumber,
        taxOffice: financialInfo.taxOffice || '',
        iban: financialInfo.iban
      });
      setIsEditing(false);
    }
    setValidationErrors({});
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!financialInfo) return;

    try {
      await deleteBranchFinancialInfo(financialInfo.id);
      setFinancialInfo(null);
      setFormData({
        entityType: FinancialEntityType.COMPANY,
        companyTitle: '',
        fullName: '',
        taxIdNumber: '',
        taxOffice: '',
        iban: ''
      });
      setIsEditing(false);
      setShowDeleteDialog(false);
      showNotification(t('financial.info.deleted.successfully'), 'success');
    } catch (error: any) {
      console.error('Error deleting financial info:', error);
      const errorMessage =
        error?.response?.data?.message || t('error.deleting.financial.info');
      showNotification(errorMessage, 'error');
    }
  };

  const handleFieldChange = (
    field: keyof CreateBranchFinancialInfoDto,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
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
        <Typography variant="h5" color="text.primary" fontWeight="bold">
          {t('financial.information')}
        </Typography>
        {!isEditing && financialInfo && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              size="small"
              onClick={handleEdit}
            >
              {t('edit')}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              size="small"
              onClick={handleDeleteClick}
            >
              {t('delete')}
            </Button>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl component="fieldset" disabled={!isEditing}>
            <FormLabel component="legend">{t('entity.type')}</FormLabel>
            <RadioGroup
              row
              value={formData.entityType}
              onChange={(e) =>
                handleFieldChange(
                  'entityType',
                  e.target.value as FinancialEntityType
                )
              }
            >
              <FormControlLabel
                value={FinancialEntityType.COMPANY}
                control={<Radio />}
                label={t('company')}
              />
              <FormControlLabel
                value={FinancialEntityType.INDIVIDUAL}
                control={<Radio />}
                label={t('individual')}
              />
            </RadioGroup>
          </FormControl>
        </Grid>

        {formData.entityType === FinancialEntityType.COMPANY ? (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('company.title')}
              value={formData.companyTitle}
              onChange={(e) =>
                handleFieldChange('companyTitle', e.target.value)
              }
              disabled={!isEditing}
              required
              error={!!validationErrors.companyTitle}
              helperText={validationErrors.companyTitle}
            />
          </Grid>
        ) : (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('full.name')}
              value={formData.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              disabled={!isEditing}
              required
              error={!!validationErrors.fullName}
              helperText={validationErrors.fullName}
            />
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('tax.id.number')}
            value={formData.taxIdNumber}
            onChange={(e) => handleFieldChange('taxIdNumber', e.target.value)}
            disabled={!isEditing}
            required
            error={!!validationErrors.taxIdNumber}
            helperText={validationErrors.taxIdNumber || t('tax.id.helper.text')}
            placeholder="12345678901"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('tax.office')}
            value={formData.taxOffice}
            onChange={(e) => handleFieldChange('taxOffice', e.target.value)}
            disabled={!isEditing}
            required
            error={!!validationErrors.taxOffice}
            helperText={validationErrors.taxOffice}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('iban')}
            value={isEditing ? formData.iban : formatIBANPretty(formData.iban)}
            onChange={(e) => handleFieldChange('iban', e.target.value)}
            disabled={!isEditing}
            required
            error={!!validationErrors.iban}
            helperText={validationErrors.iban || t('iban.helper.text')}
            placeholder="TR33 0006 1005 1978 6457 8413 26"
          />
        </Grid>
      </Grid>

      {isEditing && (
        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          {financialInfo && (
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
            >
              {t('cancel')}
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {t('save')}
          </Button>
        </Box>
      )}

      <Snackbar
        open={openNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          variant="filled"
          severity={notificationSeverity}
          onClose={handleCloseNotification}
          sx={{ width: '100%' }}
        >
          {notificationMessage}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('delete.financial.info')}
        message={t('delete.financial.info.question')}
        confirmButtonText={t('delete')}
        confirmButtonColor="error"
      />
    </Paper>
  );
};

export default BranchFinancialInfoForm;
