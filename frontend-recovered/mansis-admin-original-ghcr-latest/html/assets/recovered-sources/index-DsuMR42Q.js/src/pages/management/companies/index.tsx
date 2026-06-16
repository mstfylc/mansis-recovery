import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/Companies/PageHeader';
import CompaniesTable from '@/content/Management/Companies/CompaniesTable';
import { useEffect, useState } from 'react';
import { Company } from '@/types/Company.interface';
import { Filters } from '@/types/Filters';
import { companyService } from '@/data/companyService';
import CompanyDialog from '@/components/modals/CompanyDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);

  const { t } = useTranslation();

  const fetchCompanies = async (filters?: Filters) => {
    try {
      setLoading(true);
      const data = await companyService.getAll({
        page: filters?.page ?? 0,
        limit: filters?.limit ?? 10,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && { search: filters.search })
      });
      setCompanies(data.items);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSaveNewCompany = async (company: {
    name: string;
    status?: string;
    imageFile?: File | null;
  }) => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append('name', company.name);

      if (company.imageFile) {
        formData.append('image', company.imageFile);
      }

      await companyService.create(formData);
      setError(undefined);
      setShowNewCompanyDialog(false);
      setShowSuccess(true);
      setSuccessMessage(t('company.create.success.message'));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setError(t('company.create.error.duplicate'));
      } else {
        setError(t('company.create.error.message'));
        console.error('Error creating company:', error);
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchCompanies();
  };

  const handleDeleteConfirm = async (companyId: number) => {
    setDeleteCompanyId(companyId);
  };

  const handleDeleteCancel = () => {
    setDeleteCompanyId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteCompanyId) return;

    try {
      setLoading(true);
      await companyService.delete(deleteCompanyId);
      setSuccessMessage(t('company.delete.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error while deleting company:', error);
      return;
    } finally {
      setLoading(false);
      setDeleteCompanyId(null);
    }
    fetchCompanies();
  };

  const handleBulkDeleteCompanies = async (
    selectedCompanies: Company[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await companyService.bulkDelete(
        selectedCompanies.map((company) => company.id)
      );
      setSuccessMessage(t('company.bulk.delete.success.message'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      setError(t('company.bulk.delete.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchCompanies();
  };

  const handleBulkUpdateCompanyStatus = async (
    selectedCompanies: Company[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await companyService.bulkUpdateStatus(
        selectedCompanies.map((company) => company.id),
        status
      );

      const updatedCount = result?.updatedCount;
      setSuccessMessage(
        t('company.bulk.status.update.success.message', {
          count: updatedCount || selectedCompanies.length
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
    fetchCompanies();
  };

  const handleUpdateCompany = async (
    companyId: number,
    updates: {
      name?: string;
      status?: string;
      imageFile?: File | null;
    }
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (updates.name) formData.append('name', updates.name);
      if (updates.status) formData.append('status', updates.status);
      if (updates.imageFile) formData.append('image', updates.imageFile);

      await companyService.update(companyId, formData);

      setSuccessMessage(t('company.update.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating company:', error);
      setError(t('company.update.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchCompanies();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchCompanies(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('company.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CompaniesTable
            companies={companies}
            loading={loading}
            totalCount={totalCount}
            setShowNewCompanyDialog={setShowNewCompanyDialog}
            onDeleteCompany={handleDeleteConfirm}
            onBulkDeleteCompanies={handleBulkDeleteCompanies}
            onBulkUpdateStatus={handleBulkUpdateCompanyStatus}
            onUpdateCompany={handleUpdateCompany}
            onFilterChange={handleFilterChange}
          />
        </Grid>
      </Grid>
      <CompanyDialog
        open={showNewCompanyDialog}
        onClose={() => {
          setError(undefined);
          setShowNewCompanyDialog(false);
        }}
        onSave={handleSaveNewCompany}
        error={error}
      />
      <ConfirmDialog
        open={Boolean(deleteCompanyId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.company')}
        message={t('delete.company.question')}
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

export default CompanyManagement;
