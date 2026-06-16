import { Box, Button, Typography, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import type { BranchStock } from '@/types/stock';

interface PageHeaderProps {
  stock: BranchStock | null;
  onExport: () => void;
}

const PageHeader = ({ stock, onExport }: PageHeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 2, width: '100%' }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box>
          <Typography variant="h3" component="h3">
            {stock
              ? t('stock.history.subtitle', {
                  productName: stock.companyProduct.name
                })
              : t('stock.history.title')}
          </Typography>
          {stock && (
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {stock.branch.name} • {stock.warehouse.name}
            </Typography>
          )}
        </Box>
      </Box>

      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={onExport}
        >
          {t('stock.history.export.excel')}
        </Button>
      </Box>
    </Box>
  );
};

export default PageHeader;
