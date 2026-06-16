import { Typography, Box, Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  showBackButton?: boolean;
  onAddPlan?: () => void;
}

function PageHeader({ showBackButton = false, onAddPlan }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };
  const { t } = useTranslation();
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
    >
      <Box display="flex" alignItems="center" gap={2}>
        {showBackButton && (
          <IconButton onClick={handleBack} sx={{ p: 0 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            {t('licensing.plans.management')}
          </Typography>
          <Typography variant="subtitle2">
            {t('licensing.plans.description')}
          </Typography>
        </Box>
      </Box>
      {onAddPlan && (
        <Button
          variant="contained"
          startIcon={<AddTwoToneIcon />}
          onClick={onAddPlan}
        >
          {t('licensing.plan.create.custom')}
        </Button>
      )}
    </Box>
  );
}

export default PageHeader;
