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
import { campaignService } from '@/data/campaignService';
import { Campaign } from '@/types/Campaign.interface';
import { useTranslation } from 'react-i18next';
import { user$ } from '@/store/userStore';

interface CampaignAutocompleteProps {
  value?: Campaign | null;
  onChange: (campaign: Campaign | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  types?: string[];
}

const CampaignAutocomplete: React.FC<CampaignAutocompleteProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
  size = 'medium',
  sx,
  types
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { t } = useTranslation();

  // Debounced search function
  const searchCampaigns = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setCampaigns([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const branchId = user$.currentBranch.get()?.id;
      const params: any = {
        search: searchTerm,
        limit: 20,
        page: 0,
        ...(branchId && { branchId })
      };

      // Add type filter if types are specified
      if (types && types.length > 0) {
        params.type = types.join(',');
      }

      const data = await campaignService.getAll(params);
      setCampaigns(data.items || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(searchCampaigns, 1000);

  useEffect(() => {
    if (inputValue) {
      setHasSearched(false);
      debouncedSearch(inputValue);
    } else {
      setCampaigns([]);
      setHasSearched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return (
    <Autocomplete
      sx={sx}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={campaigns}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.title
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      disabled={disabled}
      filterOptions={(x) => x} // Disable built-in filtering since we use server-side search
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('select.campaign')}
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
              <Typography variant="body1">{option.title}</Typography>
              {option.description && (
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.title}
            size={size}
          />
        ))
      }
      noOptionsText={
        inputValue.length < 2
          ? t('campaign.autocomplete.type.to.search')
          : loading
            ? t('searching')
            : !hasSearched
              ? t('searching')
              : t('campaign.autocomplete.no.results')
      }
      loadingText={t('searching')}
    />
  );
};

export default CampaignAutocomplete;
