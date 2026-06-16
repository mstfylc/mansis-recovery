import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import StyledDatePicker from '../date&time/StyledDatePicker';
import { ChildActivity } from '@/types/ChildActivity.interface';

interface ChildActivityFormDialogProps {
  open: boolean;
  activityId: number;
  onClose: () => void;
  onSubmit: (childActivity: ChildActivityFormData) => void;
  childActivity?: ChildActivity | null;
  isEditMode?: boolean;
}

export interface ChildActivityFormData {
  title: string;
  description?: string;
  price: number;
  capacity?: number;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
  lastEnrollmentDateTime?: Date;
  activityId: number;
}

const ChildActivityFormDialog = ({
  open,
  activityId,
  onClose,
  onSubmit,
  childActivity,
  isEditMode = false
}: ChildActivityFormDialogProps) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<ChildActivityFormData>({
    title: '',
    description: '',
    price: 0,
    capacity: undefined,
    location: '',
    startDateTime: new Date(),
    endDateTime: new Date(),
    lastEnrollmentDateTime: undefined,
    activityId
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when in edit mode and childActivity changes
  useEffect(() => {
    if (isEditMode && childActivity) {
      setFormData({
        title: childActivity.title,
        description: childActivity.description || '',
        price: childActivity.price,
        capacity: childActivity.capacity || undefined,
        location: childActivity.location || '',
        startDateTime: new Date(childActivity.startDateTime),
        endDateTime: new Date(childActivity.endDateTime),
        lastEnrollmentDateTime: childActivity.lastEnrollmentDateTime
          ? new Date(childActivity.lastEnrollmentDateTime)
          : undefined,
        activityId
      });
    } else if (!isEditMode) {
      setFormData({
        title: '',
        description: '',
        price: 0,
        capacity: undefined,
        location: '',
        startDateTime: new Date(),
        endDateTime: new Date(),
        lastEnrollmentDateTime: undefined,
        activityId
      });
    }
  }, [isEditMode, childActivity, activityId]);

  const handleChange = (field: keyof ChildActivityFormData, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.title.required');
    }

    if (formData.price <= 0) {
      newErrors.price = t('validation.price.positive');
    }

    if (formData.capacity !== undefined && formData.capacity <= 0) {
      newErrors.capacity = t('validation.capacity.positive');
    }

    if (formData.endDateTime <= formData.startDateTime) {
      newErrors.endDateTime = t('validation.end.date.after.start');
    }

    if (
      formData.lastEnrollmentDateTime &&
      formData.lastEnrollmentDateTime >= formData.startDateTime
    ) {
      newErrors.lastEnrollmentDateTime = t(
        'validation.enrollment.deadline.before.start'
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{ '& .MuiDialog-paper': { overflowY: 'visible' } }}
    >
      <DialogTitle>
        {isEditMode ? t('edit.child.activity') : t('add.child.activity')}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label={t('title')}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel required>{t('price')}</InputLabel>
              <OutlinedInput
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', Number(e.target.value))}
                error={!!errors.price}
                endAdornment={
                  <InputAdornment position="end">TL</InputAdornment>
                }
                label={t('price')}
              />
              {errors.price && (
                <Box
                  sx={{
                    color: 'error.main',
                    fontSize: '0.75rem',
                    mt: 0.5,
                    mx: 1.5
                  }}
                >
                  {errors.price}
                </Box>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('capacity')}
              type="number"
              value={formData.capacity || ''}
              onChange={(e) =>
                handleChange(
                  'capacity',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              error={!!errors.capacity}
              helperText={errors.capacity}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('location')}
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledDatePicker
              label={t('start.date')}
              selected={formData.startDateTime}
              onChange={(date) => {
                if (date) {
                  handleChange('startDateTime', date);
                }
              }}
              required
              showTimeSelect
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledDatePicker
              label={t('end.date')}
              selected={formData.endDateTime}
              onChange={(date) => {
                if (date) {
                  handleChange('endDateTime', date);
                }
              }}
              required
              error={!!errors.endDateTime}
              helperText={errors.endDateTime}
              showTimeSelect
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledDatePicker
              label={t('last.enrollment.date')}
              selected={formData.lastEnrollmentDateTime || null}
              onChange={(date) => {
                handleChange('lastEnrollmentDateTime', date || undefined);
              }}
              error={!!errors.lastEnrollmentDateTime}
              helperText={errors.lastEnrollmentDateTime}
              showTimeSelect
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={4}
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          className="activity-add-child-dialog-cancel-button"
        >
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChildActivityFormDialog;
