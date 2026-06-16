import { Button, Tooltip } from '@mui/material';
import { PointOfSale as PointOfSaleIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const POS_URL = 'https://pos.posanto.com/';

function POSToggleButton() {
  const { t } = useTranslation();
  const handleOpenPOS = () => {
    window.open(POS_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Tooltip title={t('goto.pos')} arrow>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PointOfSaleIcon />}
        onClick={handleOpenPOS}
        sx={{
          mr: 1,
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.main',
            color: 'white'
          }
        }}
      >
        POS
      </Button>
    </Tooltip>
  );
}

export default POSToggleButton;
