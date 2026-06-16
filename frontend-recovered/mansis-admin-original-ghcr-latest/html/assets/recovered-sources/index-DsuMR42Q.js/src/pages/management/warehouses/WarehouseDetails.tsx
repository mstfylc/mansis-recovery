import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Warehouse, WarehouseStatisticsResponse } from '@/types/stock';
import {
  getWarehouseById,
  getWarehouseStatistics
} from '@/data/warehouseService';
import WarehouseInfoCard from '@/content/Management/Warehouses/WarehouseInfoCard';
import WarehouseStatsCards from '@/content/Management/Warehouses/WarehouseStatsCards';
import WarehouseStocksTable from '@/content/Management/Warehouses/WarehouseStocksTable';
import WarehouseDetailsHeader from './WarehouseDetailsHeader';

const WarehouseDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [statistics, setStatistics] =
    useState<WarehouseStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouseDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch warehouse details and statistics in parallel
      const [warehouseData, statsData] = await Promise.all([
        getWarehouseById(Number(id)),
        getWarehouseStatistics(Number(id))
      ]);

      setWarehouse(warehouseData);
      setStatistics(statsData);
    } catch (err: any) {
      console.error('Error fetching warehouse details:', err);
      setError(
        err.response?.data?.message ||
          t('warehouseDetails.errorLoadingWarehouse')
      );
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!id) {
      navigate('/management/warehouses');
      return;
    }

    fetchWarehouseDetails();
  }, [id, navigate, fetchWarehouseDetails]);

  const handleBack = () => {
    navigate('/management/warehouses');
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !warehouse || !statistics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || t('warehouseDetails.warehouseNotFound')}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackTwoToneIcon />}
          onClick={handleBack}
        >
          {t('common.back')}
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {t('warehouseDetails.pageTitle')} - {warehouse.name}
        </title>
      </Helmet>

      <PageTitleWrapper>
        <WarehouseDetailsHeader />
      </PageTitleWrapper>

      <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <WarehouseInfoCard warehouse={warehouse} />
          </Grid>

          <Grid item xs={12}>
            <WarehouseStatsCards statistics={statistics} />
          </Grid>

          <Grid item xs={12}>
            <WarehouseStocksTable
              warehouseId={warehouse.id}
              pageKey={`warehouse-stocks-${warehouse.id}`}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default WarehouseDetails;
