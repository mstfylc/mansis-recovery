import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Popover,
  Typography
} from '@mui/material';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  helperText?: string;
}

const ColorPickerField = ({
  label,
  value,
  onChange,
  helperText
}: ColorPickerFieldProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClick = () => {
    setAnchorEl(inputRef.current);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePickerChange = (color: string) => {
    setLocalValue(color);
    onChange(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <TextField
        ref={inputRef}
        label={label}
        value={localValue}
        onChange={handleInputChange}
        fullWidth
        margin="dense"
        size="small"
        helperText={helperText}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  onClick={handleClick}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(localValue)
                      ? localValue
                      : '#CCC',
                    border: '2px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: '0 0 0 2px rgba(0,0,0,0.15)'
                    }
                  }}
                />
              </InputAdornment>
            )
          }
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: { p: 2, borderRadius: 2 }
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label}
        </Typography>
        <HexColorPicker color={localValue} onChange={handlePickerChange} />
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          {localValue}
        </Typography>
      </Popover>
    </Box>
  );
};

export default ColorPickerField;
