import { useState, useCallback } from 'react';
import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import WarehousesTable from '@/content/Management/Warehouses/WarehousesTable';
import * as warehouseService from '@/data/warehouseService';
import type { Warehouse } from '@/types/stock';
import WarehouseDialog from '@/components/WarehouseDialogs/WarehouseDialog';
import { Filters } from '@/types/Filters';
import { transformFiltersToApiParams } from '@/utils/apiUtils';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { getWarehouseErrorMessage } from '@/utils/errorHandlers';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const WarehouseManagement = () => {
  const { t } = useTranslation();
  const { currentBranch } = useUserViewMode();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<number | null>(
    null
  );

  const fetchWarehouses = useCallback(
    async (filters?: Filters) => {
      try {
        setLoading(true);
        const params = transformFiltersToApiParams(filters);
        const branchId = currentBranch?.id;
        const response: { items: Warehouse[]; total: number } =
          await warehouseService.getWarehouses({
            ...params,
            ...(branchId && { branchId })
          });
        setWarehouses(response.items);
        setTotalCount(response.total);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setLoading(false);
      }
    },
    [currentBranch]
  );

  const handleFilterChange = (filters: Filters) => {
    fetchWarehouses(filters);
  };

  const handleOpenDialog = (warehouse?: Warehouse) => {
    setSelectedWarehouse(warehouse || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedWarehouse(null);
    setError(undefined);
    setDialogOpen(false);
  };

  const handleSaveWarehouse = async (data: {
    name: string;
    description?: string;
    branchId: number;
    isActive?: boolean;
    isDefault?: boolean;
  }) => {
    try {
      setLoading(true);
      if (selectedWarehouse) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { branchId, ...updateData } = data;
        await warehouseService.updateWarehouse(
          selectedWarehouse.id,
          updateData
        );
        setSuccessMessage(t('warehouse.updated.successfully'));
      } else {
        await warehouseService.createWarehouse(data);
        setSuccessMessage(t('warehouse.created.successfully'));
      }
      setDialogOpen(false);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error saving warehouse:', error);
      setError(getWarehouseErrorMessage(error, t));
      return;
    } finally {
      setLoading(false);
    }
    fetchWarehouses();
  };

  const handleDeleteConfirm = async (warehouseId: number) => {
    setDeleteWarehouseId(warehouseId);
  };

  const handleDeleteCancel = () => {
    setDeleteWarehouseId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteWarehouseId) return;

    try {
      setLoading(true);
      await warehouseService.deleteWarehouse(deleteWarehouseId);
      setSuccessMessage(t('warehouse.deleted.successfully'));
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error while deleting warehouse:', error);
      setError(getWarehouseErrorMessage(error, t));
      return;
    } finally {
      setLoading(false);
      setDeleteWarehouseId(null);
    }
    fetchWarehouses();
  };

  const handleBulkDeleteWarehouses = async (
    warehousesToDelete: Warehouse[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await warehouseService.bulkDeleteWarehouses(
        warehousesToDelete.map((warehouse) => warehouse.id)
      );
      setSuccessMessage(
        t('warehouses.deleted.successfully', {
          count: warehousesToDelete.length
        })
      );
      setShowSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error while bulk deleting warehouses:', error);
      setError(getWarehouseErrorMessage(error, t));
      return;
    } finally {
      setLoading(false);
    }
    fetchWarehouses();
  };

  return (
    <>
      <Helmet>
        <title>{t('warehouse.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <WarehousesTable
            warehouses={warehouses}
            loading={loading}
            totalCount={totalCount}
            onFilterChange={handleFilterChange}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteConfirm}
            onBulkDeleteWarehouses={handleBulkDeleteWarehouses}
            onAdd={() => handleOpenDialog()}
            pageKey="warehouses"
          />
        </Grid>
      </Grid>

      <WarehouseDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveWarehouse}
        warehouse={selectedWarehouse}
        error={error}
      />

      <ConfirmDialog
        open={Boolean(deleteWarehouseId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.warehouse')}
        message={t('delete.warehouse.question')}
      />

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <MuiAlert
          variant="filled"
          severity="success"
          onClose={() => setShowSuccess(false)}
        >
          <Typography>{successMessage}</Typography>
        </MuiAlert>
      </Snackbar>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={Boolean(error) && !dialogOpen}
        autoHideDuration={6000}
        onClose={() => setError(undefined)}
      >
        <MuiAlert
          variant="filled"
          severity="error"
          onClose={() => setError(undefined)}
        >
          <Typography>{error}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default WarehouseManagement;
