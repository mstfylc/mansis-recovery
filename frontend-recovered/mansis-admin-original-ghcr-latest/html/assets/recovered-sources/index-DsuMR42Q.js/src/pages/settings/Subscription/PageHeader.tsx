import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

function PageHeader() {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h3" component="h3" gutterBottom>
        {t('licensing.subscription.title')}
      </Typography>
      <Typography variant="subtitle2">
        {t('licensing.subscription.description')}
      </Typography>
    </>
  );
}

export default PageHeader;
