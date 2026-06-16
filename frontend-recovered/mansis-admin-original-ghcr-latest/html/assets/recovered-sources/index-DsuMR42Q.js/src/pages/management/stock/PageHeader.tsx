import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

function PageHeader() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h3" component="h3" gutterBottom>
        {t('stock.management')}
      </Typography>
      <Typography variant="subtitle2">
        {t('stock.management.subtitle')}
      </Typography>
    </Box>
  );
}

export default PageHeader;
