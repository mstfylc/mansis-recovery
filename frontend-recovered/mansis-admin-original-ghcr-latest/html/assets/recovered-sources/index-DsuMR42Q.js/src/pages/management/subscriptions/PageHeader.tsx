import { Typography, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PageHeader = () => {
  const { t } = useTranslation();

  return (
    <Grid container justifyContent="space-between" alignItems="center">
      <Grid item>
        <Typography variant="h3" component="h3" gutterBottom>
          {t('licensing.subscription.management')}
        </Typography>
        <Typography variant="subtitle2">
          {t('licensing.subscription.management.subtitle')}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default PageHeader;
