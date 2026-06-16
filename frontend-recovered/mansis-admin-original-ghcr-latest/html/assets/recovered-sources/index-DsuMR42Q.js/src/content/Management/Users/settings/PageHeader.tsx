import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
function PageHeader() {
  const { t } = useTranslation();
  return (
    <>
      <Typography variant="h3" component="h3" gutterBottom>
        {t('user.settings')}
      </Typography>
    </>
  );
}

export default PageHeader;
