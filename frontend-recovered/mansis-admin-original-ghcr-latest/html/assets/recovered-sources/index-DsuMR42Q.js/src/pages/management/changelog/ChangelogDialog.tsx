import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Divider,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import NumericInput from '@/components/NumericInput';
import StyledDatePicker from '@/components/date&time/StyledDatePicker';
import { useTranslation } from 'react-i18next';
import {
  ChangelogApp,
  ChangelogCategory,
  CHANGELOG_APPS,
  CHANGELOG_CATEGORIES
} from '@/constants/changelog';
import type {
  ChangelogRelease,
  ChangelogApp as ChangelogAppType,
  ChangelogCategory as ChangelogCategoryType
} from '@/types/ChangelogRelease.interface';
import type {
  CreateChangelogReleaseDto,
  UpdateChangelogReleaseDto
} from '@/data/changelogService';

interface ChangelogItemForm {
  _key: string;
  category: ChangelogCategoryType;
  title: string;
  description: string;
}

interface ChangelogDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    dto: CreateChangelogReleaseDto | UpdateChangelogReleaseDto
  ) => Promise<void>;
  release: ChangelogRelease | null;
  error: string;
}

const createEmptyItem = (key: string): ChangelogItemForm => ({
  _key: key,
  category: ChangelogCategory.FEATURE,
  title: '',
  description: ''
});

export default function ChangelogDialog({
  open,
  onClose,
  onSave,
  release,
  error
}: ChangelogDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const itemKeyRef = useRef(0);
  const [app, setApp] = useState<ChangelogAppType>(ChangelogApp.ADMIN);
  const [version, setVersion] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [items, setItems] = useState<ChangelogItemForm[]>(() => [
    createEmptyItem(`init-${Date.now()}`)
  ]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!release;

  useEffect(() => {
    if (!open) return;

    if (release) {
      setApp(release.app);
      setVersion(release.version);
      setDate(release.date ? new Date(release.date) : null);
      setSortOrder(release.sortOrder);
      setItems(
        release.items?.length
          ? release.items.map((i) => ({
              _key: `edit-${i.id}`,
              category: i.category as ChangelogCategoryType,
              title: i.title,
              description: i.description
            }))
          : [createEmptyItem(`new-${++itemKeyRef.current}`)]
      );
    } else {
      setApp(ChangelogApp.ADMIN);
      setVersion('');
      setDate(new Date());
      setSortOrder(0);
      setItems([createEmptyItem(`new-${++itemKeyRef.current}`)]);
    }
  }, [open, release]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      createEmptyItem(`new-${++itemKeyRef.current}`)
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0
        ? [createEmptyItem(`new-${++itemKeyRef.current}`)]
        : next;
    });
  };

  const updateItem = (
    index: number,
    field: keyof ChangelogItemForm,
    value: string | ChangelogCategoryType
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const getValidItems = (): ChangelogItemForm[] =>
    items.filter((i) => i.title.trim() && i.description.trim());

  const handleSubmit = async () => {
    const validItems = getValidItems();
    if (!version.trim() || !date || validItems.length === 0) {
      return;
    }

    try {
      setLoading(true);
      await onSave({
        app,
        version: version.trim(),
        date: date.toISOString(),
        sortOrder,
        items: validItems.map((i) => ({
          category: i.category,
          title: i.title.trim(),
          description: i.description.trim()
        }))
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const validItems = getValidItems();
  const canSubmit =
    version.trim() &&
    date &&
    validItems.length > 0 &&
    validItems.every((i) => i.title.trim() && i.description.trim());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t('changelog.edit') : t('changelog.create')}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('changelog.app')}</InputLabel>
            <Select
              value={app}
              label={t('changelog.app')}
              onChange={(e) => setApp(e.target.value as ChangelogAppType)}
            >
              {CHANGELOG_APPS.map((a) => (
                <MenuItem key={a} value={a}>
                  {t(`changelog.app.${a}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('changelog.version')}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            fullWidth
            size="small"
            required
          />

          <StyledDatePicker
            label={t('changelog.date')}
            selected={date}
            onChange={setDate}
            required
          />

          <NumericInput
            label={t('changelog.sortOrder')}
            value={sortOrder}
            onChange={setSortOrder}
            fullWidth
            size="small"
            min={0}
            showEmptyForZero={false}
          />

          <Divider sx={{ my: 3 }} />

          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t('changelog.items')}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={addItem}
                variant="outlined"
                sx={{ textTransform: 'none' }}
              >
                {t('changelog.addItem')}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map((item, index) => (
                <Box
                  key={item._key}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                      gap: 1
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}
                    >
                      {t('changelog.item')} {index + 1}
                    </Typography>
                    {items.length > 1 && (
                      <Button
                        size="small"
                        onClick={() => removeItem(index)}
                        startIcon={<DeleteOutlinedIcon fontSize="small" />}
                        sx={{
                          minWidth: 'auto',
                          px: 1.5,
                          color: 'text.secondary',
                          textTransform: 'none',
                          '&:hover': {
                            color: 'error.main',
                            backgroundColor: alpha(
                              theme.palette.error.main,
                              0.08
                            )
                          }
                        }}
                      >
                        {t('changelog.removeItem')}
                      </Button>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('changelog.category')}</InputLabel>
                      <Select
                        value={item.category}
                        label={t('changelog.category')}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'category',
                            e.target.value as ChangelogCategoryType
                          )
                        }
                      >
                        {CHANGELOG_CATEGORIES.map((c) => (
                          <MenuItem key={c} value={c}>
                            {t(`changelog.category.${c}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label={t('changelog.entryTitle')}
                      value={item.title}
                      onChange={(e) =>
                        updateItem(index, 'title', e.target.value)
                      }
                      fullWidth
                      size="small"
                      required
                    />

                    <TextField
                      label={t('changelog.description')}
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, 'description', e.target.value)
                      }
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      required
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !canSubmit}
        >
          {loading ? <CircularProgress size={24} /> : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
