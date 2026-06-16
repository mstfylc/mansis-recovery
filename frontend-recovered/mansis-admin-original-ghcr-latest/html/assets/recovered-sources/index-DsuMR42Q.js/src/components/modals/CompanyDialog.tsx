import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import FileUploadCard from '../FileUploadCard';
import { Company } from '@/types/Company.interface';
import { CompanyStatus } from '@/enums/company-status';
import { user$ } from '@/store/userStore';
import CompanyThemeTab from '@/components/company/CompanyThemeTab';

type CompanyDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  company?: Company | null;
  onSave: (company: {
    name: string;
    status?: string;
    imageFile?: File | null;
  }) => Promise<void>;
};

const CompanyDialog = ({
  open,
  onClose,
  onSave,
  error,
  company
}: CompanyDialogProps) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string>(CompanyStatus.ACTIVE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );
  const [activeTab, setActiveTab] = useState(0);
  const themeRef = useRef<any>(null);
  const isEditMode = !!company;
  const isSuperAdmin = user$.isSuperAdmin.get();
  const showTabs = isEditMode && isSuperAdmin;
  const { t } = useTranslation();

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setStatus(company.status || CompanyStatus.ACTIVE);
    } else {
      resetForm();
    }
  }, [company]);

  const resetForm = () => {
    setName('');
    setStatus(CompanyStatus.ACTIVE);
    setImageFile(null);
    setValidationError(undefined);
    setActiveTab(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (loading) return;

    if (!name) {
      setValidationError(t('company.name.required'));
      return;
    }

    try {
      setLoading(true);
      await onSave({
        name,
        ...(isEditMode && { status }),
        ...(imageFile && { imageFile })
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={showTabs && activeTab === 1 ? 'md' : 'sm'}
      fullWidth
    >
      <DialogTitle>
        {isEditMode ? t('edit.company') : t('new.company')}
        {isEditMode && ` - ${company?.name}`}
      </DialogTitle>

      {showTabs && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label={t('general')} />
            <Tab label={t('theme.settings')} />
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ p: 3 }}>
        {activeTab === 0 && (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}
            <TextField
              required
              autoFocus
              margin="dense"
              label={t('name')}
              type="text"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {isEditMode && (
              <FormControl fullWidth margin="dense">
                <InputLabel>{t('status')}</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label={t('status')}
                >
                  {Object.values(CompanyStatus).map((statusOption) => (
                    <MenuItem key={statusOption} value={statusOption}>
                      {t(statusOption.toLowerCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FileUploadCard
              onFileSelect={(file) => {
                setImageFile(file);
              }}
              imageUrl={company?.file?.url}
              accept="image/*"
              helperText={isEditMode ? t('edit.image.helper.text') : undefined}
            />
          </>
        )}

        {activeTab === 1 && showTabs && (
          <CompanyThemeTab companyId={company.id} ref={themeRef} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {activeTab === 0 ? (
          <>
            <Button onClick={handleClose} variant="outlined" disabled={loading}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!name || loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? t('saving') : t('save')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} variant="outlined">
              {t('close')}
            </Button>
            <Button
              onClick={() => themeRef.current?.handleReset?.()}
              variant="outlined"
            >
              {t('reset.defaults')}
            </Button>
            <Button
              onClick={async () => {
                const success = await themeRef.current?.handleSave?.();
                if (success) {
                  onClose();
                }
              }}
              variant="contained"
              disabled={themeRef.current?.saving}
              startIcon={
                themeRef.current?.saving ? <CircularProgress size={20} /> : null
              }
            >
              {themeRef.current?.saving ? t('saving') : t('save')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CompanyDialog;
