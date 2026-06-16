import React, { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { activityService } from '@/data/activityService';

interface ChildActivity {
  id: number;
  title: string;
  activity?: {
    id: number;
    title: string;
  };
}

interface ChildActivityFilterProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  size?: 'small' | 'medium';
  activityId?: number;
  disabled?: boolean;
}

const ChildActivityFilter: React.FC<ChildActivityFilterProps> = ({
  value,
  onChange,
  size = 'medium',
  activityId,
  disabled = false
}) => {
  const [childActivities, setChildActivities] = useState<ChildActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchChildActivities = async () => {
      if (!activityId) {
        setChildActivities([]);
        return;
      }

      setLoading(true);
      try {
        const params: any = {
          getAll: true,
          activityId: activityId
        };

        const data = await activityService.getChildActivities(params);
        setChildActivities(data || []);
      } catch (error) {
        console.error('Error fetching child activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildActivities();
  }, [activityId]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : Number(selectedValue));
  };

  const isDisabled = disabled || !activityId || loading;

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="child-activity-filter-label">
        {t('child.activity')}
      </InputLabel>
      <Select
        labelId="child-activity-filter-label"
        id="child-activity-filter"
        value={value?.toString() || 'all'}
        label={t('child.activity')}
        onChange={handleChange}
        disabled={isDisabled}
        data-testid="child-activity-filter-select"
      >
        <MenuItem value="all">{t('filters.all.child.activities')}</MenuItem>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          childActivities.map((childActivity) => (
            <MenuItem
              key={childActivity.id}
              value={childActivity.id.toString()}
            >
              {childActivity.title}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default ChildActivityFilter;
