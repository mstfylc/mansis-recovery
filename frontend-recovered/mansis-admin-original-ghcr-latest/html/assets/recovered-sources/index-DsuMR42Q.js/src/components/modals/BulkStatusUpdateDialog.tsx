import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import StatusLabel from '@/components/StatusLabel';

export interface StatusOption {
  value: string;
  label: string;
}

export interface BulkStatusUpdateDialogProps<T = any> {
  open: boolean;
  onClose: () => void;
  onConfirm: (status: string) => Promise<void>;
  selectedItems: T[];
  statusOptions: StatusOption[];
  title?: string;
  description?: string;
  itemDisplayProperty?: keyof T | ((item: T) => string);
  currentStatusProperty?: keyof T | ((item: T) => string);
  loading?: boolean;
  maxDisplayItems?: number;
}

const BulkStatusUpdateDialog = <T extends Record<string, any>>({
  open,
  onClose,
  onConfirm,
  selectedItems,
  statusOptions,
  title,
  description,
  itemDisplayProperty = 'name' as keyof T,
  currentStatusProperty = 'status' as keyof T,
  loading = false,
  maxDisplayItems = 5
}: BulkStatusUpdateDialogProps<T>) => {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedStatus('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedStatus);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // StatusLabel component handles the styling and colors automatically

  const displayItems = selectedItems.slice(0, maxDisplayItems);
  const remainingCount = selectedItems.length - maxDisplayItems;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          minHeight: 400
        }
      }}
    >
      <DialogTitle>{title || t('bulk.status.update.title')}</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            {description || t('bulk.status.update.description')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('selected.items.count', { count: selectedItems.length })}
          </Typography>

          {/* Display selected items */}
          <Box sx={{ mb: 3 }}>
            {displayItems.map((item, index) => (
              <Box
                key={item.id || item.name || item.title || `item-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom:
                    index < displayItems.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" noWrap sx={{ flex: 1, mr: 2 }}>
                  {typeof itemDisplayProperty === 'function'
                    ? itemDisplayProperty(item)
                    : String(item[itemDisplayProperty] || `Item ${index + 1}`)}
                </Typography>
                <StatusLabel
                  status={String(
                    typeof currentStatusProperty === 'function'
                      ? currentStatusProperty(item)
                      : item[currentStatusProperty] || ''
                  ).toUpperCase()}
                />
              </Box>
            ))}

            {remainingCount > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('and.more.items', { count: remainingCount })}
              </Typography>
            )}
          </Box>

          {/* Status selection */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="status-select-label">{t('new.status')}</InputLabel>
            <Select
              labelId="status-select-label"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label={t('new.status')}
              disabled={isSubmitting}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <StatusLabel status={option.value.toUpperCase()} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedStatus || isSubmitting || loading}
        >
          {isSubmitting ? t('updating') : t('update.status')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkStatusUpdateDialog;
