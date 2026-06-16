import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  styled,
  Card
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/data/authService';
import { apiClient } from '@/data/apiService';
import { tokenDecoder } from '@/utils/jwt';
import { setUser } from '@/store/userStore';
import { useTranslation } from 'react-i18next';
import { UserContext } from '@/contexts/UserContext';
import { Alert } from '@mui/material';

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

const LoginCard = styled(Card)(
  ({ theme }) => `
    padding: ${theme.spacing(4)};
    margin: ${theme.spacing(2)};
    width: 100%;
    max-width: 420px;
`
);

const FormContainer = styled('form')(
  ({ theme }) => `
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
`
);

function Login() {
  const navigate = useNavigate();
  const { fetchUserData } = useContext(UserContext);
  const [formData, setFormData] = useState({
    userLoginData: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await authService.login(formData);

      const accessToken = result.accessToken;
      const refreshToken = result.refreshToken;
      if (!accessToken) return;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      apiClient.setAuthHeader(accessToken);

      const decodedToken = tokenDecoder(accessToken);
      const userId = decodedToken?.sub;

      await setUser({
        id: userId,
        settings: {}
      });

      await fetchUserData();

      // Trigger ability update after login
      window.dispatchEvent(new Event('ability-update'));

      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response?.status === 401) {
        setLoginError(t('invalid.credentials'));
      } else {
        setLoginError(t('login.failed'));
      }
    }
  };
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('login')}</title>
      </Helmet>
      <MainContent>
        <Container maxWidth="sm">
          <LoginCard>
            <Typography variant="h4" align="center" mb={2}>
              {t('welcome.to.posanto.admin.dashboard')}
            </Typography>
            <FormContainer onSubmit={handleSubmit}>
              {loginError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {loginError}
                </Alert>
              )}
              <TextField
                fullWidth
                label={t('email.or.phone')}
                value={formData.userLoginData}
                onChange={(e) =>
                  setFormData({ ...formData, userLoginData: e.target.value })
                }
                placeholder={t('email.or.phone.helper')}
                required
              />
              <TextField
                fullWidth
                label={t('password')}
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <Button fullWidth size="large" variant="contained" type="submit">
                {t('login')}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link to="/auth/forgot-password">
                  {t('forgot.password.question')}
                </Link>
              </Box>
            </FormContainer>
          </LoginCard>
        </Container>
      </MainContent>
    </>
  );
}

export default Login;
