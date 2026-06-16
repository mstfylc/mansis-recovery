import { Typography, Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function PageHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton onClick={handleBack} sx={{ p: 0 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            {t('product.details')}
          </Typography>
          <Typography variant="subtitle2">
            {t('product.management.subtitle')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default PageHeader;
