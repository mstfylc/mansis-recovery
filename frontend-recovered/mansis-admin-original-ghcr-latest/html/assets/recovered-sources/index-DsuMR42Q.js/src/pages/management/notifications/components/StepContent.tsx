import type { FC, RefObject, Dispatch, SetStateAction } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NotificationPreview from './NotificationPreview';
import {
  NotificationCategory,
  NotificationTemplate
} from '@/types/Notification.interface';

interface StepContentProps {
  title: string;
  setTitle: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  deepLink: string;
  setDeepLink: (v: string) => void;
  category: NotificationCategory;
  setCategory: (v: NotificationCategory) => void;
  templateId: number | null;
  templates: NotificationTemplate[];
  handleTemplateSelect: (id: number | null) => void;
  handleInsertVariable: (variable: string) => void;
  bodyInputRef: RefObject<HTMLInputElement | null>;
  stepErrors: Record<string, string>;
  setStepErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

const StepContent: FC<StepContentProps> = ({
  title,
  setTitle,
  body,
  setBody,
  imageUrl,
  setImageUrl,
  deepLink,
  setDeepLink,
  category,
  setCategory,
  templateId,
  templates,
  handleTemplateSelect,
  handleInsertVariable,
  bodyInputRef,
  stepErrors,
  setStepErrors
}) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Box display="flex" flexDirection="column" gap={2}>
          <FormControl fullWidth>
            <InputLabel>{t('notification.template.select')}</InputLabel>
            <Select
              value={templateId || ''}
              label={t('notification.template.select')}
              onChange={(e) =>
                handleTemplateSelect(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              <MenuItem value="">{t('notification.template.none')}</MenuItem>
              {templates.map((tmpl) => (
                <MenuItem key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('notification.campaign.title')}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (stepErrors.title)
                setStepErrors((prev) => ({ ...prev, title: '' }));
            }}
            fullWidth
            required
            error={!!stepErrors.title}
            helperText={stepErrors.title}
          />
          <TextField
            inputRef={bodyInputRef}
            label={t('notification.campaign.body')}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (stepErrors.body)
                setStepErrors((prev) => ({ ...prev, body: '' }));
            }}
            fullWidth
            multiline
            rows={4}
            required
            error={!!stepErrors.body}
            helperText={stepErrors.body}
          />
          <Box
            display="flex"
            gap={1}
            flexWrap="wrap"
            alignItems="center"
            mt={-1}
          >
            <Typography variant="caption" color="text.secondary">
              {t('notification.variables.hint')}:
            </Typography>
            {[
              {
                label: t('notification.variables.userName'),
                value: '{{userName}}'
              },
              {
                label: t('notification.variables.companyName'),
                value: '{{companyName}}'
              },
              {
                label: t('notification.variables.branchName'),
                value: '{{branchName}}'
              }
            ].map((v) => (
              <Tooltip
                key={v.value}
                title={t('notification.variables.insertHint')}
                placement="top"
              >
                <Chip
                  label={v.label}
                  size="small"
                  variant="outlined"
                  onClick={() => handleInsertVariable(v.value)}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            ))}
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ width: '100%', mt: 0.25 }}
            >
              {t('notification.variables.autoFilled')}
            </Typography>
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
      </Grid>
      <Grid item xs={12} md={5}>
        <NotificationPreview
          title={title}
          body={body}
          imageUrl={imageUrl || undefined}
          category={category}
        />
      </Grid>
    </Grid>
  );
};

export default StepContent;
