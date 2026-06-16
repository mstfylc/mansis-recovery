import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Chip,
  Box,
  Typography,
  SxProps,
  Theme
} from '@mui/material';
import { debounce } from '@/utils/helpers';
import { userService } from '@/data/userService';
import { User } from '@/types/User.interface';
import { Role } from '@/enums/role';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';

interface UserAutocompleteProps {
  value?: User | null;
  onChange: (user: User | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  roles?: Role[];
  sx?: SxProps<Theme>;
}

const UserAutocomplete: React.FC<UserAutocompleteProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
  size = 'medium',
  roles,
  sx
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [hasSearched, setHasSearched] = useState(false); // Track if we've actually searched
  const { t } = useTranslation();
  const { company } = useUserViewMode();

  // Debounced search function
  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const currentUserCompanyId = company?.id;
      const searchCompanyId = currentUserCompanyId;

      const data = await userService.getAll({
        search: searchTerm,
        limit: 20,
        page: 0,
        ...(searchCompanyId && { companyId: searchCompanyId }),
        ...(roles && roles.length > 0 && { roles: roles.join(',') })
      });
      setUsers(data.items || []);
      setHasSearched(true); // Mark that we've completed a search
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setHasSearched(true); // Mark that we've completed a search (even if failed)
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(searchUsers, 1000);

  useEffect(() => {
    if (inputValue) {
      setHasSearched(false); // Reset search state when input changes
      debouncedSearch(inputValue);
    } else {
      setUsers([]);
      setHasSearched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]); // Only trigger when inputValue changes

  return (
    <Autocomplete
      sx={sx}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={users}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : `${option.name} ${option.surname}`
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      disabled={disabled}
      filterOptions={(x) => x} // Disable built-in filtering since we use server-side search
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('customer.selection')}
          error={error}
          helperText={helperText}
          required={required}
          size={size}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <Box component="li" key={key} {...otherProps}>
            <Box>
              <Typography variant="body1">
                {option.name} {option.surname}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={`${option.name} ${option.surname}`}
            size={size}
          />
        ))
      }
      noOptionsText={
        inputValue.length < 2
          ? t('user.autocomplete.type.to.search')
          : loading
            ? t('searching')
            : !hasSearched
              ? t('searching') // Show "Searching..." during debounce period
              : t('user.autocomplete.no.results') // Show "No results" only after search is complete
      }
      loadingText={t('searching')}
    />
  );
};

export default UserAutocomplete;
