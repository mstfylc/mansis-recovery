import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

function SettingsPageHeader() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h3" component="h3" gutterBottom>
        {t('loyalty.settings.title')}
      </Typography>
      <Typography variant="subtitle2">
        {t('loyalty.settings.description')}
      </Typography>
    </Box>
  );
}

export default SettingsPageHeader;
