import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/Branches/PageHeader';
import BranchesTable from '@/content/Management/Branches/BranchesTable';
import { useEffect, useState } from 'react';
import { Branch } from '@/types/Branch.interface';
import { Filters } from '@/types/Filters';
import { branchService } from '@/data/branchService';
import { companyService } from '@/data/companyService';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { Company } from '@/types/Company.interface';
import { branchState$, setBranches } from '@/store/branchStore';
import { useObservable } from '@legendapp/state/react';

const BranchManagement = () => {
  const branchStateData = useObservable(branchState$);
  const [branches, setBranchesState] = useState<Branch[]>(
    branchStateData.branches.get()
  );
  const [totalCount, setTotalCount] = useState(
    branchStateData.totalCount.get()
  );
  const [loading, setLoading] = useState(
    branchStateData.branches.get().length === 0
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteBranchId, setDeleteBranchId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const { t } = useTranslation();

  useEffect(() => {
    setBranchesState(branchStateData.branches.get());
    setTotalCount(branchStateData.totalCount.get());
  }, [branchStateData]);

  const fetchBranches = async (filters?: Filters) => {
    try {
      setLoading(true);
      const data = await branchService.getAll({
        page: filters?.page ?? 0,
        limit: filters?.limit ?? 10,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && { search: filters.search })
      });

      setBranches(data.items, data.total);

      setBranchesState(data.items);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchCompanies();
  }, []);

  const handleSaveNewBranch = async (branch: {
    name: string;
    companyId: number;
    mapcode?: string;
    imageFile?: File | null;
  }) => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append('name', branch.name);
      formData.append('companyId', branch.companyId.toString());

      if (branch.imageFile) {
        formData.append('image', branch.imageFile);
      }

      if (branch.mapcode) {
        formData.append('mapcode', branch.mapcode);
      }

      await branchService.create(formData);
      setShowSuccess(true);
      setSuccessMessage(t('branch.create.success.message'));
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.error(t('branch.create.error.duplicate'));
      } else {
        console.error('Error creating branch:', error);
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchBranches();
  };

  const handleDeleteConfirm = async (branchId: number) => {
    setDeleteBranchId(branchId);
  };

  const handleDeleteCancel = () => {
    setDeleteBranchId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteBranchId) return;

    try {
      setLoading(true);
      await branchService.delete(deleteBranchId);
      setSuccessMessage(t('branch.delete.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error while deleting branch:', error);
      return;
    } finally {
      setLoading(false);
      setDeleteBranchId(null);
    }
    fetchBranches();
  };

  const handleBulkDeleteBranches = async (
    selectedBranches: Branch[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await branchService.bulkDelete(
        selectedBranches.map((branch) => branch.id)
      );
      setSuccessMessage(t('branch.bulk.delete.success.message'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      return;
    } finally {
      setLoading(false);
    }
    fetchBranches();
  };

  const handleBulkUpdateBranchStatus = async (
    selectedBranches: Branch[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await branchService.bulkUpdateStatus(
        selectedBranches.map((branch) => branch.id),
        status
      );

      const updatedCount = result?.updatedCount;
      setSuccessMessage(
        t('branch.bulk.status.update.success.message', {
          count: updatedCount || selectedBranches.length
        })
      );
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk status update:', error);
      return;
    } finally {
      setLoading(false);
    }
    fetchBranches();
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll({});
      setCompanies(data.items);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranch = async (
    branchId: number,
    updates: {
      name?: string;
      status?: string;
      companyId?: number;
      mapcode?: string;
      imageFile?: File;
    }
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (updates.name) formData.append('name', updates.name);
      if (updates.status) formData.append('status', updates.status);
      if (updates.companyId !== undefined)
        formData.append('companyId', updates.companyId.toString());
      if (updates.mapcode) formData.append('mapcode', updates.mapcode);
      if (updates.imageFile) formData.append('image', updates.imageFile);

      await branchService.update(branchId, formData);

      setSuccessMessage(t('branch.update.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating branch:', error);
      return;
    } finally {
      setLoading(false);
    }
    fetchBranches();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchBranches(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('branch.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BranchesTable
            companies={companies}
            branches={branches}
            loading={loading}
            totalCount={totalCount}
            onDeleteBranch={handleDeleteConfirm}
            onBulkDeleteBranches={handleBulkDeleteBranches}
            onBulkUpdateStatus={handleBulkUpdateBranchStatus}
            onUpdateBranch={handleUpdateBranch}
            onAddBranch={handleSaveNewBranch}
            onFilterChange={handleFilterChange}
          />
        </Grid>
      </Grid>
      <ConfirmDialog
        open={Boolean(deleteBranchId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.branch')}
        message={t('delete.branch.question')}
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
    </>
  );
};

export default BranchManagement;
