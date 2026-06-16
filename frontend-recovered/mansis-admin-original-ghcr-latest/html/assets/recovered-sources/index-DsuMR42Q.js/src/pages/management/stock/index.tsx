import { useState, useCallback, useEffect } from 'react';
import { Grid, Snackbar, Alert, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import StockTableCollapsible from '@/content/Management/Stock/StockTableCollapsible';
import * as stockService from '@/data/stockService';
import type { BranchStock } from '@/types/stock';
import InitializeStockDialog from '@/components/StockDialogs/InitializeStockDialog';
import AddStockDialog from '@/components/StockDialogs/AddStockDialog';
import DeductStockDialog from '@/components/StockDialogs/DeductStockDialog';
import AdjustStockDialog from '@/components/StockDialogs/AdjustStockDialog';
import TransferStockDialog from '@/components/StockDialogs/TransferStockDialog';
import BatchStatusDialog from '@/components/StockDialogs/BatchStatusDialog';
import { Filters } from '@/types/Filters';
import { useStockSSE } from '@/hooks/useStockSSE';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const StockManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentBranch } = useUserViewMode();

  const [stocks, setStocks] = useState<BranchStock[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    page: 0,
    limit: 25,
    lowStockOnly: false,
    branchId: undefined,
    warehouseId: undefined
  });

  // Dialog states
  const [selectedStock, setSelectedStock] = useState<BranchStock | null>(null);
  const [initializeDialogOpen, setInitializeDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deductDialogOpen, setDeductDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [batchStatusDialogOpen, setBatchStatusDialogOpen] = useState(false);

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const response = await stockService.getBranchStocks({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        lowStockOnly: filters.lowStockOnly,
        categoryId: filters.categoryId,
        branchId: filters.branchId || branchId,
        warehouseId: filters.warehouseId
      });

      setStocks(response.items);
      setTotal(response.total);
    } catch (error) {
      showNotification(t('stock.failed.load'), 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters, t, currentBranch]);

  const { isConnected } = useStockSSE({
    enabled: true,
    branchId: filters.branchId || null,
    onStockUpdate: (event) => {
      fetchStocks();
      showNotification(
        t('stock.updated', {
          name: event.productName,
          quantity: event.newQuantity
        }),
        'success'
      );
    },
    onLowStock: (event) => {
      const severity = event.severity === 'CRITICAL' ? 'error' : 'warning';
      showNotification(
        t('stock.low.alert', {
          name: event.productName,
          quantity: event.currentQuantity,
          unit: event.unit
        }),
        severity
      );
      fetchStocks();
    },
    onTransfer: (event) => {
      showNotification(
        t('stock.transferred', {
          name: event.payload.productName,
          quantity: event.payload.quantity,
          from: event.payload.fromBranchName,
          to: event.payload.toBranchName
        }),
        'success'
      );
      fetchStocks();
    }
  });

  const handleFilterChange = (newFilters: Filters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters
    }));
  };

  useEffect(() => {
    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddStock = (stock: BranchStock) => {
    setSelectedStock(stock);
    setAddDialogOpen(true);
  };

  const handleDeductStock = (stock: BranchStock) => {
    setSelectedStock(stock);
    setDeductDialogOpen(true);
  };

  const handleAdjustStock = (stock: BranchStock) => {
    setSelectedStock(stock);
    setAdjustDialogOpen(true);
  };

  const handleTransferStock = (stock: BranchStock) => {
    setSelectedStock(stock);
    setTransferDialogOpen(true);
  };

  const handleBatchStatus = (stock: BranchStock) => {
    setSelectedStock(stock);
    setBatchStatusDialogOpen(true);
  };

  const handleViewHistory = (stock: BranchStock) => {
    navigate(`/management/stock/${stock.id}/history`);
  };

  const handleInitializeStock = () => {
    setInitializeDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{t('stock.management')}</title>
      </Helmet>

      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <StockTableCollapsible
            stocks={stocks}
            loading={loading}
            totalCount={total}
            isConnected={isConnected}
            onFilterChange={handleFilterChange}
            onInitializeStock={handleInitializeStock}
            onAddStock={handleAddStock}
            onDeductStock={handleDeductStock}
            onAdjustStock={handleAdjustStock}
            onTransferStock={handleTransferStock}
            onBatchStatus={handleBatchStatus}
            onViewHistory={handleViewHistory}
            onRefreshData={fetchStocks}
            pageKey="stock"
          />
        </Grid>
      </Grid>
      <InitializeStockDialog
        open={initializeDialogOpen}
        onClose={() => setInitializeDialogOpen(false)}
        onSuccess={(message, severity) => {
          showNotification(message, severity);
          fetchStocks();
        }}
      />

      {selectedStock && (
        <>
          <AddStockDialog
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            stock={selectedStock}
            onSuccess={(message, severity) => {
              showNotification(message, severity);
              fetchStocks();
            }}
          />
          <DeductStockDialog
            open={deductDialogOpen}
            onClose={() => setDeductDialogOpen(false)}
            stock={selectedStock}
            onSuccess={(message, severity) => {
              showNotification(message, severity);
              fetchStocks();
            }}
          />
          <AdjustStockDialog
            open={adjustDialogOpen}
            onClose={() => setAdjustDialogOpen(false)}
            stock={selectedStock}
            onSuccess={(message, severity) => {
              showNotification(message, severity);
              fetchStocks();
            }}
          />
          <TransferStockDialog
            open={transferDialogOpen}
            onClose={() => setTransferDialogOpen(false)}
            stock={selectedStock}
            onSuccess={(message, severity) => {
              showNotification(message, severity);
              fetchStocks();
            }}
          />
          {selectedStock.batch && (
            <BatchStatusDialog
              open={batchStatusDialogOpen}
              onClose={() => setBatchStatusDialogOpen(false)}
              stock={selectedStock}
              onSuccess={(message, severity) => {
                showNotification(message, severity);
                fetchStocks();
              }}
            />
          )}
        </>
      )}

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

export default StockManagement;
