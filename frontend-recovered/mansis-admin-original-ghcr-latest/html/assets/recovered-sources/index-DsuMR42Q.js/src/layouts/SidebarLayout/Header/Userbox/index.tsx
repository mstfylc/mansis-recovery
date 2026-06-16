import { useRef, useState, useEffect } from 'react';
import { useObservable } from '@legendapp/state/react';
import { user$, setUser } from '@/store/userStore';

import { Link } from 'react-router-dom';

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Hidden,
  lighten,
  List,
  ListItem,
  ListItemText,
  Popover,
  Typography
} from '@mui/material';

import { styled } from '@mui/material/styles';
import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsApplicationsTwoToneIcon from '@mui/icons-material/SettingsApplicationsTwoTone';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { clearLegendState } from '@/store';
import { authService } from '@/data/authService';
import { userService } from '@/data/userService';
import { notificationService } from '@/data/notificationService';
import { getFCMToken } from '@/utils/firebase';
import { User } from '@/types/User.interface';
import { useTranslation } from 'react-i18next';
import { Role } from '@/enums/role';

const UserBoxButton = styled(Button)(
  ({ theme }) => `
        padding-left: ${theme.spacing(1)};
        padding-right: ${theme.spacing(1)};
`
);

const MenuUserBox = styled(Box)(
  ({ theme }) => `
        background: ${theme.colors.alpha.black[5]};
        padding: ${theme.spacing(2)};
`
);

const UserBoxText = styled(Box)(
  ({ theme }) => `
        text-align: left;
        padding-left: ${theme.spacing(1)};
        max-width: 100px;
        overflow: hidden;
        
        ${theme.breakpoints.up('lg')} {
          max-width: 200px;
        }
        
        ${theme.breakpoints.up('xl')} {
          max-width: none;
        }
`
);

const UserBoxLabel = styled(Typography)(
  ({ theme }) => `
        font-weight: ${theme.typography.fontWeightBold};
        color: ${theme.palette.secondary.main};
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
`
);

const UserBoxDescription = styled(Typography)(
  ({ theme }) => `
        color: ${lighten(theme.palette.secondary.main, 0.5)};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
`
);

function HeaderUserbox() {
  const globalUserState = useObservable(user$);
  const ref = useRef(null);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const defaultAvatar = '/static/images/avatars/default.jpg';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const result = await userService.getProfile();
      await setUser(result as Partial<User>);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };
  const { t } = useTranslation();
  return (
    <>
      <UserBoxButton color="secondary" ref={ref} onClick={handleOpen}>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <>
            <Avatar
              variant="rounded"
              alt={globalUserState.name?.get()}
              src={defaultAvatar}
            />
            <Hidden mdDown>
              <UserBoxText>
                <UserBoxLabel variant="body1">
                  {`${globalUserState.name?.get()} ${globalUserState.surname?.get()}`}
                </UserBoxLabel>
                <UserBoxDescription variant="body2">
                  {globalUserState.role?.get()
                    ? t(`roles.${globalUserState.role.get().toLowerCase()}`)
                    : ''}
                </UserBoxDescription>
              </UserBoxText>
            </Hidden>
          </>
        )}
      </UserBoxButton>
      <Popover
        anchorEl={ref.current}
        onClose={handleClose}
        open={isOpen}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuUserBox sx={{ minWidth: 210 }} display="flex">
          <Avatar
            variant="rounded"
            alt={`${globalUserState.name?.get()} ${globalUserState.surname?.get()}`}
            src={defaultAvatar}
          />
          <UserBoxText>
            <UserBoxLabel variant="body1">
              {`${globalUserState.name?.get()} ${globalUserState.surname?.get()}`}
            </UserBoxLabel>
            <UserBoxDescription variant="body2">
              {globalUserState.role?.get()
                ? t(`roles.${globalUserState.role.get().toLowerCase()}`)
                : ''}
            </UserBoxDescription>
            {(() => {
              const role = globalUserState.role?.get();
              if (role === Role.COMPANY_ADMIN || role === Role.SUPER_ADMIN) {
                return (
                  <Typography variant="body2" color="textSecondary">
                    {globalUserState.company?.get()?.name}
                  </Typography>
                );
              } else if (role === Role.BRANCH_ADMIN) {
                return (
                  <Typography variant="body2" color="textSecondary">
                    {globalUserState.currentBranch?.get()?.name}
                  </Typography>
                );
              }
              return null;
            })()}
          </UserBoxText>
        </MenuUserBox>
        <Divider sx={{ mb: 0 }} />
        <List sx={{ p: 1 }} component="nav">
          {/* <ListItem component={Link} to="/management/profile">
            <AccountBoxTwoToneIcon fontSize="small" />
            <ListItemText primary={t('my.profile')} />
          </ListItem>
          <ListItem component={Link} to="/applications/messenger">
            <InboxTwoToneIcon fontSize="small" />
            <ListItemText primary="Messenger" />
          </ListItem> */}
          <ListItem component={Link} to="/management/profile/settings">
            <AccountTreeTwoToneIcon fontSize="small" sx={{ mr: 1 }} />
            <ListItemText primary={t('account.settings')} />
          </ListItem>

          {globalUserState.role?.get() === Role.BRANCH_ADMIN && (
            <ListItem
              component={Link}
              to="/settings/subscription"
              onClick={handleClose}
            >
              <WorkspacePremiumIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText
                primary={t('licensing.subscription.mySubscription')}
              />
            </ListItem>
          )}

          {globalUserState.role?.get() === Role.BRANCH_ADMIN &&
            globalUserState.currentBranch?.get()?.id && (
              <ListItem
                component={Link}
                to={`/management/branches/${globalUserState.currentBranch?.get()?.id}`}
                onClick={handleClose}
              >
                <StorefrontIcon fontSize="small" sx={{ mr: 1 }} />
                <ListItemText primary={t('branch.details')} />
              </ListItem>
            )}

          {globalUserState.role?.get() === Role.COMPANY_ADMIN && (
            <ListItem
              component={Link}
              to="/management/company-products/settings"
              onClick={handleClose}
            >
              <SettingsApplicationsTwoToneIcon
                fontSize="small"
                sx={{ mr: 1 }}
              />
              <ListItemText primary={t('company.product.settings')} />
            </ListItem>
          )}
        </List>
        <Divider />
        <Box sx={{ m: 1 }}>
          <Button
            color="primary"
            fullWidth
            onClick={async () => {
              try {
                // Delete FCM token before logout so the server stops sending push
                try {
                  const fcmToken = await getFCMToken();
                  if (fcmToken) {
                    await notificationService.deleteFcmToken(fcmToken);
                  }
                } catch {
                  // FCM cleanup failure should not block logout
                }

                await authService.logout();
                const appTheme = localStorage.getItem('appTheme');
                const language = localStorage.getItem('i18nextLng');

                clearLegendState();

                localStorage.clear();

                if (appTheme) localStorage.setItem('appTheme', appTheme);
                if (language) localStorage.setItem('i18nextLng', language);

                // Trigger ability update before redirect
                window.dispatchEvent(new Event('ability-update'));

                // Small delay to ensure event is processed
                setTimeout(() => {
                  window.location.href = '/auth/login';
                }, 100);
              } catch (error) {
                console.error('Error during logout:', error);
                // Even if API call fails, we should still clear states and redirect
                const appTheme = localStorage.getItem('appTheme');
                const language = localStorage.getItem('i18nextLng');
                clearLegendState();
                localStorage.clear();
                if (appTheme) localStorage.setItem('appTheme', appTheme);
                if (language) localStorage.setItem('i18nextLng', language);

                // Trigger ability update before redirect
                window.dispatchEvent(new Event('ability-update'));

                setTimeout(() => {
                  window.location.href = '/auth/login';
                }, 100);
              }
            }}
          >
            <LockOpenTwoToneIcon sx={{ mr: 1 }} />
            {t('logout')}
          </Button>
        </Box>
      </Popover>
    </>
  );
}

export default HeaderUserbox;
