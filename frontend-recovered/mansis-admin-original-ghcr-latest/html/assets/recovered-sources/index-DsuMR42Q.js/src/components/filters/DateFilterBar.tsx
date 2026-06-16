import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Stack,
  Button,
  ButtonGroup,
  Typography,
  Popover,
  FormControl,
  useTheme,
  Divider
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { useTranslation } from 'react-i18next';
import {
  startOfDay,
  endOfDay,
  format,
  subDays,
  subMonths,
  isValid
} from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import StyledDatePicker from '../date&time/StyledDatePicker';
import { DateRange, DateRangePreset } from '@/types/DateRange.interface';

// Locale map for date formatting
const localeMap = {
  en: enUS,
  tr: tr
};

interface DateFilterBarProps {
  onChange: (dateRange: DateRange | null) => void;
  initialDateRange?: DateRange;
  showPresets?: boolean;
  presets?: DateRangePreset[];
  filterLabel?: string;
  compact?: boolean;
  showClearButton?: boolean;
  noFilterLabel?: string;
  size?: 'small' | 'medium';
}

const DateFilterBar: React.FC<DateFilterBarProps> = ({
  onChange,
  initialDateRange,
  showPresets = true,
  presets = [
    'today',
    'yesterday',
    'last.7days',
    'last.30days',
    'this.month',
    'last.month',
    'custom'
  ],
  filterLabel,
  compact = false,
  showClearButton = false,
  noFilterLabel
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const currentLanguage = i18n.language?.split('-')[0] || 'en';
  const locale = localeMap[currentLanguage] || localeMap.en;

  // Date picker popover state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  // Active date range state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (initialDateRange?.startDate && initialDateRange?.endDate) {
      return initialDateRange;
    }

    // Default to last 30 days
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 29));

    return {
      startDate: start,
      endDate: end,
      preset: 'last.30days',
      label: t('filters.date.last.30days')
    };
  });

  // Track whether a filter is applied
  const [isFilterApplied, setIsFilterApplied] = useState<boolean>(
    Boolean(initialDateRange?.startDate && initialDateRange?.endDate)
  );

  // Temp date range for the popover
  const [tempDateRange, setTempDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  // Handle popover open
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setTempDateRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  };

  // Handle popover close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle clearing the date filter
  const handleClear = () => {
    onChange(null);
    setIsFilterApplied(false);
  };

  // Get preset date ranges
  const getPresetDateRange = (preset: DateRangePreset): DateRange => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    switch (preset) {
      case 'today':
        return {
          startDate: startOfToday,
          endDate: endOfToday,
          preset,
          label: t('filters.date.today')
        };
      case 'yesterday': {
        const yesterday = subDays(today, 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
          preset,
          label: t('filters.date.yesterday')
        };
      }
      case 'last.7days':
        return {
          startDate: startOfDay(subDays(today, 6)),
          endDate: endOfToday,
          preset,
          label: t('filters.date.last.7days')
        };
      case 'last.30days':
        return {
          startDate: startOfDay(subDays(today, 29)),
          endDate: endOfToday,
          preset,
          label: t('filters.date.last.30days')
        };

      case 'this.month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: startOfDay(startOfMonth),
          endDate: endOfToday,
          preset,
          label: t('filters.date.this.month')
        };
      }
      case 'last.month': {
        const lastMonth = subMonths(today, 1);
        const startOfLastMonth = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth(),
          1
        );
        const endOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );
        return {
          startDate: startOfDay(startOfLastMonth),
          endDate: endOfDay(endOfLastMonth),
          preset,
          label: t('filters.date.last.month')
        };
      }
      default:
        return {
          startDate: startOfDay(subDays(today, 29)),
          endDate: endOfToday,
          preset: 'last.30days',
          label: t('filters.date.last.30days')
        };
    }
  };

  // Handle preset selection
  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setTempDateRange({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      return;
    }

    const newDateRange = getPresetDateRange(preset);
    setDateRange(newDateRange);
    setIsFilterApplied(true);
    onChange(newDateRange);
    handleClose();
  };

  // Handle apply custom date range
  const handleApplyCustom = () => {
    if (
      tempDateRange.startDate &&
      tempDateRange.endDate &&
      isValid(tempDateRange.startDate) &&
      isValid(tempDateRange.endDate)
    ) {
      const formattedStart = format(tempDateRange.startDate, 'dd MMM yyyy', {
        locale
      });
      const formattedEnd = format(tempDateRange.endDate, 'dd MMM yyyy', {
        locale
      });

      const customRange: DateRange = {
        startDate: startOfDay(tempDateRange.startDate),
        endDate: endOfDay(tempDateRange.endDate),
        preset: 'custom',
        label: `${formattedStart} - ${formattedEnd}`
      };

      setDateRange(customRange);
      setIsFilterApplied(true);
      onChange(customRange);
      handleClose();
    }
  };

  // Format date range for display
  const formattedDateRange = useMemo(() => {
    if (!isFilterApplied && noFilterLabel) {
      return noFilterLabel;
    }

    if (dateRange.preset === 'custom') {
      const startFormatted = format(dateRange.startDate, 'dd MMM yyyy', {
        locale
      });
      const endFormatted = format(dateRange.endDate, 'dd MMM yyyy', { locale });
      return `${startFormatted} - ${endFormatted}`;
    }

    if (dateRange.preset) {
      const translation = t(`filters.date.${dateRange.preset}`);
      if (translation && !translation.startsWith('filters.date.')) {
        return translation;
      }
    }

    if (dateRange.label) {
      return dateRange.label;
    }

    const startFormatted = format(dateRange.startDate, 'dd MMM yyyy', {
      locale
    });
    const endFormatted = format(dateRange.endDate, 'dd MMM yyyy', { locale });

    return `${startFormatted} - ${endFormatted}`;
  }, [dateRange, locale, t, isFilterApplied, noFilterLabel]);

  const initialStartTime = useMemo(
    () => initialDateRange?.startDate?.getTime(),
    [initialDateRange?.startDate]
  );
  const initialEndTime = useMemo(
    () => initialDateRange?.endDate?.getTime(),
    [initialDateRange?.endDate]
  );
  const initialPreset = initialDateRange?.preset;

  // Update when initialDateRange changes externally
  useEffect(() => {
    if (
      initialDateRange?.startDate &&
      initialDateRange?.endDate &&
      initialStartTime &&
      initialEndTime
    ) {
      const currentStartTime = dateRange.startDate.getTime();
      const currentEndTime = dateRange.endDate.getTime();

      const datesChanged =
        initialStartTime !== currentStartTime ||
        initialEndTime !== currentEndTime;

      if (datesChanged || initialPreset !== dateRange.preset) {
        const newDateRange: DateRange = {
          startDate: initialDateRange.startDate,
          endDate: initialDateRange.endDate,
          preset: initialDateRange.preset,
          label: initialDateRange.label
        };

        setDateRange(newDateRange);
        setIsFilterApplied(true);

        setTempDateRange({
          startDate: initialDateRange.startDate,
          endDate: initialDateRange.endDate
        });
      }
    } else if (initialDateRange === null || !initialDateRange?.startDate) {
      setIsFilterApplied(false);
    }
  }, [
    initialStartTime,
    initialEndTime,
    initialPreset,
    dateRange.startDate,
    dateRange.endDate,
    dateRange.preset,
    initialDateRange
  ]);

  // Update labels when language changes
  useEffect(() => {
    if (dateRange.preset === 'custom') {
      const formattedStart = format(dateRange.startDate, 'dd MMM yyyy', {
        locale
      });
      const formattedEnd = format(dateRange.endDate, 'dd MMM yyyy', { locale });
      setDateRange((prevRange) => ({
        ...prevRange,
        label: `${formattedStart} - ${formattedEnd}`
      }));
    } else if (dateRange.preset) {
      const translation = t(`filters.date.${dateRange.preset}`);
      setDateRange((prevRange) => ({
        ...prevRange,
        label:
          translation && !translation.startsWith('filters.date.')
            ? translation
            : undefined
      }));
    } else {
      setDateRange((prevRange) => ({
        ...prevRange,
        label: undefined
      }));
    }
  }, [
    i18n.language,
    t,
    locale,
    dateRange.startDate,
    dateRange.endDate,
    dateRange.preset
  ]);

  return (
    <Box
      className="date-filter-bar"
      sx={{
        p: compact ? 1 : 1.5
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        {filterLabel && !compact && (
          <Typography variant="body2" color="text.secondary">
            {filterLabel}:
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: compact ? 1 : 0
          }}
        >
          <Button
            variant="outlined"
            startIcon={<DateRangeIcon />}
            onClick={handleClick}
            fullWidth={compact}
            size={compact ? 'small' : 'medium'}
          >
            {formattedDateRange}
          </Button>
        </Box>
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            p: 2,
            width: 300,
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: theme.shadows[2]
          }
        }}
      >
        {showPresets && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              {t('filters.date.presets')}
            </Typography>

            <ButtonGroup
              orientation="vertical"
              color="primary"
              variant="outlined"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            >
              {presets.includes('today') && (
                <Button
                  onClick={() => handlePresetSelect('today')}
                  color={dateRange.preset === 'today' ? 'primary' : 'inherit'}
                >
                  {t('filters.date.today')}
                </Button>
              )}

              {presets.includes('yesterday') && (
                <Button
                  onClick={() => handlePresetSelect('yesterday')}
                  color={
                    dateRange.preset === 'yesterday' ? 'primary' : 'inherit'
                  }
                >
                  {t('filters.date.yesterday')}
                </Button>
              )}

              {presets.includes('last.7days') && (
                <Button
                  onClick={() => handlePresetSelect('last.7days')}
                  color={
                    dateRange.preset === 'last.7days' ? 'primary' : 'inherit'
                  }
                >
                  {t('filters.date.last.7days')}
                </Button>
              )}

              {presets.includes('last.30days') && (
                <Button
                  onClick={() => handlePresetSelect('last.30days')}
                  color={
                    dateRange.preset === 'last.30days' ? 'primary' : 'inherit'
                  }
                >
                  {t('filters.date.last.30days')}
                </Button>
              )}

              {presets.includes('this.month') && (
                <Button
                  onClick={() => handlePresetSelect('this.month')}
                  color={
                    dateRange.preset === 'this.month' ? 'primary' : 'inherit'
                  }
                >
                  {t('filters.date.this.month')}
                </Button>
              )}

              {presets.includes('last.month') && (
                <Button
                  onClick={() => handlePresetSelect('last.month')}
                  color={
                    dateRange.preset === 'last.month' ? 'primary' : 'inherit'
                  }
                >
                  {t('filters.date.last.month')}
                </Button>
              )}
            </ButtonGroup>
          </>
        )}

        {presets.includes('custom') && (
          <>
            {showPresets && (
              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('filters.date.or')}
                </Typography>
              </Divider>
            )}

            <Typography variant="subtitle2" gutterBottom>
              {t('filters.date.custom.range')}
            </Typography>

            <FormControl fullWidth>
              <Stack spacing={2}>
                <StyledDatePicker
                  label={t('filters.date.start.date')}
                  selected={tempDateRange.startDate}
                  onChange={(date) =>
                    setTempDateRange({ ...tempDateRange, startDate: date })
                  }
                  maxDate={tempDateRange.endDate || undefined}
                />

                <StyledDatePicker
                  label={t('filters.date.end.date')}
                  selected={tempDateRange.endDate}
                  onChange={(date) =>
                    setTempDateRange({ ...tempDateRange, endDate: date })
                  }
                  minDate={tempDateRange.startDate || undefined}
                />

                <Button
                  variant="contained"
                  onClick={handleApplyCustom}
                  disabled={!tempDateRange.startDate || !tempDateRange.endDate}
                  startIcon={<FilterAltIcon />}
                >
                  {t('filters.date.apply.filter')}
                </Button>
              </Stack>
            </FormControl>
          </>
        )}

        {showClearButton && (
          <Box mt={2}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                handleClear();
                handleClose();
              }}
              fullWidth
            >
              {t('clear')}
            </Button>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default DateFilterBar;
