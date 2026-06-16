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
import { membershipPlanService } from '@/data/membershipPlanService';
import { MembershipPlan } from '@/types/MembershipPlan.interface';
import { useTranslation } from 'react-i18next';

interface MembershipPlanAutocompleteProps {
  value?: MembershipPlan | null;
  onChange: (plan: MembershipPlan | null) => void;
  branchId?: number;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const MembershipPlanAutocomplete: React.FC<MembershipPlanAutocompleteProps> = ({
  value,
  onChange,
  branchId,
  error = false,
  helperText,
  required = false,
  disabled = false,
  size = 'medium',
  sx
}) => {
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Fetch membership plans when branchId changes
  useEffect(() => {
    const fetchMembershipPlans = async () => {
      if (!branchId) {
        setMembershipPlans([]);
        return;
      }

      try {
        setLoading(true);

        const data = await membershipPlanService.getAll({
          branchId,
          status: 'ACTIVE',
          limit: 100
        });
        setMembershipPlans(data.items || []);
      } catch (error) {
        console.error('Error fetching membership plans:', error);
        setMembershipPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipPlans();
  }, [branchId]);

  // Reset selection when plans change
  useEffect(() => {
    if (value && !membershipPlans.find((plan) => plan.id === value.id)) {
      onChange(null);
    }
  }, [membershipPlans, value, onChange]);

  return (
    <Autocomplete
      sx={sx}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      options={membershipPlans}
      getOptionLabel={(option) =>
        typeof option === 'string'
          ? option
          : `${option.name} - ${option.price} TL (${option.durationDays} gün)`
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      disabled={disabled || !branchId || membershipPlans.length === 0}
      filterOptions={(x) => x} // Disable built-in filtering since we fetch specific plans
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('membership.plan')}
          error={error}
          helperText={helperText}
          required={required}
          size={size}
          margin="dense"
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
              <Typography variant="body1" fontWeight="bold">
                {option.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.durationDays} gün - {option.price} TL
                {option.branch && ` • ${option.branch.name}`}
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
            label={`${option.name} - ${option.price} TL`}
            size={size}
          />
        ))
      }
      noOptionsText={
        !branchId
          ? t('membership.plan.select.branch.first')
          : loading
            ? t('searching')
            : membershipPlans.length === 0
              ? t('membership.plan.no.plans.available')
              : t('membership.plan.no.results')
      }
      loadingText={t('searching')}
    />
  );
};

export default MembershipPlanAutocomplete;
