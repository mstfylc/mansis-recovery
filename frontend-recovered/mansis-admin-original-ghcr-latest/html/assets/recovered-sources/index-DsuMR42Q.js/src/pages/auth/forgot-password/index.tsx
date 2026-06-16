import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  styled,
  Card,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/data/authService';
import { useTranslation } from 'react-i18next';
import OtpVerifyModal from '@/components/OtpVerifyModal';

const MainContent = styled(Box)(
  () => `
    height: 100%;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 50px;
`
);

const ForgotPasswordCard = styled(Card)(
  ({ theme }) => `
    padding: ${theme.spacing(4)};
    margin: ${theme.spacing(2)};
    width: 100%;
    max-width: 420px;
`
);

function ForgotPassword() {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isChangeable, setIsChangeable] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const otpResult = await authService.sendOtp({ phone });

      if (otpResult.status !== 200) {
        setError(otpResult.message);
        return;
      }

      setOtpCode(otpResult.otp ?? '');
      setShowOtpModal(true);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    try {
      setLoading(true);
      const result = await authService.changePassword({
        phone: phone,
        newPassword: newPassword,
        otp: otpCode
      });

      if (result.status !== 200) {
        setError(result.message);
        setLoading(false);
        return;
      }

      setSuccessMessage('Şifreniz başarıyla güncellendi.');
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  const handleOtpConfirm = async (enteredCode: string) => {
    if (enteredCode === otpCode) {
      const fpResult = await authService.forgotPassword({ phone: phone });
      if (fpResult.status !== 200) {
        setError(fpResult.message);
        return;
      }

      if (fpResult.isExists === false) {
        setError('Bu telefon numarası sistemde kayıtlı değil.');
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
        return;
      }

      setShowOtpModal(false);
      setIsChangeable(true);
    } else {
      setError('Girdiğiniz kod hatalı. Lütfen tekrar deneyin.');
    }
  };
  return (
    <>
      <Helmet>
        <title>{t('forgot.password')}</title>
      </Helmet>
      <MainContent>
        <Container maxWidth="sm">
          <ForgotPasswordCard>
            <Typography variant="h4" align="center" gutterBottom>
              Şifremi Unuttum
            </Typography>

            {!isChangeable && (
              <>
                <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                  Telefon numaranızı girerek doğrulama kodu alın
                </Typography>
                <TextField
                  fullWidth
                  label="Telefon Numarası"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
                </Button>
              </>
            )}

            {isChangeable && (
              <>
                <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                  Yeni şifrenizi belirleyin
                </Typography>
                <TextField
                  fullWidth
                  label="Yeni Şifre"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Yeni Şifre (Tekrar)"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={loading}
                >
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Değiştir'}
                </Button>
              </>
            )}

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/auth/login">{t('back.to.login')}</Link>
            </Box>
          </ForgotPasswordCard>
        </Container>
      </MainContent>

      <OtpVerifyModal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onConfirm={handleOtpConfirm}
      />

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <MuiAlert
          variant="filled"
          severity="success"
          onClose={() => setShowSuccess(false)}
        >
          <Typography>{successMessage}</Typography>
        </MuiAlert>
      </Snackbar>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(undefined)}
      >
        <MuiAlert
          variant="filled"
          severity="error"
          onClose={() => setError(undefined)}
        >
          <Typography>{error}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
}

export default ForgotPassword;
