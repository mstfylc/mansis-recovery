import React, { useState, useEffect, forwardRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export interface NumericInputProps
  extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  /** Current numeric value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Allow decimal numbers (default: false for integers only) */
  allowDecimals?: boolean;
  /** Allow negative numbers (default: false) */
  allowNegative?: boolean;
  /** Minimum value allowed */
  min?: number;
  /** Maximum value allowed */
  max?: number;
  /** Number of decimal places (only used when allowDecimals is true) */
  decimalPlaces?: number;
  /** Custom validation function */
  customValidator?: (value: number) => boolean;
  /** Show value as empty when it's 0 (default: true) */
  showEmptyForZero?: boolean;
  /** Placeholder text when field is empty */
  emptyPlaceholder?: string;
}

const NumericInput = forwardRef<HTMLDivElement, NumericInputProps>(
  (
    {
      value,
      onChange,
      allowDecimals = false,
      allowNegative = false,
      min,
      max,
      decimalPlaces = 2,
      customValidator,
      showEmptyForZero = true,
      emptyPlaceholder = '0',
      onBlur,
      placeholder,
      ...textFieldProps
    },
    ref
  ) => {
    // Local state for display value (what user sees)
    const [displayValue, setDisplayValue] = useState<string>('');

    // Update display value when prop value changes
    useEffect(() => {
      if (value === 0 && showEmptyForZero) {
        setDisplayValue('');
      } else {
        setDisplayValue(value.toString());
      }
    }, [value, showEmptyForZero]);

    // Validate if the value is within bounds
    const isWithinBounds = (numValue: number): boolean => {
      if (min !== undefined && numValue < min) return false;
      if (max !== undefined && numValue > max) return false;
      return true;
    };

    // Get the regex pattern for validation
    const getValidationRegex = (): RegExp => {
      if (allowDecimals) {
        if (allowNegative) {
          return /^-?\d*\.?\d*$/; // Allow negative decimals
        } else {
          return /^\d*\.?\d*$/; // Allow positive decimals only
        }
      } else {
        if (allowNegative) {
          return /^-?\d*$/; // Allow negative integers
        } else {
          return /^\d*$/; // Allow positive integers only
        }
      }
    };

    // Handle input change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;

      // Allow empty string for clearing
      if (inputValue === '') {
        setDisplayValue('');
        return;
      }

      // Validate against regex pattern
      const regex = getValidationRegex();
      if (!regex.test(inputValue)) {
        return; // Don't update if invalid format
      }

      // Handle decimal places limitation
      if (allowDecimals && decimalPlaces !== undefined) {
        const parts = inputValue.split('.');
        if (parts[1] && parts[1].length > decimalPlaces) {
          return; // Don't allow more decimal places than specified
        }
      }

      // Parse the number
      let numValue: number;
      if (allowDecimals) {
        numValue = parseFloat(inputValue);
      } else {
        numValue = parseInt(inputValue, 10);
      }

      // Check if parsing was successful
      if (!isNaN(numValue)) {
        // Check bounds
        if (!isWithinBounds(numValue)) {
          return; // Don't update if out of bounds
        }

        // Check custom validator
        if (customValidator && !customValidator(numValue)) {
          return; // Don't update if custom validation fails
        }

        // Update display value and notify parent
        setDisplayValue(inputValue);
        onChange(numValue);
      } else {
        // For cases like "." or "-" which are valid intermediate states
        setDisplayValue(inputValue);
      }
    };

    // Handle blur event
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      // When user finishes editing, ensure we have a valid number
      if (displayValue === '' || displayValue === '-' || displayValue === '.') {
        onChange(0);
        setDisplayValue(showEmptyForZero ? '' : '0');
      } else {
        // Ensure the final value is properly formatted
        let finalValue: number;
        if (allowDecimals) {
          finalValue = parseFloat(displayValue);
        } else {
          finalValue = parseInt(displayValue, 10);
        }

        if (!isNaN(finalValue)) {
          // Apply bounds if necessary
          if (min !== undefined && finalValue < min) {
            finalValue = min;
          }
          if (max !== undefined && finalValue > max) {
            finalValue = max;
          }

          onChange(finalValue);

          // Update display value to the final formatted value
          if (finalValue === 0 && showEmptyForZero) {
            setDisplayValue('');
          } else {
            setDisplayValue(finalValue.toString());
          }
        }
      }

      // Call parent onBlur if provided
      if (onBlur) {
        onBlur(event);
      }
    };

    // Get appropriate input mode for mobile keyboards
    const getInputMode = (): 'numeric' | 'decimal' => {
      return allowDecimals ? 'decimal' : 'numeric';
    };

    return (
      <TextField
        {...textFieldProps}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={
          displayValue === '' ? placeholder || emptyPlaceholder : placeholder
        }
        slotProps={{
          input: {
            inputMode: getInputMode()
          }
        }}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';

export default NumericInput;
