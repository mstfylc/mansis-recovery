import { Typography, Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  showBackButton?: boolean;
}

function PageHeader({ showBackButton = false }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };
  const { t } = useTranslation();
  return (
    <Box display="flex" alignItems="center" gap={2}>
      {showBackButton && (
        <IconButton onClick={handleBack} sx={{ p: 0 }}>
          <ArrowBackIcon />
        </IconButton>
      )}
      <Box>
        <Typography variant="h3" component="h3" gutterBottom>
          {t('orders.details.title')}
        </Typography>
        <Typography variant="subtitle2">
          {t('orders.details.page.subtitle')}
        </Typography>
      </Box>
    </Box>
  );
}

export default PageHeader;
