import { Typography, IconButton, Tooltip, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import { Link } from 'react-router-dom';

function DetailsPageHeader() {
  const { t } = useTranslation();

  return (
    <Box display="flex" alignItems="center">
      <Tooltip arrow placement="top" title={t('back')}>
        <IconButton
          component={Link}
          to="/management/branches"
          color="primary"
          sx={{ p: 1, mr: 2 }}
        >
          <ArrowBackTwoToneIcon />
        </IconButton>
      </Tooltip>
      <Box>
        <Typography variant="h3" component="h3" gutterBottom>
          {t('branch.details')}
        </Typography>
        <Typography variant="subtitle2">
          {t('branch.details.description')}
        </Typography>
      </Box>
    </Box>
  );
}

export default DetailsPageHeader;
