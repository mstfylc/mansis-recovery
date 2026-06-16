import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid
} from '@mui/material';
import { Branch } from '@/types/Branch.interface';
import FileUploadCard from '../FileUploadCard';
import { useTranslation } from 'react-i18next';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Activity } from '@/types/Activity.interface';
import { ActivityStatus } from '@/enums/activity-status';
import { Company } from '@/types/Company.interface';
import { Role } from '@/enums/role';

type ActivityDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  activity?: Activity | null;
  onSave: (activity: {
    title: string;
    description?: string;
    branchId: number;
    imageFile?: File | null;
    status?: ActivityStatus;
  }) => Promise<void>;
};

const ActivityDialog = ({
  open,
  onClose,
  onSave,
  error,
  activity
}: ActivityDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState<number>(-1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.ACTIVE);
  const [loading, setLoading] = useState(false);
  const [fetchedBranches, setFetchedBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(-1);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const { t } = useTranslation();
  const { role: userRole, currentBranch, isAdminView } = useUserViewMode();

  const isEditMode = !!activity;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBranchId(-1);
    setImageFile(null);
    setSelectedCompanyId(-1);
    setFetchedBranches([]);
    setStatus(ActivityStatus.ACTIVE);
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

    if (isEditMode && activity) {
      setTitle(activity.title || '');
      setDescription(activity.description || '');
      setBranchId(activity.branchId || -1);
      setStatus(activity.status || ActivityStatus.ACTIVE);

      if (activity.branch?.company?.id) {
        setSelectedCompanyId(activity.branch.company.id);
      }
    } else {
      resetForm();
    }

    if (userRole === Role.SUPER_ADMIN) {
      fetchCompanies();
    } else if (userRole === Role.COMPANY_ADMIN) {
      const companyId = currentBranch?.company?.id;
      if (companyId) {
        fetchBranches(companyId);
      }
      if (!isAdminView && currentBranch?.id) {
        setBranchId(currentBranch.id);
      }
    } else if (userRole === Role.BRANCH_ADMIN) {
      const branchId = currentBranch?.id;
      if (branchId !== undefined) {
        setBranchId(branchId);
      }
    }
  }, [open, userRole, currentBranch, activity, isEditMode]);

  useEffect(() => {
    if (selectedCompanyId > 0) {
      fetchBranches(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const handleSave = async () => {
    if (loading) return;

    try {
      setLoading(true);
      let finalBranchId = branchId;

      if (userRole === Role.BRANCH_ADMIN) {
        const userBranchId = currentBranch?.id; // SAFE
        if (userBranchId !== undefined) {
          finalBranchId = userBranchId as number;
        }
      }

      if (finalBranchId === -1 && userRole === Role.BRANCH_ADMIN) {
        console.error('Branch ID is required but not available');
        return;
      }

      await onSave({
        title,
        description,
        branchId: finalBranchId,
        imageFile,
        status
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? t('edit.activity') : t('new.activity')}
        {isEditMode && ` - ${activity?.title}`}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          required
          autoFocus
          margin="dense"
          label={t('title')}
          type="text"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          margin="dense"
          label={t('description')}
          type="description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
        />

        {isEditMode && (
          <FormControl fullWidth margin="dense">
            <InputLabel>{t('status')}</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ActivityStatus)}
              label={t('status')}
            >
              {Object.values(ActivityStatus).map((statusOption) => (
                <MenuItem key={statusOption} value={statusOption}>
                  {t(statusOption.toLowerCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {userRole === Role.SUPER_ADMIN && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('company')}</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value as number)}
              label={t('company')}
              disabled={loadingCompanies}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {userRole !== Role.BRANCH_ADMIN && isAdminView && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('branch')}</InputLabel>
            <Select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value as number)}
              label={t('branch')}
              disabled={
                loadingBranches ||
                (userRole === Role.SUPER_ADMIN && selectedCompanyId <= 0)
              }
            >
              {(userRole === Role.SUPER_ADMIN
                ? fetchedBranches
                : userRole === Role.COMPANY_ADMIN
                  ? fetchedBranches
                  : fetchedBranches
              ).map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Grid item xs={12}>
          <FileUploadCard
            onFileSelect={(file) => {
              setImageFile(file);
            }}
            imageUrl={activity?.file?.url}
            accept="image/*"
            helperText={isEditMode ? t('edit.image.helper.text') : undefined}
          />
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
          disabled={loading}
          className="activity-dialog-cancel-button"
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          disabled={
            !title ||
            (userRole !== Role.BRANCH_ADMIN && branchId === -1) ||
            loading
          }
          variant="contained"
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

export default ActivityDialog;
