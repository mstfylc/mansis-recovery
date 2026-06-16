import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CampaignUsagesHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      sx={{ mb: 2 }}
    >
      <Box display="flex" alignItems="center">
        <ArrowBackIcon
          sx={{ mr: 1, cursor: 'pointer' }}
          onClick={() => navigate(-1)}
        />
        <Typography variant="h3" component="h3">
          {t('campaign.usages.title')}
        </Typography>
      </Box>
    </Box>
  );
};

export default CampaignUsagesHeader;
