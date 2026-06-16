import { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  MenuItem,
  Select,
  Typography,
  Box,
  styled,
  useTheme,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import LanguageTwoToneIcon from '@mui/icons-material/LanguageTwoTone';
import { changeLanguage } from '@/i18n';

type LanguageOption = {
  language: string;
  code: string;
};

const LanguageSelectWrapper = styled(Select<string>)(
  ({ theme }) => `
    background: ${theme.colors.alpha.white[100]};
    border-radius: ${theme.general.borderRadius};
    
    .MuiSelect-select {
      padding: 8px;
      padding-right: 28px;
      display: flex;
      align-items: center;
    }
    
    .MuiSvgIcon-root {
      color: ${theme.colors.primary.main};
    }
  `
);

const LanguageSelector = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  // Normalize detected language to a supported code (e.g. en-US → en)
  const normalizeLanguage = (lang: string): string => {
    const base = lang.split('-')[0];
    return ['tr', 'en'].includes(base) ? base : 'en';
  };

  // Set the initial language from i18next's detected or default language
  const [language, setLanguage] = useState(() =>
    normalizeLanguage(i18next.language)
  );

  const languageOptions: LanguageOption[] = [
    {
      language: t('turkish'),
      code: 'tr'
    },
    {
      language: t('english'),
      code: 'en'
    }
  ];

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    changeLanguage(selectedLanguage);
  };

  useEffect(() => {
    document.body.dir = i18n.dir(); //sets the body to ltr or rtl
  }, [i18n, i18n.language]);

  return (
    <Box>
      <LanguageSelectWrapper
        id="language"
        value={language}
        onChange={handleLanguageChange}
        size="small"
        variant="outlined"
        sx={{ minWidth: 120 }}
        startAdornment={
          <InputAdornment position="start" sx={{ margin: 0 }}>
            <LanguageTwoToneIcon
              sx={{
                color: theme.colors.primary.main,
                fontSize: theme.typography.pxToRem(18)
              }}
            />
          </InputAdornment>
        }
      >
        {languageOptions.map(({ language, code }, key) => (
          <MenuItem value={code} key={key}>
            <Typography variant="body2">{language}</Typography>
          </MenuItem>
        ))}
      </LanguageSelectWrapper>
    </Box>
  );
};

export default LanguageSelector;
