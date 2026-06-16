import { useState, useCallback, useEffect } from 'react';
import { Grid, Snackbar, Alert as MuiAlert, Typography } from '@mui/material';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import TablesTable from '@/content/Management/Tables/TablesTable';
import TableDialog from '@/components/dialogs/TableDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import * as tableService from '@/data/tableService';
import { TableStatus } from '@/types/Table.interface';
import type {
  FloorPlan,
  Table,
  CreateTableData,
  UpdateTableData
} from '@/types/Table.interface';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const FloorPlanTables = () => {
  const { t } = useTranslation();
  const { floorPlanId } = useParams<{ floorPlanId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBranch } = useUserViewMode();

  const initialFloorPlan =
    (location.state as { floorPlan?: FloorPlan })?.floorPlan ?? null;

  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(
    initialFloorPlan
  );
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);

  // Table dialog
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableDialogError, setTableDialogError] = useState<
    string | undefined
  >();
  const [deleteTableId, setDeleteTableId] = useState<number | null>(null);

  // Notifications
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchFloorPlan = useCallback(async () => {
    if (!floorPlanId || floorPlan) return;
    try {
      const branchId = currentBranch?.id;
      const plans = await tableService.getFloorPlans({
        ...(branchId && { branchId })
      });
      const found = plans.find((p) => p.id === Number(floorPlanId));
      if (found) {
        setFloorPlan(found);
      } else {
        navigate('/management/table-management');
      }
    } catch (err) {
      console.error('Error fetching floor plan:', err);
      navigate('/management/table-management');
    }
  }, [floorPlanId, floorPlan, currentBranch, navigate]);

  const fetchTables = useCallback(async () => {
    if (!floorPlanId) return;
    try {
      setLoading(true);
      const branchId = currentBranch?.id;
      const data = await tableService.getTables({
        floorPlanId: Number(floorPlanId),
        ...(branchId && { branchId })
      });
      setTables(data);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  }, [floorPlanId, currentBranch]);

  useEffect(() => {
    fetchFloorPlan();
  }, [fetchFloorPlan]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // ─── Table CRUD ──────────────────────────────────────────────────

  const handleOpenTableDialog = (tbl?: Table) => {
    setEditingTable(tbl ?? null);
    setTableDialogError(undefined);
    setTableDialogOpen(true);
  };

  const handleCloseTableDialog = () => {
    setTableDialogOpen(false);
    setEditingTable(null);
    setTableDialogError(undefined);
  };

  const handleSaveTable = async (data: CreateTableData | UpdateTableData) => {
    try {
      const branchId = currentBranch?.id;
      const branchParams = branchId ? { branchId } : undefined;
      if (editingTable) {
        const updated = await tableService.updateTable(
          editingTable.id,
          data as UpdateTableData,
          branchParams
        );
        setTables((prev) =>
          prev.map((tbl) => (tbl.id === updated.id ? updated : tbl))
        );
        setSuccessMessage(t('table.update.success'));
      } else {
        const created = await tableService.createTable(
          data as CreateTableData,
          branchParams
        );
        setTables((prev) => [...prev, created]);
        setSuccessMessage(t('table.create.success'));
      }
      setTableDialogError(undefined);
      setTableDialogOpen(false);
      setEditingTable(null);
      setShowSuccess(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (editingTable ? t('table.error.update') : t('table.error.create'));
      setTableDialogError(msg);
      setErrorMessage(msg);
      setShowError(true);
      throw err;
    }
  };

  const handleDeleteTableConfirm = async () => {
    if (!deleteTableId) return;
    try {
      const branchId = currentBranch?.id;
      await tableService.deleteTable(
        deleteTableId,
        branchId ? { branchId } : undefined
      );
      setTables((prev) => prev.filter((tbl) => tbl.id !== deleteTableId));
      setSuccessMessage(t('table.delete.success'));
      setShowSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('table.error.delete');
      setErrorMessage(msg);
      setShowError(true);
    } finally {
      setDeleteTableId(null);
    }
  };

  const handleFilterChange = () => {
    fetchTables();
  };

  const handleToggleBlock = async (tbl: Table) => {
    try {
      const branchId = currentBranch?.id;
      const newStatus =
        tbl.status === TableStatus.BLOCKED
          ? TableStatus.AVAILABLE
          : TableStatus.BLOCKED;
      const updated = await tableService.updateTableStatus(
        tbl.id,
        newStatus,
        branchId ? { branchId } : undefined
      );
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSuccessMessage(
        newStatus === TableStatus.BLOCKED
          ? t('table.block.success')
          : t('table.unblock.success')
      );
      setShowSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('table.error.update');
      setErrorMessage(msg);
      setShowError(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {floorPlan?.name ?? t('table.tables')} – {t('table.management.title')}
        </title>
      </Helmet>
      <PageTitleWrapper>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArrowBackTwoToneIcon
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate('/management/table-management')}
            />
            <div>
              <Typography variant="h3" component="h3" gutterBottom>
                {floorPlan?.name ?? t('table.tables')}
              </Typography>
              <Typography variant="subtitle2">
                {t('table.floor.plan.tables.subtitle')}
              </Typography>
            </div>
          </Grid>
        </Grid>
      </PageTitleWrapper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TablesTable
            tables={tables}
            loading={loading}
            onAdd={() => handleOpenTableDialog()}
            onEdit={handleOpenTableDialog}
            onDelete={(id) => setDeleteTableId(id)}
            onToggleBlock={handleToggleBlock}
            onFilterChange={handleFilterChange}
            pageKey="tables"
          />
        </Grid>
      </Grid>

      {/* Table Dialog */}
      <TableDialog
        open={tableDialogOpen}
        onClose={handleCloseTableDialog}
        onSave={handleSaveTable}
        table={editingTable}
        floorPlans={floorPlan ? [floorPlan] : []}
        defaultFloorPlanId={floorPlan?.id}
        existingTables={tables}
        error={tableDialogError}
      />

      {/* Delete Table Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTableId)}
        onClose={() => setDeleteTableId(null)}
        onConfirm={handleDeleteTableConfirm}
        title={t('table.delete.table')}
        message={t('table.delete.confirm')}
      />

      {/* Success Notification */}
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

      {/* Error Notification */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <MuiAlert
          variant="filled"
          severity="error"
          onClose={() => setShowError(false)}
        >
          <Typography>{errorMessage}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default FloorPlanTables;
