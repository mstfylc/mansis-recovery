import { FC } from 'react';
import {
  Card,
  CardHeader,
  Divider,
  Box,
  Grid,
  Typography,
  useTheme,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Warehouse } from '@/types/stock';
import WarehouseTwoToneIcon from '@mui/icons-material/WarehouseTwoTone';
import LocationOnTwoToneIcon from '@mui/icons-material/LocationOnTwoTone';
import QrCodeTwoToneIcon from '@mui/icons-material/QrCodeTwoTone';
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone';
import StatusLabel from '@/components/StatusLabel';
import { FiberManualRecordTwoTone } from '@mui/icons-material';

interface WarehouseInfoCardProps {
  warehouse: Warehouse;
}

const WarehouseInfoCard: FC<WarehouseInfoCardProps> = ({ warehouse }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        title={t('warehouseDetails.warehouseInformation')}
        titleTypographyProps={{ variant: 'h4' }}
      />
      <Divider />
      <Box p={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <WarehouseTwoToneIcon
                sx={{ color: theme.palette.primary.main }}
              />
              <Box flex={1} minWidth={0}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: '0.75rem' }}
                >
                  {t('warehouseDetails.warehouseName')}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="h6" noWrap>
                    {warehouse.name}
                  </Typography>
                  {warehouse.isDefault && (
                    <Chip
                      icon={<StarTwoToneIcon />}
                      label={t('warehouseDetails.default')}
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <QrCodeTwoToneIcon sx={{ color: theme.palette.primary.main }} />
              <Box flex={1} minWidth={0}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: '0.75rem' }}
                >
                  {t('warehouseDetails.warehouseCode')}
                </Typography>
                <Typography variant="h6" noWrap>
                  {warehouse.code}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {warehouse.branch && (
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOnTwoToneIcon
                  sx={{ color: theme.palette.primary.main }}
                />
                <Box flex={1} minWidth={0}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    noWrap
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {t('warehouseDetails.branch')}
                  </Typography>
                  <Typography variant="h6" noWrap>
                    {warehouse.branch.name}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <FiberManualRecordTwoTone
                sx={{ color: theme.palette.primary.main }}
              />
              <Box flex={1} minWidth={0}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                  noWrap
                  sx={{ fontSize: '0.75rem' }}
                >
                  {t('status')}
                </Typography>
                <StatusLabel
                  status={warehouse.isActive ? 'ACTIVE' : 'PASSIVE'}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {warehouse.description && (
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('description')}
            </Typography>
            <Typography variant="body2">{warehouse.description}</Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default WarehouseInfoCard;
