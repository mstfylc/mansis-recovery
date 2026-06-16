import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react';
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Paper
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ColorPickerField from '@/components/inputs/ColorPickerField';
import { CompanySettings } from '@/types/Company.interface';
import { companyService } from '@/data/companyService';

interface CompanyThemeTabProps {
  companyId: number;
}

const DEFAULT_SETTINGS: CompanySettings = {
  primaryColor: '#1B2C3E',
  accentColor: '#EDA600',
  secondaryAccent: '#FFB400'
};

const CompanyThemeTab = forwardRef(
  ({ companyId }: CompanyThemeTabProps, ref) => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{
      open: boolean;
      message: string;
      severity: 'success' | 'error';
    }>({
      open: false,
      message: '',
      severity: 'success'
    });

    const handleCloseSnackbar = () => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const fetchSettings = useCallback(async () => {
      try {
        setLoading(true);
        const data = await companyService.getSettings(companyId);
        if (data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch company settings:', err);
        setSnackbar({
          open: true,
          message: err.response?.data?.message || t('error.fetching.data'),
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }, [companyId, t]);

    useEffect(() => {
      fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
      try {
        setSaving(true);
        await companyService.putSettings(companyId, {
          primaryColor: settings.primaryColor,
          accentColor: settings.accentColor,
          secondaryAccent: settings.secondaryAccent
        });
        setSnackbar({
          open: true,
          message: t('save.success'),
          severity: 'success'
        });
        return true;
      } catch (err: any) {
        console.error('Failed to save company settings:', err);
        setSnackbar({
          open: true,
          message: err.response?.data?.message || t('error.saving.data'),
          severity: 'error'
        });
        return false;
      } finally {
        setSaving(false);
      }
    };

    const handleReset = () => {
      setSettings(DEFAULT_SETTINGS);
    };

    useImperativeHandle(ref, () => ({
      handleSave,
      handleReset,
      saving
    }));

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('theme.colors')}
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}
          >
            <ColorPickerField
              label={t('primary.color')}
              value={settings.primaryColor}
              onChange={(color) =>
                setSettings((prev) => ({ ...prev, primaryColor: color }))
              }
              helperText={t('primary.color.helper')}
            />
            <ColorPickerField
              label={t('accent.color')}
              value={settings.accentColor}
              onChange={(color) =>
                setSettings((prev) => ({ ...prev, accentColor: color }))
              }
              helperText={t('accent.color.helper')}
            />
            <ColorPickerField
              label={t('secondary.accent')}
              value={settings.secondaryAccent}
              onChange={(color) =>
                setSettings((prev) => ({ ...prev, secondaryAccent: color }))
              }
              helperText={t('secondary.accent.helper')}
            />
          </Box>
        </Paper>

        {/* Preview */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('preview')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 60,
                height: 40,
                borderRadius: 1,
                backgroundColor: settings.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontSize: 9 }}>
                {t('primary.short')}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 60,
                height: 40,
                borderRadius: 1,
                backgroundColor: settings.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontSize: 9 }}>
                {t('accent.short')}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 60,
                height: 40,
                borderRadius: 1,
                backgroundColor: settings.secondaryAccent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontSize: 9 }}>
                {t('secondary.short')}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }
);

CompanyThemeTab.displayName = 'CompanyThemeTab';

export default CompanyThemeTab;
