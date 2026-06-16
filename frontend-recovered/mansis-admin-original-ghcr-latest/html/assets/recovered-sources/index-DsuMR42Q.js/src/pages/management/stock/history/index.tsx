import { useState, useEffect, useCallback, ReactNode } from 'react';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Container,
  Tabs,
  Tab,
  Box,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import StockHistoryTable from '@/content/Management/Stock/History/StockHistoryTable';
import StockHistoryChart from '@/content/Management/Stock/History/StockHistoryChart';
import SummaryCards from './SummaryCards';
import * as stockService from '@/data/stockService';
import { ExportFormat } from '@/types/export';
import { downloadFromUrl } from '@/utils/helpers';

import type {
  BranchStock,
  StockMovement,
  StockMovementType
} from '@/types/stock';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stock-history-tabpanel-${index}`}
      aria-labelledby={`stock-history-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `stock-history-tab-${index}`,
    'aria-controls': `stock-history-tabpanel-${index}`
  };
}

const StockHistoryPage = () => {
  const { stockId } = useParams<{ stockId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentBranch } = useUserViewMode();

  const [stock, setStock] = useState<BranchStock | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [movementType, setMovementType] = useState<StockMovementType | ''>('');
  const [userId, setUserId] = useState<number | undefined>(undefined);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchStock = useCallback(async () => {
    if (!stockId) return;

    try {
      const branchId = currentBranch?.id;
      const stockData = await stockService.getBranchStocks({
        branchId,
        page: 0,
        limit: 1000
      });

      const foundStock = stockData.items.find(
        (s) => s.id === parseInt(stockId)
      );
      if (foundStock) {
        setStock(foundStock);
      } else {
        showNotification(t('stock.not.found'), 'error');
        navigate('/management/stock');
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      showNotification(t('stock.failed.load'), 'error');
    }
  }, [stockId, t, navigate]);

  const fetchMovements = useCallback(async () => {
    if (!stockId) return;

    setLoading(true);
    try {
      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await stockService.getStockMovements({
        branchId: stock?.branchId,
        productId: stock?.companyProductId,
        warehouseId: stock?.warehouseId,
        page,
        limit,
        movementType: movementType || undefined,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        timezone
      });

      setMovements(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching movements:', error);
      showNotification(t('stock.failed.load'), 'error');
    } finally {
      setLoading(false);
    }
  }, [stockId, stock, page, limit, movementType, startDate, endDate, t]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useEffect(() => {
    if (stock) {
      fetchMovements();
    }
  }, [stock, fetchMovements]);

  const handleTabChange = (_event: unknown, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (filters: {
    startDate?: Date | null;
    endDate?: Date | null;
    movementType?: StockMovementType | '';
    userId?: number;
  }) => {
    if (filters.startDate !== undefined) setStartDate(filters.startDate);
    if (filters.endDate !== undefined) setEndDate(filters.endDate);
    if (filters.movementType !== undefined)
      setMovementType(filters.movementType);
    if (filters.userId !== undefined) setUserId(filters.userId);
    setPage(0);
  };

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setMovementType('');
    setUserId(undefined);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleExport = async () => {
    if (!stock || movements.length === 0 || !stockId) {
      showNotification(t('stock.history.export.no.data'), 'warning');
      return;
    }

    try {
      showNotification(t('stock.history.exporting'), 'info');

      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { url, filename } = await stockService.exportStockHistory(
        parseInt(stockId),
        {
          format: ExportFormat.EXCEL,
          startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
          timezone,
          movementType: movementType || undefined
        }
      );

      downloadFromUrl(url, filename);

      showNotification(t('stock.history.export.success'), 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification(t('stock.history.export.error'), 'error');
    }
  };

  if (!stock && !loading) {
    return (
      <Container maxWidth={false}>
        <Alert severity="error">{t('stock.not.found')}</Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('stock.history.title')}</title>
      </Helmet>

      <PageTitleWrapper>
        <PageHeader stock={stock} onExport={handleExport} />
      </PageTitleWrapper>

      <Container
        disableGutters
        maxWidth={false}
        sx={{ maxWidth: '95%', px: 2 }}
      >
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12}>
            <SummaryCards movements={movements} stock={stock} />
          </Grid>

          {/* Tabs */}
          <Grid item xs={12}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="stock history tabs"
              >
                <Tab label={t('stock.history.tab.table')} {...a11yProps(0)} />
                <Tab label={t('stock.history.tab.chart')} {...a11yProps(1)} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <StockHistoryTable
                movements={movements}
                loading={loading}
                total={total}
                page={page}
                limit={limit}
                stock={stock}
                filters={{
                  startDate,
                  endDate,
                  movementType,
                  userId
                }}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <StockHistoryChart
                movements={movements}
                loading={loading}
                stock={stock}
              />
            </TabPanel>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          variant="filled"
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
        >
          <Typography>{snackbarMessage}</Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default StockHistoryPage;
