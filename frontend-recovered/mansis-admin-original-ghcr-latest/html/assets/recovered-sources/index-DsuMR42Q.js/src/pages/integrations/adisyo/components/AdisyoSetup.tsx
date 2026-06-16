import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { adisyoService } from '@/data/adisyoService';

interface AdisyoSetupProps {
  branchId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function AdisyoSetup({ branchId, onSuccess, onCancel }: AdisyoSetupProps) {
  const { t } = useTranslation();

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiConsumer, setApiConsumer] = useState('');
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  useEffect(() => {
    // Reset form state
    setError(null);
    setSuccess(false);

    // Fetch existing integration config if branchId is provided
    if (branchId) {
      fetchIntegrationConfig();
    }
  }, [branchId]);

  const fetchIntegrationConfig = async () => {
    if (!branchId) return;

    setLoadingConfig(true);
    try {
      const result = await adisyoService.getConfig(branchId);

      if (result) {
        setApiKey(result.apiKey || '');
        setApiSecret(result.apiSecret || '');
        setApiConsumer(result.apiConsumer || '');
      }
    } catch (err) {
      console.error('Error fetching integration config:', err);
      // Don't show error to user - just start with empty fields
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!apiKey || !apiSecret || !apiConsumer) {
      setError(t('integrations.adisyo.setup.dialog.fill.all.fields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adisyoService.setup(branchId, {
        apiKey,
        apiSecret,
        apiConsumer
      });

      setSuccess(true);
      setLoading(false);

      if (onSuccess) {
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error setting up Adisyo integration:', err);
      setError(err.response?.data?.message || err.message || t('common.error'));
      setLoading(false);
    }
  };

  const toggleShowApiSecret = () => {
    setShowApiSecret(!showApiSecret);
  };

  return (
    <Box className="adisyo-setup-form">
      <Grid container spacing={2}>
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {success && (
          <Grid item xs={12}>
            <Alert severity="success">
              {t('integrations.adisyo.setup.dialog.success')}
            </Alert>
          </Grid>
        )}

        {!success && (
          <>
            <Grid item xs={12}>
              <Typography variant="body1" paragraph>
                {t('integrations.adisyo.setup.dialog.description')}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('integrations.adisyo.setup.dialog.api.key')}
                fullWidth
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading || loadingConfig}
                margin="normal"
                placeholder="x-api-key"
                helperText={t('integrations.adisyo.setup.dialog.api.key.help')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('integrations.adisyo.setup.dialog.api.secret')}
                fullWidth
                type={showApiSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                disabled={loading || loadingConfig}
                margin="normal"
                placeholder="x-api-secret"
                helperText={t(
                  'integrations.adisyo.setup.dialog.api.secret.help'
                )}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleShowApiSecret}
                        edge="end"
                      >
                        {showApiSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('integrations.adisyo.setup.dialog.api.consumer')}
                fullWidth
                value={apiConsumer}
                onChange={(e) => setApiConsumer(e.target.value)}
                disabled={loading || loadingConfig}
                margin="normal"
                placeholder="x-api-consumer"
                helperText={t(
                  'integrations.adisyo.setup.dialog.api.consumer.help'
                )}
              />
            </Grid>
          </>
        )}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ mr: 1 }}>
          {success ? t('close') : t('cancel')}
        </Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              loading || loadingConfig || !apiKey || !apiSecret || !apiConsumer
            }
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading
              ? t('integrations.adisyo.setup.dialog.saving')
              : t('integrations.adisyo.setup.dialog.save')}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default AdisyoSetup;
