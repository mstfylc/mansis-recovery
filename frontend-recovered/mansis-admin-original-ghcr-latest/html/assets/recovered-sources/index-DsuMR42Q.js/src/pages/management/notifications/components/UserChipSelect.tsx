import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Avatar,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@/data/notificationService';

interface UserOption {
  id: number;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
}

interface UserChipSelectProps {
  selectedUsers: UserOption[];
  onChange: (users: UserOption[]) => void;
}

function UserChipSelect({ selectedUsers, onChange }: UserChipSelectProps) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<UserOption[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOptions([]);
      return;
    }
    try {
      setLoading(true);
      const result = await notificationService.searchUsers(query, 20);
      setOptions(result || []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchUsers(inputValue);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, searchUsers]);

  return (
    <Autocomplete
      multiple
      options={options}
      value={selectedUsers}
      onChange={(_, newValue) => onChange(newValue as UserOption[])}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      getOptionLabel={(option) => `${option.name} ${option.surname}`}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('notification.audience.selectUsers')}
          placeholder={t('notification.audience.searchPlaceholder')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={`${option.name} ${option.surname}`}
            avatar={
              <Avatar>
                {option.name[0]}
                {option.surname[0]}
              </Avatar>
            }
          />
        ))
      }
      noOptionsText={
        inputValue.length < 2
          ? t('notification.audience.typeToSearch')
          : t('common.noResults')
      }
    />
  );
}

export default UserChipSelect;
