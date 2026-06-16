import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import FileUploadCard from '../FileUploadCard';
import { useTranslation } from 'react-i18next';
import { Company } from '@/types/Company.interface';
import { Role } from '@/enums/role';
import { Category } from '@/types/Category.interface';
import { CategoryStatus } from '@/enums/category-status';
import { companyService } from '@/data/companyService';
import { useUserViewMode } from '@/hooks/useUserViewMode';

type CategoryDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  category?: Category | null;
  onSave: (category: {
    name: string;
    imageFile: File | null;
    companyId?: number;
    status?: CategoryStatus;
  }) => Promise<void>;
};

const CategoryDialog = ({
  open,
  onClose,
  onSave,
  error,
  category
}: CategoryDialogProps) => {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [status, setStatus] = useState<CategoryStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const { t } = useTranslation();
  const {
    role: userRole,
    company,
    isSuperAdmin,
    isCompanyAdmin
  } = useUserViewMode();
  const userCompanyId = company?.id;
  const isEditMode = !!category;

  const showCompanyField = isSuperAdmin;

  const resetForm = () => {
    setName('');
    setImageFile(null);
    setCompanyId(isCompanyAdmin && userCompanyId ? userCompanyId : '');
    setStatus('');
  };

  const fetchCompanies = async () => {
    if (userRole === Role.SUPER_ADMIN) {
      try {
        setFetchingData(true);
        const result = await companyService.getAllFlat({ getAll: true });
        setCompanies(result || []);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
      } finally {
        setFetchingData(false);
      }
    } else if (isCompanyAdmin && userCompanyId && company) {
      // For company admins, set their own company
      setCompanies([
        {
          id: userCompanyId,
          name: company.name
        } as Company
      ]);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCompanies();

      if (isEditMode && category) {
        setName(category.name || '');
        setCompanyId(category.company?.id || '');
        setStatus((category.status as CategoryStatus) || '');
      } else {
        resetForm();
        // Set company ID automatically for company admins
        if (isCompanyAdmin && userCompanyId) {
          setCompanyId(userCompanyId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category, isEditMode, isCompanyAdmin, userCompanyId]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (loading) return;

    // For company categories, we need companyId (only for create mode)
    if (
      !isEditMode &&
      ((showCompanyField && companyId === '') ||
        (isCompanyAdmin && !userCompanyId && companyId === ''))
    )
      return;

    try {
      setLoading(true);
      await onSave({
        name,
        imageFile,
        ...(!isEditMode && {
          companyId:
            isCompanyAdmin && userCompanyId
              ? userCompanyId
              : companyId !== ''
                ? Number(companyId)
                : undefined
        }),
        ...(isEditMode && status && { status: status as CategoryStatus })
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="category-dialog"
    >
      <DialogTitle>
        {isEditMode ? t('edit.category') : t('new.category')}
        {isEditMode && ` - ${category?.name}`}
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
          label={t('name')}
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {(showCompanyField || isCompanyAdmin) && !isEditMode && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="company-select-label">{t('company')}</InputLabel>
            <Select
              labelId="company-select-label"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value as number)}
              label={t('company')}
              disabled={fetchingData || (isCompanyAdmin && !!userCompanyId)}
            >
              {fetchingData && companies.length === 0 ? (
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

        {isEditMode && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="status-select-label">{t('status')}</InputLabel>
            <Select
              labelId="status-select-label"
              value={status}
              onChange={(e) => setStatus(e.target.value as CategoryStatus)}
              label={t('status')}
            >
              {Object.values(CategoryStatus).map((statusOption) => (
                <MenuItem key={statusOption} value={statusOption}>
                  {t(statusOption.toLowerCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FileUploadCard
          onFileSelect={(file) => {
            setImageFile(file);
          }}
          imageUrl={isEditMode ? category?.file?.url : undefined}
          key={category?.id || 'new'}
          helperText={isEditMode ? t('edit.image.helper.text') : undefined}
          accept="image/*"
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
          disabled={loading || fetchingData}
          className="category-dialog-cancel-button"
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={
            !name ||
            (!imageFile && !isEditMode) ||
            (!isEditMode && showCompanyField && companyId === '') ||
            (!isEditMode &&
              isCompanyAdmin &&
              !userCompanyId &&
              companyId === '') ||
            loading ||
            fetchingData
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

export default CategoryDialog;
