import { Box, Chip, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { NotificationCategory } from '@/types/Notification.interface';

interface NotificationFiltersProps {
  value: string;
  onChange: (category: string) => void;
  disabled?: boolean;
}

function NotificationFilters({
  value,
  onChange,
  disabled = false
}: NotificationFiltersProps) {
  const { t } = useTranslation();

  const categories = [
    { value: '', label: t('common.all') },
    ...Object.values(NotificationCategory).map((c) => ({
      value: c,
      label: t(`notification.category.${c.toLowerCase()}`)
    }))
  ];

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            onClick={disabled ? undefined : () => onChange(cat.value)}
            size="small"
            variant={!disabled && value === cat.value ? 'filled' : 'outlined'}
            disabled={disabled}
            sx={{
              borderRadius: 2,
              fontWeight: !disabled && value === cat.value ? 600 : 400,
              ...(!disabled &&
                value === cat.value && {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '& .MuiChip-label': { color: '#fff' }
                })
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default NotificationFilters;
