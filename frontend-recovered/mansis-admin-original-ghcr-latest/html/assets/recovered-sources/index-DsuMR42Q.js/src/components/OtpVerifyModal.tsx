import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  styled
} from '@mui/material';

const OtpContainer = styled(Box)(
  ({ theme }) => `
  display: flex;
  gap: ${theme.spacing(1)};
  justify-content: center;
  margin: ${theme.spacing(3, 0)};
`
);

const OtpInput = styled(TextField)(
  ({ theme }) => `
  width: 50px;
  
  & .MuiInputBase-input {
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    padding: ${theme.spacing(1.5)};
  }
`
);

interface OtpVerifyModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (enteredOtp: string) => void;
}

const OtpVerifyModal: React.FC<OtpVerifyModalProps> = ({
  visible,
  onClose,
  onConfirm
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300); // 5 dakika = 300 saniye
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Format helper: 300 -> 5:00
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (visible) {
      setDigits(['', '', '', '', '', '']);
      setCountdown(300); // her açıldığında sıfırla
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible, onClose]);

  const handleChange = (text: string, index: number) => {
    if (/^\d$/.test(text)) {
      const newDigits = [...digits];
      newDigits[index] = text;
      setDigits(newDigits);
      if (index < 5 && inputs.current[index + 1]) {
        inputs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>,
    index: number
  ) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '') {
        if (index > 0 && inputs.current[index - 1]) {
          inputs.current[index - 1]?.focus();
        }
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const newDigits = [...digits];
      for (let i = 0; i < pasteData.length && i < 6; i++) {
        newDigits[i] = pasteData[i];
      }
      setDigits(newDigits);
      const lastIndex = Math.min(pasteData.length, 5);
      inputs.current[lastIndex]?.focus();
    }
  };

  const submitCode = () => {
    const code = digits.join('');
    if (code.length === 6) {
      onConfirm(code);
    }
  };

  const handleClose = () => {
    setDigits(['', '', '', '', '', '']);
    onClose();
  };

  return (
    <Dialog open={visible} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>Telefon Doğrulama</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Lütfen 6 haneli doğrulama kodunu girin
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="primary"
          fontWeight="bold"
          sx={{ mb: 2 }}
        >
          Kalan süre: {formatTime(countdown)}
        </Typography>
        <OtpContainer>
          {digits.map((digit, index) => (
            <OtpInput
              key={index}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              inputRef={(ref) => (inputs.current[index] = ref)}
              inputProps={{
                maxLength: 1,
                inputMode: 'numeric',
                pattern: '[0-9]*',
                autoComplete: 'one-time-code'
              }}
              autoFocus={index === 0}
            />
          ))}
        </OtpContainer>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={submitCode}
          variant="contained"
          size="large"
          disabled={digits.join('').length !== 6}
          sx={{ minWidth: 150 }}
        >
          Doğrula
        </Button>
        <Button
          onClick={handleClose}
          variant="outlined"
          size="large"
          sx={{ minWidth: 150 }}
        >
          İptal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpVerifyModal;
