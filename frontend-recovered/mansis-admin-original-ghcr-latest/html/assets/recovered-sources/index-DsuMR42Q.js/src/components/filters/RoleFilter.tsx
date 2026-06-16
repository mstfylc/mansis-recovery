import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getAvailableRoles } from '@/utils/helpers';
import { Role } from '@/enums/role';
import { useUserViewMode } from '@/hooks/useUserViewMode';

interface RoleFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
}

const RoleFilter: React.FC<RoleFilterProps> = ({
  value,
  onChange,
  minWidth = 200,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const { role: currentUserRole } = useUserViewMode();

  const availableRoles = getAvailableRoles(currentUserRole as Role);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === 'all' ? undefined : selectedValue);
  };

  return (
    <FormControl variant="outlined" sx={{ minWidth }} size={size}>
      <InputLabel id="role-filter-label">{t('filters.role')}</InputLabel>
      <Select
        labelId="role-filter-label"
        id="role-filter"
        value={value || 'all'}
        onChange={handleChange}
        label={t('filters.role')}
        data-testid="role-filter"
      >
        <MenuItem value="all">{t('filters.all.roles')}</MenuItem>
        {availableRoles.map((role) => (
          <MenuItem key={role} value={role}>
            {t(`roles.${role.toLowerCase()}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default RoleFilter;
