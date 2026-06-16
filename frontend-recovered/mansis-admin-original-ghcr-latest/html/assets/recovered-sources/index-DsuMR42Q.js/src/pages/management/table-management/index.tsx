import { useState, useCallback, useEffect } from 'react';
import { Grid, Snackbar, Alert as MuiAlert, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import FloorPlansTable from '@/content/Management/Tables/FloorPlansTable';
import FloorPlanDialog from '@/components/dialogs/FloorPlanDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import * as tableService from '@/data/tableService';
import type {
  FloorPlan,
  CreateFloorPlanData,
  UpdateFloorPlanData
} from '@/types/Table.interface';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const TableManagement = () => {
  const { t } = useTranslation();
  const { currentBranch } = useUserViewMode();

  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);

  // Floor plan dialog
  const [floorPlanDialogOpen, setFloorPlanDialogOpen] = useState(false);
  const [editingFloorPlan, setEditingFloorPlan] = useState<FloorPlan | null>(
    null
  );
  const [floorPlanDialogError, setFloorPlanDialogError] = useState<
    string | undefined
  >();
  const [deleteFloorPlanId, setDeleteFloorPlanId] = useState<number | null>(
    null
  );

  // Notifications
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchFloorPlans = useCallback(async () => {
    try {
      setLoadingFloorPlans(true);
      const branchId = currentBranch?.id;
      if (!branchId) {
        setLoadingFloorPlans(false);
        return;
      }
      const data = await tableService.getFloorPlans({ branchId });
      setFloorPlans(data);
    } catch (err) {
      console.error('Error fetching floor plans:', err);
    } finally {
      setLoadingFloorPlans(false);
    }
  }, [currentBranch]);

  useEffect(() => {
    fetchFloorPlans();
  }, [fetchFloorPlans]);

  // ─── Floor Plan CRUD ────────────────────────────────────────────

  const handleOpenFloorPlanDialog = (fp?: FloorPlan) => {
    setEditingFloorPlan(fp ?? null);
    setFloorPlanDialogError(undefined);
    setFloorPlanDialogOpen(true);
  };

  const handleCloseFloorPlanDialog = () => {
    setFloorPlanDialogOpen(false);
    setEditingFloorPlan(null);
    setFloorPlanDialogError(undefined);
  };

  const handleSaveFloorPlan = async (
    data: CreateFloorPlanData & { isActive?: boolean }
  ) => {
    try {
      const branchId = currentBranch?.id;
      const branchParams = branchId ? { branchId } : undefined;
      if (editingFloorPlan) {
        const updated = await tableService.updateFloorPlan(
          editingFloorPlan.id,
          data as UpdateFloorPlanData,
          branchParams
        );
        setFloorPlans((prev) =>
          prev.map((fp) => (fp.id === updated.id ? updated : fp))
        );
        setSuccessMessage(t('table.floor.plan.update.success'));
      } else {
        const created = await tableService.createFloorPlan(data, branchParams);
        setFloorPlans((prev) => [...prev, created]);
        setSuccessMessage(t('table.floor.plan.create.success'));
      }
      setFloorPlanDialogError(undefined);
      setFloorPlanDialogOpen(false);
      setEditingFloorPlan(null);
      setShowSuccess(true);
    } catch (err: any) {
      const FLOOR_PLAN_ERROR_CODES: Record<string, string> = {
        FLOOR_PLAN_DUPLICATE_NAME: 'table.floor.plan.error.duplicate.name',
        FLOOR_PLAN_GRID_SHRINK_OUT_OF_BOUNDS:
          'table.floor.plan.error.grid.shrink',
        FLOOR_PLAN_HAS_OPEN_CHECKS: 'table.floor.plan.error.has.open.checks'
      };
      const errorCode = err?.response?.data?.errorCode;
      const fallback = editingFloorPlan
        ? t('table.floor.plan.error.update')
        : t('table.floor.plan.error.create');
      const msg =
        errorCode && FLOOR_PLAN_ERROR_CODES[errorCode]
          ? t(FLOOR_PLAN_ERROR_CODES[errorCode])
          : fallback;
      setFloorPlanDialogError(msg);
      throw err;
    }
  };

  const handleDeleteFloorPlanConfirm = async () => {
    if (!deleteFloorPlanId) return;
    try {
      const branchId = currentBranch?.id;
      await tableService.deleteFloorPlan(
        deleteFloorPlanId,
        branchId ? { branchId } : undefined
      );
      setFloorPlans((prev) => prev.filter((fp) => fp.id !== deleteFloorPlanId));
      setSuccessMessage(t('table.floor.plan.delete.success'));
      setShowSuccess(true);
    } catch (err: any) {
      const FLOOR_PLAN_ERROR_CODES: Record<string, string> = {
        FLOOR_PLAN_HAS_OPEN_CHECKS: 'table.floor.plan.error.has.open.checks'
      };
      const errorCode = err?.response?.data?.errorCode;
      const msg =
        errorCode && FLOOR_PLAN_ERROR_CODES[errorCode]
          ? t(FLOOR_PLAN_ERROR_CODES[errorCode])
          : err?.response?.data?.message || t('table.floor.plan.error.delete');
      setErrorMessage(msg);
      setShowError(true);
    } finally {
      setDeleteFloorPlanId(null);
    }
  };

  const handleFilterChange = () => {
    fetchFloorPlans();
  };

  return (
    <>
      <Helmet>
        <title>{t('table.management.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FloorPlansTable
            floorPlans={floorPlans}
            loading={loadingFloorPlans}
            onAdd={() => handleOpenFloorPlanDialog()}
            onEdit={handleOpenFloorPlanDialog}
            onDelete={(id) => setDeleteFloorPlanId(id)}
            onFilterChange={handleFilterChange}
            pageKey="floorPlans"
          />
        </Grid>
      </Grid>

      {/* Floor Plan Dialog */}
      <FloorPlanDialog
        open={floorPlanDialogOpen}
        onClose={handleCloseFloorPlanDialog}
        onSave={handleSaveFloorPlan}
        floorPlan={editingFloorPlan}
        error={floorPlanDialogError}
        nextSortOrder={
          editingFloorPlan
            ? undefined
            : Math.max(...floorPlans.map((fp) => fp.sortOrder), -1) + 1
        }
      />

      {/* Delete Floor Plan Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteFloorPlanId)}
        onClose={() => setDeleteFloorPlanId(null)}
        onConfirm={handleDeleteFloorPlanConfirm}
        title={t('table.delete.floor.plan')}
        message={t('table.floor.plan.delete.confirm')}
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

export default TableManagement;
