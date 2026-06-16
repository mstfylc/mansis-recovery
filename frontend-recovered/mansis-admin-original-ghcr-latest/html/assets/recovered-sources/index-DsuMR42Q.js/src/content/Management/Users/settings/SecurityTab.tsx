import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  ListItem,
  List,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  CardContent,
  Avatar,
  Skeleton
} from '@mui/material';
import { authService } from '@/data/authService';
import { userService } from '@/data/userService';
import { useTranslation } from 'react-i18next';
import { useObservable } from '@legendapp/state/react';
import { user$, setUser } from '@/store/userStore';

import { isPossiblePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  StyledPhoneInput,
  PhoneInputError
} from '@/components/StyledPhoneInput';
import { debounce } from '@/utils/helpers';
import { User } from '@/types/User.interface';

function SecurityTab() {
  const { t } = useTranslation();
  const userState = useObservable(user$);
  const [openDialog, setOpenDialog] = useState(false);
  const [phone, setPhone] = useState<string | undefined>('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPhoneError, setShowPhoneError] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const userId = user$.id.get();

  useEffect(() => {
    fetchUserProfile();

    if (userId > 0) {
      setUserLoading(false);
    } else {
      const timer = setTimeout(() => {
        setUserLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setUserLoading(true);
      const result = await userService.getProfile();
      await setUser(result as Partial<User>);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const handlePhoneChange = useCallback(
    debounce((value: string | undefined) => {
      setPhone(value);
      if (value) {
        setShowPhoneError(true);
      }
    }, 500),
    []
  );

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setPhone('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpSent(false);
    setError('');
    setSuccess('');
    setShowPhoneError(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSendOtp = async () => {
    if (!phone || !isPossiblePhoneNumber(phone)) {
      setError(t('please.enter.valid.phone.number'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const otpResult = await authService.sendOtp({ phone });

      if (otpResult.status === 200) {
        setOtpSent(true);
        setSuccess(t('otp.sent.successfully'));
      } else {
        setError(otpResult.message || t('error.sending.otp'));
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError(t('error.sending.otp'));
    } finally {
      setLoading(false);
    }
  };

  const isPhoneValid = () => {
    return phone ? isPossiblePhoneNumber(phone) : false;
  };

  const handleChangePassword = async () => {
    if (
      !phone ||
      (phone && !isPossiblePhoneNumber(phone)) ||
      !otp ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(t('please.fill.all.fields'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('password.min.length'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwords.do.not.match'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const pwResult = await authService.changePassword({
        phone,
        newPassword,
        otp
      });

      if (pwResult.status === 200) {
        setSuccess(t('password.changed.successfully'));
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError(pwResult.message || t('error.changing.password'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(t('error.changing.password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box pb={2}>
          <Typography variant="h3">{t('security')}</Typography>
          <Typography variant="subtitle2">
            {t('change.security.preferences')}
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            {userLoading ? (
              <Box display="flex" alignItems="center">
                <Skeleton
                  variant="circular"
                  width={80}
                  height={80}
                  sx={{ mr: 2 }}
                />
                <Box width="100%">
                  <Skeleton variant="text" width="60%" height={40} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              </Box>
            ) : (
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{ width: 80, height: 80, mr: 2 }}
                  src="/static/images/avatars/default.jpg"
                  alt={`${userState.name?.get() || ''} ${userState.surname?.get() || ''}`}
                />
                <Box>
                  <Typography variant="h4">
                    {`${userState.name?.get() || ''} ${userState.surname?.get() || ''}`}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {userState.email?.get() || '-'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {userState.role?.get()
                      ? t(
                          `roles.${String(userState.role?.get()).toLowerCase()}`,
                          {
                            defaultValue: userState.role?.get() || '-'
                          }
                        )
                      : '-'}
                  </Typography>
                  {userState.company?.get()?.name && (
                    <Typography variant="body2" color="textSecondary">
                      {t('company')}: {userState.company?.get()?.name}
                    </Typography>
                  )}
                  {userState.currentBranch?.get()?.name && (
                    <Typography variant="body2" color="textSecondary">
                      {t('branch')}: {userState.currentBranch?.get()?.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <List>
            <ListItem sx={{ p: 3 }}>
              <Button
                size="large"
                variant="outlined"
                onClick={handleOpenDialog}
              >
                {t('change.password')}
              </Button>
            </ListItem>
          </List>
        </Card>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('change.password')}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('phone')}
            </Typography>
            <StyledPhoneInput
              defaultCountry="TR"
              value={phone}
              onChange={(value) => handlePhoneChange(value)}
              disabled={otpSent}
              placeholder={t('phone')}
              error={
                showPhoneError
                  ? phone && !isPossiblePhoneNumber(phone)
                    ? 'Invalid phone number'
                    : undefined
                  : 'Phone number required'
              }
            />
            {showPhoneError && phone && !isPossiblePhoneNumber(phone) && (
              <PhoneInputError>{t('invalid.phone.number')}</PhoneInputError>
            )}
          </Box>

          {!otpSent ? (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSendOtp}
              disabled={loading || !isPhoneValid()}
              sx={{ mt: 1 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                t('send.verification.code')
              )}
            </Button>
          ) : (
            <>
              <TextField
                margin="dense"
                label={t('verification.code')}
                type="text"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label={t('new.password')}
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label={t('confirm.new.password')}
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            {t('cancel')}
          </Button>
          {otpSent && (
            <Button
              onClick={handleChangePassword}
              color="primary"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t('save')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default SecurityTab;
