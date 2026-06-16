import { useState, useEffect, FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { adisyoService } from '@/data/adisyoService';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';

interface ProductImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const ProductImportDialog: FC<ProductImportDialogProps> = ({
  open,
  onClose
}) => {
  const { t } = useTranslation();
  const {
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    isAdminView,
    company,
    currentBranch
  } = useUserViewMode();
  const companyId = company?.id;
  const branchId = currentBranch?.id;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [integrationStatus, setIntegrationStatus] = useState<{
    isConfigured: boolean;
    status?: 'active' | 'inactive' | 'error';
  }>({ isConfigured: false });
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    isImporting: boolean;
  }>({ success: false, message: '', isImporting: false });

  // Fetch fresh data when dialog opens
  useEffect(() => {
    if (open) {
      if (isSuperAdmin) {
        fetchCompanies();
      } else if (isCompanyAdmin && companyId) {
        setSelectedCompany(companyId);
      } else if (isBranchAdmin && branchId) {
        setSelectedBranch(branchId);
        checkIntegrationStatus(branchId);
      }
    }
  }, [open, isSuperAdmin, isCompanyAdmin, isBranchAdmin, companyId, branchId]);

  // Fetch companies for super admin
  const fetchCompanies = async () => {
    setFetchingData(true);
    try {
      const result = await companyService.getAllFlat({ getAll: true });
      setCompanies((result as Company[]) || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setFetchingData(false);
    }
  };

  // Fetch branches when company is selected
  useEffect(() => {
    if (selectedCompany) {
      fetchBranches();
    }
  }, [selectedCompany]);

  const fetchBranches = async () => {
    setFetchingData(true);
    try {
      const result = await branchService.getAllFlat({
        companyId: selectedCompany,
        getAll: true
      } as any);
      setBranches((result as Branch[]) || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setFetchingData(false);
    }
  };

  // Check integration status when branch is selected or dialog opens
  useEffect(() => {
    if (selectedBranch && open) {
      checkIntegrationStatus(selectedBranch);
    }
  }, [selectedBranch, open]);

  const checkIntegrationStatus = async (branchId: number) => {
    setLoading(true);
    try {
      const statusData = await adisyoService.getBranchStatus(branchId);
      setIntegrationStatus({
        isConfigured: !!statusData.isActive,
        status: statusData.isActive
          ? statusData.syncError
            ? 'error'
            : 'active'
          : 'inactive'
      });
    } catch (error) {
      console.error('Error checking integration status:', error);
      setIntegrationStatus({ isConfigured: false });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (event: SelectChangeEvent) => {
    setSelectedCompany(Number(event.target.value));
    setSelectedBranch(null);
    setIntegrationStatus({ isConfigured: false });
  };

  const handleBranchChange = (event: SelectChangeEvent) => {
    setSelectedBranch(Number(event.target.value));
  };

  const handleImportProducts = async () => {
    if (!selectedBranch) return;

    setImportStatus({
      success: false,
      message: '',
      isImporting: true
    });

    try {
      const responseData = await adisyoService.syncProducts(selectedBranch);
      if (responseData) {
        if (responseData.success) {
          setImportStatus({
            success: true,
            message:
              responseData.message || t('integrations.adisyo.import.success'),
            isImporting: false
          });

          // Show success message briefly and then close the dialog
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          // Handle non-success response
          setImportStatus({
            success: false,
            message:
              responseData.message || t('integrations.adisyo.import.error'),
            isImporting: false
          });
        }
      }
    } catch (error) {
      console.error('Error importing products:', error);
      setImportStatus({
        success: false,
        message: t('integrations.adisyo.import.error'),
        isImporting: false
      });
    }
  };

  const renderContent = () => {
    if (fetchingData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <>
        {isSuperAdmin && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="company-select-label">
              {t('select.company')}
            </InputLabel>
            <Select
              labelId="company-select-label"
              id="company-select"
              value={selectedCompany?.toString() || ''}
              label={t('select.company')}
              onChange={handleCompanyChange}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {(isSuperAdmin || isCompanyAdmin) && selectedCompany && isAdminView && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="branch-select-label">
              {t('select.branch')}
            </InputLabel>
            <Select
              labelId="branch-select-label"
              id="branch-select"
              value={selectedBranch?.toString() || ''}
              label={t('select.branch')}
              onChange={handleBranchChange}
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {selectedBranch && !loading && (
          <>
            {!integrationStatus.isConfigured ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('integrations.adisyo.integration.not.configured')}
              </Alert>
            ) : integrationStatus.status === 'error' ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('integrations.adisyo.integration.error')}
              </Alert>
            ) : integrationStatus.status === 'inactive' ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('integrations.adisyo.integration.inactive')}
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('integrations.adisyo.integration.ready')}
              </Alert>
            )}
          </>
        )}

        {importStatus.message && (
          <Alert
            severity={importStatus.success ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            {importStatus.message}
          </Alert>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('integrations.adisyo.import.products.title')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {t('integrations.adisyo.import.products.description')}
        </Typography>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleImportProducts}
          disabled={
            !selectedBranch ||
            !integrationStatus.isConfigured ||
            integrationStatus.status !== 'active' ||
            importStatus.isImporting
          }
          startIcon={
            importStatus.isImporting ? <CircularProgress size={20} /> : null
          }
        >
          {importStatus.isImporting
            ? t('integrations.adisyo.importing')
            : t('integrations.adisyo.start.import')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductImportDialog;
