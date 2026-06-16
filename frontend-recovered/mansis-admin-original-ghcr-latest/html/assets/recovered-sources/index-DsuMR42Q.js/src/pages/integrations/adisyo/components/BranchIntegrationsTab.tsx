import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { adisyoService } from '@/data/adisyoService';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import AdisyoSetup from './AdisyoSetup';
import { Branch as BranchType } from '@/types/Branch.interface';
import NoDataFound from '@/components/NoDataFound';

interface Company {
  id: number;
  name: string;
}

interface AdisyoIntegrationStatus {
  isConfigured: boolean;
  lastSync?: string;
  status: 'active' | 'inactive' | 'error';
  autoSyncOrders?: boolean;
}

interface Branch extends BranchType {
  adisyoIntegration?: AdisyoIntegrationStatus;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const BranchIntegrationsTab: React.FC = () => {
  const { t } = useTranslation();
  const { isSuperAdmin, isBranchAdmin, company, currentBranch } =
    useUserViewMode();
  const companyId = company?.id;
  const branchId = currentBranch?.id;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // State for setup dialog
  const [setupDialogOpen, setSetupDialogOpen] = useState<boolean>(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [branchToDelete, setBranchToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<boolean>(false);

  // State for snackbar notifications
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [toggleSyncLoading, setToggleSyncLoading] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
    } else if (companyId) {
      setSelectedCompany(companyId);
    }
  }, [isSuperAdmin, companyId]);

  const fetchCompanies = async () => {
    try {
      const result = await companyService.getAllFlat({ getAll: true });
      setCompanies((result as Company[]) || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchBranches();
    }
  }, [selectedCompany]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const branchesData = await branchService.getAllFlat({
        companyId: selectedCompany,
        getAll: true
      } as any);

      const branchList = (branchesData as BranchType[]) || [];

      // Fetch integration status for each branch
      const branchesWithStatus = await Promise.all(
        branchList.map(async (branch) => {
          try {
            const status = await adisyoService.getBranchStatus(branch.id);

            return {
              ...branch,
              adisyoIntegration: {
                isConfigured: !!status.isActive,
                lastSync: status.lastSyncAt,
                status: status.isActive
                  ? status.syncError
                    ? 'error'
                    : 'active'
                  : 'inactive',
                autoSyncOrders: status.autoSyncOrders
              }
            } as Branch;
          } catch (error) {
            console.error(
              `Error fetching status for branch ${branch.id}:`,
              error
            );
            return {
              ...branch,
              adisyoIntegration: {
                isConfigured: false,
                status: 'inactive'
              }
            } as Branch;
          }
        })
      );

      setBranches(branchesWithStatus);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (event: SelectChangeEvent) => {
    setSelectedCompany(Number(event.target.value));
  };

  const handleConfigureIntegration = (branchId: number) => {
    setSelectedBranchId(branchId);
    setSetupDialogOpen(true);
  };

  const handleSetupDialogClose = () => {
    setSetupDialogOpen(false);
    setSelectedBranchId(null);
  };

  const handleSetupSuccess = () => {
    // Refresh branches data to get updated integration status
    fetchBranches();
    setSetupDialogOpen(false);
    setSelectedBranchId(null);
  };

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete({
      id: branch.id,
      name: branch.name
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setBranchToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return;

    setDeletingConfig(true);
    try {
      await adisyoService.deleteIntegration(branchToDelete.id);

      // Show success notification
      setSnackbar({
        open: true,
        message: t('integrations.adisyo.delete.configuration.success'),
        severity: 'success'
      });

      // Refresh branches data to get updated integration status
      fetchBranches();
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
    } catch (error) {
      console.error('Error deleting integration configuration:', error);
      // Show error notification
      setSnackbar({
        open: true,
        message: t('integrations.adisyo.delete.configuration.error'),
        severity: 'error'
      });
    } finally {
      setDeletingConfig(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getStatusChip = (status?: 'active' | 'inactive' | 'error') => {
    if (!status)
      return (
        <Chip
          label={t('integrations.adisyo.integration.not.configured')}
          color="default"
          size="small"
        />
      );

    switch (status) {
      case 'active':
        return <Chip label={t('active')} color="success" size="small" />;
      case 'inactive':
        return <Chip label={t('passive')} color="warning" size="small" />;
      case 'error':
        return <Chip label={t('error')} color="error" size="small" />;
      default:
        return (
          <Chip
            label={t('integrations.adisyo.integration.not.configured')}
            color="default"
            size="small"
          />
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const handleAutoSyncToggle = async (
    branchId: number,
    currentValue: boolean
  ) => {
    setToggleSyncLoading(branchId);
    try {
      const responseData = await adisyoService.toggleAutoSync(
        branchId,
        !currentValue
      );
      if (responseData.success) {
        setSnackbar({
          open: true,
          message: t(
            !currentValue
              ? 'integrations.adisyo.auto.sync.enabled'
              : 'integrations.adisyo.auto.sync.disabled'
          ),
          severity: 'success'
        });

        fetchBranches();
      }
    } catch (error) {
      console.error('Error toggling auto sync:', error);
      setSnackbar({
        open: true,
        message: t('integrations.adisyo.auto.sync.error'),
        severity: 'error'
      });
    } finally {
      setToggleSyncLoading(null);
    }
  };

  // If user is branch admin, show setup directly
  if (isBranchAdmin && branchId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('integrations.adisyo.setup.title')}
        </Typography>
        <Card sx={{ p: 3 }} className="adisyo-setup-form">
          <AdisyoSetup branchId={branchId} onSuccess={() => {}} />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {isSuperAdmin && (
        <FormControl fullWidth sx={{ mb: 4 }}>
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

      <Typography variant="h6" gutterBottom>
        {t('integrations.adisyo.branch.integrations.title')}
      </Typography>

      {!selectedCompany && isSuperAdmin ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 8,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {t('select.company.first')}
          </Typography>
        </Box>
      ) : (
        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} className="adisyo-branches-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('branch')}</TableCell>
                    <TableCell className="adisyo-status-column">
                      {t('integrations.adisyo.status')}
                    </TableCell>
                    <TableCell>{t('integrations.adisyo.last.sync')}</TableCell>
                    <TableCell>{t('integrations.adisyo.auto.sync')}</TableCell>
                    <TableCell align="right">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell className="adisyo-status-column">
                          {getStatusChip(branch.adisyoIntegration?.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(branch.adisyoIntegration?.lastSync)}
                        </TableCell>
                        <TableCell>
                          {branch.adisyoIntegration?.isConfigured ? (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={
                                    branch.adisyoIntegration?.autoSyncOrders ||
                                    false
                                  }
                                  onChange={() =>
                                    handleAutoSyncToggle(
                                      branch.id,
                                      branch.adisyoIntegration
                                        ?.autoSyncOrders || false
                                    )
                                  }
                                  disabled={toggleSyncLoading === branch.id}
                                />
                              }
                              label={
                                toggleSyncLoading === branch.id ? (
                                  <CircularProgress size={20} />
                                ) : branch.adisyoIntegration?.autoSyncOrders ? (
                                  t('integrations.adisyo.auto.sync.enabled')
                                ) : (
                                  t('integrations.adisyo.auto.sync.disabled')
                                )
                              }
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{ display: 'flex', justifyContent: 'flex-end' }}
                          >
                            {branch.adisyoIntegration?.isConfigured && (
                              <Tooltip
                                title={t(
                                  'integrations.adisyo.remove.configuration'
                                )}
                              >
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(branch)}
                                  sx={{ mr: 1 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() =>
                                handleConfigureIntegration(branch.id)
                              }
                              className="adisyo-setup-button"
                            >
                              {branch.adisyoIntegration?.isConfigured
                                ? t('integrations.adisyo.update.configuration')
                                : t('integrations.adisyo.set.up.integration')}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <NoDataFound message={t('no.branch.found')} colSpan={5} />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* Setup Dialog */}
      <Dialog
        open={setupDialogOpen}
        onClose={handleSetupDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('integrations.adisyo.setup.dialog.title')}</DialogTitle>
        <DialogContent>
          {selectedBranchId && (
            <AdisyoSetup
              branchId={selectedBranchId}
              onSuccess={handleSetupSuccess}
              onCancel={handleSetupDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t('integrations.adisyo.delete.configuration.title')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('integrations.adisyo.delete.configuration.confirmation', {
              branch: branchToDelete?.name
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={deletingConfig}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deletingConfig}
            startIcon={deletingConfig ? <CircularProgress size={20} /> : null}
          >
            {deletingConfig ? t('deleting') : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BranchIntegrationsTab;
