import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PageHeader = () => {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h3" component="h3" gutterBottom>
        {t('stampCard.title')}
      </Typography>
      <Typography variant="subtitle2">{t('stampCard.description')}</Typography>
    </>
  );
};

export default PageHeader;
