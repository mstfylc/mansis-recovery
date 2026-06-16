import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

function PageHeader() {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h3" component="h3" gutterBottom>
        {t('company.management')}
      </Typography>
      <Typography variant="subtitle2">{t('company.page.subtitle')}</Typography>
    </>
  );
}

export default PageHeader;
