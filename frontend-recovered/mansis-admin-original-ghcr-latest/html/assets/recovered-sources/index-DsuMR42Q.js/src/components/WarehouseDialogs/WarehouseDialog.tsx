import { FC, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Switch,
  Checkbox
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Warehouse } from '@/types/stock';
import { Branch } from '@/types/Branch.interface';
import { Company } from '@/types/Company.interface';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { useUserViewMode } from '@/hooks/useUserViewMode';

interface WarehouseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    branchId: number;
    isActive?: boolean;
    isDefault?: boolean;
  }) => Promise<void>;
  warehouse?: Warehouse | null;
  error?: string;
}

const WarehouseDialog: FC<WarehouseDialogProps> = ({
  open,
  onClose,
  onSave,
  warehouse,
  error
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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState<number>(-1);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [fetchedBranches, setFetchedBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const isEditMode = !!warehouse;

  const resetForm = () => {
    setName('');
    setDescription('');
    setBranchId(-1);
    setIsActive(true);
    setIsDefault(false);
    setSelectedCompanyId(-1);
    setFetchedBranches([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const data = await companyService.getAll({});
      setCompanies(data.items || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchBranches = async (companyId: number) => {
    try {
      setLoadingBranches(true);
      const result = await branchService.getAllFlat({ companyId });
      setFetchedBranches(result || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (isEditMode && warehouse) {
      setName(warehouse.name);
      setDescription(warehouse.description || '');
      setBranchId(warehouse.branchId || -1);
      setIsActive(warehouse.isActive ?? true);
      setIsDefault(warehouse.isDefault ?? false);

      if (warehouse.branch?.company?.id) {
        setSelectedCompanyId(warehouse.branch.company.id);
      }
    } else {
      resetForm();
    }

    // Fetch companies for super admin
    if (isSuperAdmin) {
      fetchCompanies();
    }
    // Fetch branches for company admin OR in edit mode if company is set
    else if (
      (isCompanyAdmin && company?.id) ||
      (isEditMode && warehouse?.branch?.company?.id)
    ) {
      const companyId = isEditMode
        ? warehouse?.branch?.company?.id
        : company?.id;
      if (companyId !== undefined) {
        fetchBranches(companyId);
      }
    }
    // For branch admin, set branchId automatically
    else if (isBranchAdmin) {
      const branchId = currentBranch?.id; // SAFE
      if (branchId !== undefined) {
        setBranchId(branchId);
      }
    }
  }, [
    open,
    warehouse,
    isEditMode,
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    company,
    currentBranch
  ]);

  useEffect(() => {
    if (selectedCompanyId > 0) {
      fetchBranches(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      let finalBranchId = branchId;

      // For branch admin, use their branch ID
      if (isBranchAdmin) {
        const userBranchId = currentBranch?.id; // SAFE
        if (userBranchId !== undefined) {
          finalBranchId = userBranchId as number;
        }
      }

      if (finalBranchId === -1 && !isBranchAdmin) {
        console.error('Branch ID is required but not selected');
        return;
      }

      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        branchId: finalBranchId,
        isActive,
        isDefault
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {warehouse ? t('edit.warehouse') : t('add.warehouse')}
        {isEditMode && ` - ${warehouse?.name}`}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('warehouse.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
            helperText={t('warehouse.name.helper.text')}
            placeholder={t('warehouse.name.placeholder')}
          />

          {isSuperAdmin && (
            <FormControl fullWidth required>
              <InputLabel>{t('company')}</InputLabel>
              <Select
                value={selectedCompanyId}
                onChange={(e) => {
                  const companyId = e.target.value as number;
                  setSelectedCompanyId(companyId);
                  setBranchId(-1);
                  if (companyId && companyId !== -1) {
                    fetchBranches(companyId);
                  } else {
                    setFetchedBranches([]);
                  }
                }}
                label={t('company')}
                disabled={loadingCompanies || isEditMode}
              >
                {loadingCompanies ? (
                  <MenuItem disabled>{t('loading')}</MenuItem>
                ) : companies.length > 0 ? (
                  companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>{t('no.companies.found')}</MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          {!isBranchAdmin && isAdminView && (
            <FormControl fullWidth required>
              <InputLabel>{t('branch')}</InputLabel>
              <Select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value as number)}
                label={t('branch')}
                disabled={
                  loadingBranches ||
                  isEditMode ||
                  (isSuperAdmin && selectedCompanyId <= 0)
                }
              >
                {loadingBranches ? (
                  <MenuItem disabled>{t('loading')}</MenuItem>
                ) : fetchedBranches.length > 0 ? (
                  fetchedBranches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>{t('no.branches.found')}</MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          <TextField
            label={t('description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            inputProps={{ maxLength: 50 }}
            helperText={`${description.length}/50`}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="primary"
              />
            }
            label={t('active')}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                color="primary"
              />
            }
            label={t('default.warehouse')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading ||
            !name.trim() ||
            (!isEditMode && !isBranchAdmin && branchId === -1)
          }
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : isEditMode ? (
            t('update')
          ) : (
            t('save')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarehouseDialog;
