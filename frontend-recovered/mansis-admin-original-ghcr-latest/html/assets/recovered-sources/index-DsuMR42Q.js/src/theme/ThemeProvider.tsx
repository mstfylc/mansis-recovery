import { FC, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { themeCreator } from './base';
import { StylesProvider } from '@mui/styles';
import { ThemeContext } from './ThemeContext';
import { useTranslation } from 'react-i18next';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const cache = createCache({
  key: 'mui',
  prepend: true
});

const ThemeProviderWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState('NebulaFighterTheme');
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  useEffect(() => {
    const curThemeName =
      window.localStorage.getItem('appTheme') ?? 'NebulaFighterTheme';
    setThemeName(curThemeName);
  }, []);

  const theme = useMemo(() => {
    return themeCreator(themeName, currentLanguage);
  }, [themeName, currentLanguage]);

  const handleSetThemeName = (name: string): void => {
    window.localStorage.setItem('appTheme', name);
    setThemeName(name);
  };

  const contextValue = useMemo(
    () => ({
      theme: themeName,
      setTheme: handleSetThemeName
    }),
    [themeName]
  );

  return (
    <CacheProvider value={cache}>
      <StylesProvider injectFirst>
        <ThemeContext.Provider value={contextValue}>
          <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
        </ThemeContext.Provider>
      </StylesProvider>
    </CacheProvider>
  );
};

export default ThemeProviderWrapper;
