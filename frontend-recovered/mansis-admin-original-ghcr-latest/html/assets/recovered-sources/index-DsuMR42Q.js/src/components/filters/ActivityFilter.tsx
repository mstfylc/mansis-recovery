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

interface Activity {
  id: number;
  title: string;
  company?: {
    id: number;
    name: string;
  };
  branch?: {
    id: number;
    name: string;
  };
}

interface ActivityFilterProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  size?: 'small' | 'medium';
  companyId?: number;
  branchId?: number;
}

const ActivityFilter: React.FC<ActivityFilterProps> = ({
  value,
  onChange,
  size = 'medium',
  companyId,
  branchId
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const params: any = {
          getAll: true
        };

        if (companyId) {
          params.companyId = companyId;
        }

        if (branchId) {
          params.branchId = branchId;
        }

        const result = await activityService.getAll(params);
        setActivities((result.items as Activity[]) || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [companyId, branchId]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : Number(selectedValue));
  };

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="activity-filter-label">{t('activity')}</InputLabel>
      <Select
        labelId="activity-filter-label"
        id="activity-filter"
        value={value?.toString() || 'all'}
        label={t('activity')}
        onChange={handleChange}
        disabled={loading}
        data-testid="activity-filter-select"
      >
        <MenuItem value="all">{t('filters.all.activities')}</MenuItem>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          activities.map((activity) => (
            <MenuItem key={activity.id} value={activity.id.toString()}>
              {activity.title}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default ActivityFilter;
