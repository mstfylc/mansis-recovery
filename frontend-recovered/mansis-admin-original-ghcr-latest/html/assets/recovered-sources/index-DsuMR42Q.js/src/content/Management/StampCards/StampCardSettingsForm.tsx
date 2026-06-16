import { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  StampCard,
  CreateStampCardDto,
  UpdateStampCardDto
} from '@/types/StampCard.interface';
import NumericInput from '@/components/NumericInput';
import {
  InfoTwoTone,
  LoopTwoTone,
  CardGiftcardTwoTone
} from '@mui/icons-material';

interface StampCardSettingsFormProps {
  stampCard: StampCard | null;
  loading: boolean;
  onSubmit: (data: CreateStampCardDto | UpdateStampCardDto) => Promise<void>;
  onDelete?: () => void;
  canManage: boolean;
}

const StampCardSettingsForm = ({
  stampCard,
  loading,
  onSubmit,
  onDelete,
  canManage
}: StampCardSettingsFormProps) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CreateStampCardDto>({
    name: '',
    description: '',
    requiredStamps: 10,
    validityDays: 30
  });

  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (stampCard) {
      setFormData({
        name: stampCard.name,
        description: stampCard.description || '',
        requiredStamps: stampCard.requiredStamps,
        validityDays: stampCard.validityDays
      });
      setIsActive(stampCard.isActive);
    }
  }, [stampCard]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    if (formData.requiredStamps < 2) return;
    if (formData.validityDays < 1) return;

    setSaving(true);
    try {
      if (stampCard) {
        await onSubmit({
          name: formData.name,
          description: formData.description || undefined,
          requiredStamps: formData.requiredStamps,
          validityDays: formData.validityDays,
          isActive
        } as UpdateStampCardDto);
      } else {
        await onSubmit(formData);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !stampCard) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <CardGiftcardTwoTone color="primary" />
        <Typography variant="h5">
          {stampCard ? t('stampCard.edit') : t('stampCard.create')}
        </Typography>
        {stampCard && (
          <Chip
            label={stampCard.isActive ? t('active') : t('inactive')}
            color={stampCard.isActive ? 'success' : 'default'}
            size="small"
            sx={{ ml: 1 }}
          />
        )}
      </Box>

      {/* Info Box */}
      <Alert icon={<InfoTwoTone />} severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          {t('stampCard.info.title')}
        </Typography>
        <Typography variant="body2">1. {t('stampCard.info.step1')}</Typography>
        <Typography variant="body2">2. {t('stampCard.info.step2')}</Typography>
        <Typography variant="body2">3. {t('stampCard.info.step3')}</Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<LoopTwoTone />}
            label={t('stampCard.cycle.info')}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<CardGiftcardTwoTone />}
            label={t('stampCard.companyWide')}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('stampCard.name')}
            placeholder={t('stampCard.name.placeholder')}
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={!canManage}
            required
            error={formData.name.trim() === '' && saving}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('stampCard.description.label')}
            placeholder={t('stampCard.description.placeholder')}
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            disabled={!canManage}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <NumericInput
            label={t('stampCard.requiredStamps')}
            helperText={t('stampCard.requiredStamps.helper')}
            value={formData.requiredStamps}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                requiredStamps: val ?? 10
              }))
            }
            min={2}
            max={100}
            disabled={!canManage}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <NumericInput
            label={t('stampCard.validityDays')}
            helperText={t('stampCard.validityDays.helper')}
            value={formData.validityDays}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                validityDays: val ?? 30
              }))
            }
            min={1}
            max={365}
            disabled={!canManage}
          />
        </Grid>

        {stampCard && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!canManage}
                />
              }
              label={t('stampCard.isActive')}
            />
          </Grid>
        )}
      </Grid>

      {canManage && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {stampCard && onDelete && (
              <Button
                variant="outlined"
                color="error"
                onClick={onDelete}
                disabled={saving}
              >
                {t('delete')}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving || !formData.name.trim()}
              startIcon={saving ? <CircularProgress size={20} /> : undefined}
            >
              {stampCard ? t('save') : t('stampCard.create')}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default StampCardSettingsForm;
