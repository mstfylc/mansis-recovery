import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Company } from '@/types/Company.interface';
import FileUploadCard from '../FileUploadCard';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Branch } from '@/types/Branch.interface';
import { BranchStatus } from '@/enums/branch-status';

type BranchDialogProps = {
  companies: Partial<Company>[];
  open: boolean;
  onClose: () => void;
  error?: string;
  branch?: Branch | null;
  onSave: (branch: {
    name: string;
    companyId: number;
    mapcode?: string;
    imageFile?: File | null;
    status?: BranchStatus;
  }) => Promise<void>;
};

const BranchDialog = ({
  companies = [],
  open,
  onClose,
  onSave,
  error,
  branch
}: BranchDialogProps) => {
  const { isCompanyAdmin, company } = useUserViewMode();
  const userCompanyId = company?.id ?? -1;

  const isEditMode = !!branch;
  const [name, setName] = useState('');
  const [mapcode, setMapcode] = useState('');
  const [companyId, setCompanyId] = useState<number>(
    isCompanyAdmin ? userCompanyId : -1
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );
  const [status, setStatus] = useState<BranchStatus | ''>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && branch) {
      setName(branch.name || '');
      setMapcode(branch.mapcode || '');
      setCompanyId(branch.company?.id || (isCompanyAdmin ? userCompanyId : -1));
      setImageFile(null);
      setStatus(branch.status || '');
      setCurrentImageUrl(branch.file?.url || null);
    } else {
      resetForm();
    }
    setValidationError(undefined);
  }, [branch, isEditMode, open]);

  const resetForm = () => {
    setName('');
    setCompanyId(isCompanyAdmin ? userCompanyId : -1);
    setMapcode('');
    setImageFile(null);
    setStatus('');
    setCurrentImageUrl(null);
  };

  const handleClose = () => {
    resetForm();
    setValidationError(undefined);
    onClose();
  };

  const handleSave = async () => {
    if (!name) {
      setValidationError('Branch name is required.');
      return;
    }
    if (!isCompanyAdmin && (!companyId || companyId === -1)) {
      setValidationError('Company is required.');
      return;
    }
    try {
      setLoading(true);
      await onSave({
        name,
        companyId: isCompanyAdmin ? userCompanyId : companyId,
        mapcode,
        imageFile,
        ...(isEditMode && status && { status })
      });
    } finally {
      setLoading(false);
    }
  };
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={handleClose} className="branch-dialog">
      <DialogTitle>
        {isEditMode ? t('edit.branch') : t('new.branch')}
        {isEditMode && ` - ${branch?.name}`}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}
        <TextField
          required
          autoFocus
          margin="dense"
          label={t('name')}
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          margin="dense"
          label={t('mapcode')}
          type="text"
          fullWidth
          value={mapcode}
          onChange={(e) => setMapcode(e.target.value)}
        />
        {isEditMode && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="status-select-label">{t('status')}</InputLabel>
            <Select
              labelId="status-select-label"
              value={status}
              onChange={(e) => setStatus(e.target.value as BranchStatus)}
              label={t('status')}
            >
              {Object.values(BranchStatus).map((statusOption) => (
                <MenuItem key={statusOption} value={statusOption}>
                  {t(statusOption.toLowerCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {!isCompanyAdmin && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('company')}</InputLabel>
            <Select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value as number)}
              label={t('company')}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <FileUploadCard
          onFileSelect={(file) => {
            setImageFile(file);
          }}
          imageUrl={currentImageUrl}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
          disabled={loading}
          className="branch-dialog-cancel-button"
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          disabled={!name || (!isCompanyAdmin && !companyId) || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BranchDialog;
