import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/SmsPackages/PageHeader';
import SmsPackagesTable from '@/content/Management/SmsPackages/SmsPackagesTable';
import { useState } from 'react';
import {
  getSmsPackages,
  createSmsPackage,
  updateSmsPackage,
  deleteSmsPackage
} from '@/data/smsPackageService';
import { SmsPackage, CreateSmsPackageData } from '@/types/Licensing.interface';
import { Filters } from '@/types/Filters';
import SmsPackageDialog from '@/components/modals/SmsPackageDialog';
import PurchaseSmsPackageDialog from '@/components/modals/PurchaseSmsPackageDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const SmsPackagesManagement = () => {
  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewPackageDialog, setShowNewPackageDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedPackageForPurchase, setSelectedPackageForPurchase] =
    useState<SmsPackage | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletePackageId, setDeletePackageId] = useState<number | null>(null);
  const [editingPackage, setEditingPackage] = useState<SmsPackage | null>(null);
  const { t } = useTranslation();

  const fetchPackages = async (filters?: Filters) => {
    try {
      setLoading(true);
      const params = transformFiltersToApiParams(filters);
      const response = await getSmsPackages(params);
      setPackages(response.items);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching SMS packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePackage = async (data: CreateSmsPackageData) => {
    try {
      if (editingPackage) {
        await updateSmsPackage(editingPackage.id, data);
        setSuccessMessage(t('sms.package.edit.success'));
      } else {
        await createSmsPackage(data);
        setSuccessMessage(t('sms.package.create.success'));
      }
      setError(undefined);
      setShowNewPackageDialog(false);
      setEditingPackage(null);
      setShowSuccess(true);
      fetchPackages(); // Only refetch on success
    } catch (error: any) {
      console.error('Error saving SMS package:', error);
      setError(error.response?.data?.message || t('sms.package.save.error'));
      throw error; // Re-throw to let dialog handle loading state
    }
  };

  const handleDeleteConfirm = async (packageId: number) => {
    setDeletePackageId(packageId);
  };

  const handleDeleteCancel = () => {
    setDeletePackageId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletePackageId) return;

    try {
      setLoading(true);
      await deleteSmsPackage(deletePackageId);
      setSuccessMessage(t('sms.package.delete.success'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error while deleting SMS package:', error);
      return;
    } finally {
      setLoading(false);
      setDeletePackageId(null);
    }
    fetchPackages();
  };

  const handleEditPackage = (pkg: SmsPackage) => {
    setEditingPackage(pkg);
    setError(undefined);
    setShowNewPackageDialog(true);
  };

  const handlePurchasePackage = (pkg: SmsPackage) => {
    setSelectedPackageForPurchase(pkg);
    setShowPurchaseDialog(true);
  };

  const handlePurchaseSuccess = () => {
    setSuccessMessage(t('assign.success'));
    setShowSuccess(true);
    setShowPurchaseDialog(false);
    setSelectedPackageForPurchase(null);
  };

  const handleFilterChange = (filters: Filters) => {
    fetchPackages(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('sms.package.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SmsPackagesTable
            packages={packages}
            loading={loading}
            totalCount={totalCount}
            setShowNewPackageDialog={setShowNewPackageDialog}
            onDeletePackage={handleDeleteConfirm}
            onEditPackage={handleEditPackage}
            onPurchasePackage={handlePurchasePackage}
            onFilterChange={handleFilterChange}
            pageKey="sms-packages"
          />
        </Grid>
      </Grid>
      <SmsPackageDialog
        open={showNewPackageDialog}
        onClose={() => {
          setError(undefined);
          setShowNewPackageDialog(false);
          setEditingPackage(null);
        }}
        onSave={handleSavePackage}
        editingPackage={editingPackage}
        error={error}
      />
      <PurchaseSmsPackageDialog
        open={showPurchaseDialog}
        onClose={() => {
          setShowPurchaseDialog(false);
          setSelectedPackageForPurchase(null);
        }}
        onSuccess={handlePurchaseSuccess}
        selectedPackage={selectedPackageForPurchase}
      />
      <ConfirmDialog
        open={Boolean(deletePackageId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('sms.package.delete.confirm.title')}
        message={t('sms.package.delete.confirm.description')}
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

export default SmsPackagesManagement;
