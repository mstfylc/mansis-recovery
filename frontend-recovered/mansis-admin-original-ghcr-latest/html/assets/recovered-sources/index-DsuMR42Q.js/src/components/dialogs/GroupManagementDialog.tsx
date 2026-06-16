import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import { SelectionType } from '@/types/CompanyProduct.interface';

interface GroupManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isEditing: boolean;
  form: {
    groupName: string;
    selectionType: SelectionType;
    minSelection: number;
    maxSelection: number;
    sortOrder: number;
  };
  onChangeForm: (key: string, value: any) => void;
}

const SELECTION_TYPE_OPTIONS = [
  { value: 'REQUIRED', labelKey: 'menu.selection.required' },
  { value: 'OPTIONAL', labelKey: 'menu.selection.optional' },
  { value: 'SELECTABLE', labelKey: 'menu.selection.selectable' }
] as const;

const GroupManagementDialog: React.FC<GroupManagementDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isEditing,
  form,
  onChangeForm
}) => {
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (!form.groupName.trim()) {
      return;
    }
    onSubmit();
  };

  const handleSelectionTypeChange = (newType: SelectionType) => {
    onChangeForm('selectionType', newType);

    if (newType === 'REQUIRED') {
      onChangeForm('minSelection', 1);
      onChangeForm('maxSelection', 1);
    } else if (newType === 'OPTIONAL') {
      onChangeForm('minSelection', 0);
      onChangeForm('maxSelection', 1);
    }
  };

  const isSelectableType = form.selectionType === 'SELECTABLE';
  const isValid = form.groupName.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">
          {isEditing ? t('group.edit.title') : t('group.create.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {isEditing ? t('group.edit.subtitle') : t('group.create.subtitle')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, px: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('group.name')}
              value={form.groupName}
              onChange={(e) => onChangeForm('groupName', e.target.value)}
              placeholder={t('group.name.placeholder')}
              error={!isValid && form.groupName.length > 0}
              helperText={
                !isValid && form.groupName.length > 0
                  ? t('group.name.required')
                  : ''
              }
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <NumericInput
              fullWidth
              label={t('group.sort.order')}
              value={form.sortOrder}
              onChange={(value) => onChangeForm('sortOrder', value)}
              min={0}
              max={999}
              helperText={t('group.sort.order.helper')}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>{t('menu.selection.type')}</InputLabel>
              <Select
                value={form.selectionType}
                label={t('menu.selection.type')}
                onChange={(e) =>
                  handleSelectionTypeChange(e.target.value as SelectionType)
                }
              >
                {SELECTION_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                mt: 1
              }}
            >
              <Typography color="text.secondary">
                {form.selectionType === 'REQUIRED' &&
                  t('selection.type.required.explanation')}
                {form.selectionType === 'OPTIONAL' &&
                  t('selection.type.optional.explanation')}
                {form.selectionType === 'SELECTABLE' &&
                  t('selection.type.selectable.explanation')}
              </Typography>
            </Box>
          </Grid>

          {/* Min/Max Selections - Only for SELECTABLE type */}
          {isSelectableType && (
            <>
              <Grid item xs={6}>
                <NumericInput
                  fullWidth
                  label={t('menu.min.selection')}
                  value={form.minSelection}
                  onChange={(value) => onChangeForm('minSelection', value)}
                  min={0}
                  max={form.maxSelection}
                />
              </Grid>
              <Grid item xs={6}>
                <NumericInput
                  fullWidth
                  label={t('menu.max.selection')}
                  value={form.maxSelection}
                  onChange={(value) => onChangeForm('maxSelection', value)}
                  min={form.minSelection}
                  max={99}
                />
              </Grid>
            </>
          )}

          {/* Selection Summary */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'primary.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.200'
              }}
            >
              <Typography
                variant="subtitle2"
                color="primary.main"
                sx={{ mb: 1 }}
              >
                {t('group.summary')}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}
              >
                <Chip
                  size="small"
                  label={t(
                    `menu.selection.${form.selectionType.toLowerCase()}`
                  )}
                  color="primary"
                  variant="filled"
                />
                {isSelectableType && (
                  <Chip
                    size="small"
                    label={`${form.minSelection}-${form.maxSelection} ${t('selections')}`}
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid}>
          {isEditing ? t('update') : t('create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupManagementDialog;
