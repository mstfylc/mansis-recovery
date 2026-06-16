import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import createEmotionCache from './createEmotionCache';
import ThemeProvider from './theme/ThemeProvider';
import router from './router';
import nProgress from 'nprogress';
import 'nprogress/nprogress.css';
import 'react-datepicker/dist/react-datepicker.css';
import { SidebarProvider } from './contexts/SidebarProvider';
import { useTranslation } from 'react-i18next';
import { AbilityProvider } from './contexts/AbilityContext';
import { UserProvider } from './contexts/UserContext';
import { FeatureProvider } from './contexts/FeatureContext';
import { TourProvider } from '@reactour/tour';
import { TourManagerProvider } from './tour/TourManager';
import { SnackbarProvider } from 'notistack';

const clientSideEmotionCache = createEmotionCache();

const configureProgress = () => {
  router.subscribe((state) => {
    if (state.navigation.state === 'loading') {
      nProgress.start();
    } else {
      nProgress.done();
    }
  });
};

function App() {
  useEffect(() => {
    configureProgress();
  }, []);
  const { t } = useTranslation();
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <HelmetProvider>
        <Helmet defaultTitle={t('posanto.admin.dashboard')}>
          <title>{t('posanto.admin.dashboard')}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Helmet>
        <SidebarProvider>
          <ThemeProvider>
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              autoHideDuration={3000}
            >
              <UserProvider>
                <AbilityProvider>
                  <FeatureProvider>
                    <TourProvider
                      steps={[]} // Initial empty steps, will be set by TourManager
                      showCloseButton={true}
                      padding={10}
                      styles={{
                        popover: (base) => ({
                          ...base,
                          '--reactour-accent': '#1976d2',
                          borderRadius: 8
                        }),
                        maskArea: (base) => ({ ...base, rx: 8 }),
                        close: (base) => ({
                          ...base,
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 15,
                          height: 15,
                          color: '#333',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.2)'
                          }
                        })
                      }}
                    >
                      <TourManagerProvider>
                        <CssBaseline />
                        <RouterProvider router={router} />
                      </TourManagerProvider>
                    </TourProvider>
                  </FeatureProvider>
                </AbilityProvider>
              </UserProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </SidebarProvider>
      </HelmetProvider>
    </CacheProvider>
  );
}

export default App;
