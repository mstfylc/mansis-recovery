import { Typography, IconButton, Tooltip, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import { Link } from 'react-router-dom';

const PageHeader = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" alignItems="center">
      <Tooltip arrow placement="top" title={t('back.to.dashboard')}>
        <IconButton
          component={Link}
          to="/"
          color="primary"
          sx={{ p: 1, mr: 2 }}
        >
          <ArrowBackTwoToneIcon />
        </IconButton>
      </Tooltip>

      <Box>
        <Typography variant="h3" component="h3" gutterBottom>
          {t('company.product.settings')}
        </Typography>
        <Typography variant="subtitle2">
          {t('company.product.settings.subtitle')}
        </Typography>
      </Box>
    </Box>
  );
};

export default PageHeader;
