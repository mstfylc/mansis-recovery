import React from 'react';
import { TextField, Box, Typography, InputAdornment } from '@mui/material';
import DatePicker from 'react-datepicker';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';
import { registerLocale } from 'react-datepicker';
import { enUS, tr } from 'date-fns/locale';

registerLocale('en', enUS);
registerLocale('tr', tr);

const localeMap = {
  en: enUS,
  tr: tr
};

interface StyledDatePickerProps {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  showTimeSelect?: boolean;
  error?: boolean;
  helperText?: string;
  minDate?: Date;
  maxDate?: Date;
}

const StyledDatePicker: React.FC<StyledDatePickerProps> = ({
  label,
  selected,
  onChange,
  placeholder,
  required = false,
  minDate,
  maxDate,
  showTimeSelect = false,
  error = false,
  helperText
}) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language?.split('-')[0] || 'en';

  const locale = localeMap[currentLanguage] || localeMap.tr;

  const getDateFormat = () => {
    if (!showTimeSelect) {
      switch (currentLanguage) {
        case 'tr':
          return 'd MMMM yyyy';
        case 'en':
        default:
          return 'MMMM d, yyyy';
      }
    } else {
      switch (currentLanguage) {
        case 'tr':
          return 'd MMMM yyyy HH:mm';
        case 'en':
        default:
          return 'MMMM d, yyyy h:mm aa';
      }
    }
  };

  const defaultPlaceholder = showTimeSelect
    ? t('select.date.and.time')
    : t('select.date');

  const handleDateChange = (date: Date | null) => {
    onChange(date);
  };

  return (
    <Box sx={{ mb: 2, mt: 2, width: '100%' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
        {required && ' *'}
      </Typography>
      <DatePicker
        locale={locale}
        selected={selected}
        onChange={handleDateChange}
        showTimeSelect={showTimeSelect}
        timeIntervals={15}
        dateFormat={getDateFormat()}
        placeholderText={placeholder || defaultPlaceholder}
        minDate={minDate}
        maxDate={maxDate}
        customInput={
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            error={error}
            helperText={helperText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {showTimeSelect ? <AccessTimeIcon /> : <CalendarTodayIcon />}
                </InputAdornment>
              )
            }}
          />
        }
      />
    </Box>
  );
};

export default StyledDatePicker;
