import { styled } from '@mui/material/styles';
import { Typography } from '@mui/material';
import PhoneInput from 'react-phone-number-input';

// Custom styled PhoneInput component that extends the base PhoneInput
export const StyledPhoneInput = styled(PhoneInput)(({ theme }) => ({
  width: '100%',
  fontFamily: theme.typography.fontFamily,
  '& .PhoneInputInput': {
    flex: 1,
    padding: '10px 14px',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    fontSize: theme.typography.body1.fontSize,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    height: '56px',
    boxSizing: 'border-box',
    width: '100%',
    transition: theme.transitions.create([
      'border-color',
      'background-color',
      'box-shadow'
    ]),
    '&:focus': {
      borderColor: theme.palette.primary.main,
      outline: 'none'
    },
    '&::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 0.7
    }
  },
  '& .PhoneInputInput[aria-invalid="true"]': {
    borderColor: theme.palette.error.main,
    '&:focus': {
      borderColor: theme.palette.error.main,
      boxShadow: `0 0 0 2px ${theme.palette.error.light}`
    }
  },
  '& .PhoneInputCountry': {
    marginRight: theme.spacing(1),
    alignItems: 'center'
  },
  '& .PhoneInputCountrySelect': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary
  },
  '&:disabled .PhoneInputInput': {
    backgroundColor: theme.palette.action.disabledBackground,
    opacity: theme.palette.action.disabledOpacity,
    pointerEvents: 'none'
  }
}));

// Error text component for phone input
export const PhoneInputError = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: '0.75rem',
  marginTop: theme.spacing(0.5),
  marginLeft: theme.spacing(1.5)
}));
