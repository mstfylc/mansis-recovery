import { FC, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  alpha,
  lighten,
  useTheme,
  Snackbar,
  Alert as MuiAlert,
  Typography
} from '@mui/material';

import Sidebar from './Sidebar';
import Header from './Header';
import Footer from '@/components/Footer';
import TourFAB from '@/components/TourFAB';
import ChangelogFAB from '@/components/ChangelogFAB';
import ChangelogDrawer from '@/components/ChangelogDrawer';
import { ChangelogProvider } from '@/contexts/ChangelogContext';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { SmsQuotaBanner } from '@/components/SmsQuotaBanner';
import { API_ERROR_EVENT } from '@/data/apiService';
import { useAdminPush } from '@/hooks/useAdminPush';

const SidebarLayout: FC = () => {
  const theme = useTheme();
  useAdminPush();

  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<
    'error' | 'warning' | 'info' | 'success'
  >('error');

  // Listen for API error events
  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<{
        message: string;
        severity: string;
      }>;
      setAlertSeverity(
        customEvent.detail.severity as 'error' | 'warning' | 'info' | 'success'
      );
      setErrorMessage(customEvent.detail.message);
      setShowError(true);
    };

    window.addEventListener(API_ERROR_EVENT, handleApiError);

    return () => {
      window.removeEventListener(API_ERROR_EVENT, handleApiError);
    };
  }, []);

  return (
    <ChangelogProvider>
      <Box
        sx={{
          flex: 1,
          height: '100%',
          '.MuiPageTitle-wrapper': {
            background:
              theme.palette.mode === 'dark'
                ? theme.colors.alpha.trueWhite[5]
                : theme.colors.alpha.white[50],
            marginBottom: `${theme.spacing(4)}`,
            boxShadow:
              theme.palette.mode === 'dark'
                ? `0 1px 0 ${alpha(
                    lighten(theme.colors.primary.main, 0.7),
                    0.15
                  )}, 0px 2px 4px -3px rgba(0, 0, 0, 0.2), 0px 5px 12px -4px rgba(0, 0, 0, .1)`
                : `0px 2px 4px -3px ${alpha(
                    theme.colors.alpha.black[100],
                    0.1
                  )}, 0px 5px 12px -4px ${alpha(
                    theme.colors.alpha.black[100],
                    0.05
                  )}`
          }
        }}
      >
        <Header />
        <Sidebar />
        <Box
          component="main"
          sx={{
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            pt: `${theme.header.height}`,
            width: 'calc(100% - ${theme.sidebar.width})',
            marginLeft: { xs: 0, lg: theme.sidebar.width },
            minHeight: '100vh'
          }}
        >
          <SubscriptionBanner />
          <SmsQuotaBanner />
          <Box sx={{ flex: 1 }}>
            <Outlet />
          </Box>
          <Footer />
        </Box>
      </Box>

      <TourFAB />
      <ChangelogFAB />
      <ChangelogDrawer />

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <MuiAlert
          variant="filled"
          severity={alertSeverity}
          onClose={() => setShowError(false)}
        >
          <Typography>{errorMessage}</Typography>
        </MuiAlert>
      </Snackbar>
    </ChangelogProvider>
  );
};

export default SidebarLayout;
