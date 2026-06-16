import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Store as StoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  CompanyProduct,
  BranchOverride
} from '@/types/CompanyProduct.interface';
import { companyProductService } from '@/data/companyProductService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import BranchOverrideDialog from '../dialogs/BranchOverrideDialog';
import BranchOverridesTable from '@/components/BranchOverridesTable';

interface BranchOverridesTabProps {
  product: CompanyProduct;
  onRefresh: () => void;
}

const BranchOverridesTab: React.FC<BranchOverridesTabProps> = ({
  product,
  onRefresh
}) => {
  const { t } = useTranslation();
  const { isBranchAdmin, currentBranch } = useUserViewMode();
  const ability = useContext(AbilityContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<BranchOverride[]>([]);

  // Dialog states
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<BranchOverride | null>(
    null
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteOverrideId, setDeleteOverrideId] = useState<number | null>(null);

  const fetchOverrides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentBranchId = currentBranch?.id;

      const params: Record<string, number> = {};
      if (isBranchAdmin && currentBranchId) {
        params.branchId = currentBranchId;
      }

      const result = await companyProductService.getBranchOverrides(
        product.id,
        params
      );
      setOverrides(result || []);
    } catch (err: any) {
      console.error('Error fetching branch overrides:', err);
      setError(
        err.response?.data?.message || t('error.failed.to.load.overrides')
      );
    } finally {
      setLoading(false);
    }
  }, [product.id, t, isBranchAdmin, currentBranch]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const handleCreateOverride = () => {
    setEditingOverride(null);
    setOverrideDialogOpen(true);
  };

  const handleEditOverride = (override: BranchOverride) => {
    setEditingOverride(override);
    setOverrideDialogOpen(true);
  };

  const handleDeleteOverride = (overrideId: number) => {
    setDeleteOverrideId(overrideId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteOverrideId) return;

    try {
      await companyProductService.deleteBranchOverride(deleteOverrideId);
      await fetchOverrides();
      onRefresh();
    } catch (err: any) {
      console.error('Error deleting override:', err);
      setError(
        err.response?.data?.message || t('error.failed.to.delete.override')
      );
    } finally {
      setConfirmDeleteOpen(false);
      setDeleteOverrideId(null);
    }
  };

  const handleOverrideSaved = () => {
    setOverrideDialogOpen(false);
    setEditingOverride(null);
    fetchOverrides();
    onRefresh();
  };

  const hasOverrides = overrides.length > 0;
  const canCreateOverride = !isBranchAdmin || !hasOverrides;

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">
          {t('branch.overrides')} ({overrides.length})
        </Typography>

        <Can I="create" a="BranchProductOverride" ability={ability}>
          {canCreateOverride && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateOverride}
            >
              {t('create.branch.override')}
            </Button>
          )}
        </Can>
      </Box>

      {hasOverrides ? (
        <BranchOverridesTable
          product={product}
          overrides={overrides}
          onEditOverride={handleEditOverride}
          onDeleteOverride={handleDeleteOverride}
        />
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <StoreIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('no.branch.overrides')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t('no.branch.overrides.description')}
          </Typography>

          <Can I="create" a="BranchProductOverride" ability={ability}>
            {canCreateOverride && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateOverride}
              >
                {t('create.first.override')}
              </Button>
            )}
          </Can>
        </Paper>
      )}

      <BranchOverrideDialog
        open={overrideDialogOpen}
        onClose={() => setOverrideDialogOpen(false)}
        onSave={handleOverrideSaved}
        product={product}
        override={editingOverride}
        existingOverrides={overrides}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title={t('delete.branch.override')}
        message={t('delete.branch.override.confirmation')}
        confirmButtonText={t('delete')}
        confirmButtonColor="error"
      />
    </Box>
  );
};

export default BranchOverridesTab;
