import { useState, useEffect } from 'react';
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
  Box,
  Chip,
  Tooltip,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@/data/notificationService';
import {
  NotificationTemplate,
  NotificationCategory
} from '@/types/Notification.interface';
import { useSnackbar } from 'notistack';

interface TemplateDialogProps {
  open: boolean;
  onClose: (saved?: boolean) => void;
  template: NotificationTemplate | null;
}

function TemplateDialog({ open, onClose, template }: TemplateDialogProps) {
  const { t } = useTranslation();

  const templateVariables = [
    { label: t('notification.variables.userName'), value: '{{userName}}' },
    { label: t('notification.variables.branchName'), value: '{{branchName}}' },
    { label: t('notification.variables.companyName'), value: '{{companyName}}' }
  ];
  const { enqueueSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [category, setCategory] = useState<NotificationCategory>(
    NotificationCategory.ANNOUNCEMENT
  );
  const [minRole, setMinRole] = useState('BRANCH_ADMIN');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setTitle(template.title);
      setBody(template.body);
      setImageUrl(template.imageUrl || '');
      setDeepLink(template.deepLink || '');
      setCategory(template.category);
      setMinRole(template.minRole || 'BRANCH_ADMIN');
    } else {
      setName('');
      setTitle('');
      setBody('');
      setImageUrl('');
      setDeepLink('');
      setCategory(NotificationCategory.ANNOUNCEMENT);
      setMinRole('BRANCH_ADMIN');
    }
  }, [template, open]);

  const handleInsertVariable = (variable: string) => {
    setBody((prev) => prev + variable);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        name,
        title,
        body,
        imageUrl: imageUrl || undefined,
        deepLink: deepLink || undefined,
        category,
        minRole
      };

      if (template) {
        await notificationService.updateTemplate(template.id, payload);
      } else {
        await notificationService.createTemplate(payload);
      }

      enqueueSnackbar(t('common.saveSuccess'), { variant: 'success' });
      onClose(true);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || t('common.error'), {
        variant: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>
        {template
          ? t('notification.template.edit')
          : t('notification.template.create')}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label={t('notification.template.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label={t('notification.campaign.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            helperText={t('notification.template.variableHint')}
          />
          <TextField
            label={t('notification.campaign.body')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
            multiline
            rows={4}
            required
          />

          <Box>
            <Typography variant="caption" color="text.secondary" mb={0.5}>
              {t('notification.template.variables')}
            </Typography>
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {templateVariables.map((v) => (
                <Tooltip
                  key={v.value}
                  title={t('notification.variables.insertHint')}
                  placement="top"
                >
                  <Chip
                    label={v.label}
                    size="small"
                    onClick={() => handleInsertVariable(v.value)}
                    clickable
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          <FormControl fullWidth>
            <InputLabel>{t('notification.campaign.category')}</InputLabel>
            <Select
              value={category}
              label={t('notification.campaign.category')}
              onChange={(e) =>
                setCategory(e.target.value as NotificationCategory)
              }
            >
              {Object.values(NotificationCategory).map((c) => (
                <MenuItem key={c} value={c}>
                  {t(`notification.category.${c.toLowerCase()}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('notification.template.minRole')}</InputLabel>
            <Select
              value={minRole}
              label={t('notification.template.minRole')}
              onChange={(e) => setMinRole(e.target.value)}
            >
              <MenuItem value="CUSTOMER">{t('roles.customer')}</MenuItem>
              <MenuItem value="EMPLOYEE">{t('roles.employee')}</MenuItem>
              <MenuItem value="BRANCH_ADMIN">
                {t('roles.branch_admin')}
              </MenuItem>
              <MenuItem value="COMPANY_ADMIN">
                {t('roles.company_admin')}
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={t('notification.campaign.imageUrl')}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            fullWidth
          />
          <TextField
            label={t('notification.campaign.deepLink')}
            value={deepLink}
            onChange={(e) => setDeepLink(e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !name || !title || !body}
        >
          {submitting ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TemplateDialog;
