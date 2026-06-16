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
  Box,
  MenuItem,
  InputLabel,
  FormControl,
  Select
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import StyledDatePicker from '../date&time/StyledDatePicker';
import FileUploadCard from '../FileUploadCard';
import NumericInput from '../NumericInput';
import { CampaignType } from '@/enums/campaign-type';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Campaign } from '@/types/Campaign.interface';
import { CampaignStatus } from '@/enums/campaign-status';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import { categoryService } from '@/data/categoryService';
import { Category } from '@/types/Category.interface';

type CampaignDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  campaign?: Campaign | null;
  onSave: (campaign: {
    title: string;
    description: string;
    discount: number;
    startDateTime: Date;
    endDateTime: Date;
    type: CampaignType;
    imageFile?: File | null;
    branchId: number;
    status?: CampaignStatus;
    bundlePrice?: number;
    bundleTotalCount?: number;
    categoryId?: number;
  }) => Promise<void>;
};

const CampaignDialog = ({
  open,
  onClose,
  onSave,
  error,
  campaign
}: CampaignDialogProps) => {
  const { t } = useTranslation();
  const {
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    isAdminView,
    company,
    currentBranch
  } = useUserViewMode();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType | ''>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [fetchingCompanies, setFetchingCompanies] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [bundlePrice, setBundlePrice] = useState<number | ''>('');
  const [bundleTotalCount, setBundleTotalCount] = useState<number | ''>('');
  const [status, setStatus] = useState<CampaignStatus | ''>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );
  const isEditMode = !!campaign;
  const isBundleType =
    campaignType === CampaignType.BUNDLE_PRODUCT ||
    campaignType === CampaignType.BUNDLE_ACTIVITY;
  const isBundleActivity = campaignType === CampaignType.BUNDLE_ACTIVITY;

  useEffect(() => {
    if (open) {
      if (isEditMode && campaign) {
        // Populate form with campaign data
        setTitle(campaign.title || '');
        setDescription(campaign.description || '');
        setDiscount(campaign.discount || 0);
        setStartDateTime(new Date(campaign.startDateTime));
        setEndDateTime(
          campaign.endDateTime ? new Date(campaign.endDateTime) : new Date()
        );
        setCampaignType(campaign.type || '');
        setStatus(campaign.status || '');
        setCurrentImageUrl(campaign.file?.url || null);

        if (
          campaign.campaignCategories &&
          campaign.campaignCategories.length > 0
        ) {
          setSelectedCategoryId(campaign.campaignCategories[0].categoryId);
        }

        if (campaign.campaignBundle?.bundle) {
          setBundlePrice(campaign.campaignBundle.bundle.price || '');
          setBundleTotalCount(campaign.campaignBundle.bundle.totalCount || '');
        }

        if (campaign.branch) {
          setSelectedBranchId(campaign.branch.id);
          if (campaign.branch.company && campaign.branch.company.id) {
            setSelectedCompanyId(campaign.branch.company.id);
            fetchBranches(campaign.branch.company.id);
          }
        }
      } else {
        resetForm();
      }

      if (isSuperAdmin) {
        fetchCompanies();
      } else if (isCompanyAdmin && company?.id) {
        fetchBranches(company.id);
      }
    }
    setValidationError(undefined);
  }, [open, isEditMode, campaign, isSuperAdmin, isCompanyAdmin, company]);

  const fetchCompanies = async () => {
    try {
      setFetchingCompanies(true);
      const data = await companyService.getAll({});
      setCompanies(data.items || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setFetchingCompanies(false);
    }
  };

  const fetchBranches = async (companyId: number) => {
    try {
      setFetchingBranches(true);
      const result = await branchService.getAllFlat({ companyId });
      setBranches(result || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setFetchingBranches(false);
    }
  };

  const fetchCategories = async (companyId: number) => {
    try {
      setFetchingCategories(true);
      const result = await categoryService.getAllFlat({
        companyId,
        getAll: true
      });
      setCategories(result || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setFetchingCategories(false);
    }
  };

  useEffect(() => {
    if (!open || campaignType !== CampaignType.CATEGORY) {
      setCategories([]);
      setSelectedCategoryId('');
      return;
    }
    let companyId: number | undefined;
    if (isSuperAdmin) {
      companyId =
        typeof selectedCompanyId === 'number' ? selectedCompanyId : undefined;
    } else if (isCompanyAdmin) {
      companyId = company?.id;
    } else {
      companyId = currentBranch?.companyId;
    }
    if (companyId) {
      fetchCategories(companyId);
    } else {
      setCategories([]);
    }
  }, [campaignType, selectedCompanyId, open]);

  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setSelectedBranchId('');
    if (companyId) {
      fetchBranches(companyId);
    } else {
      setBranches([]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDiscount(0);
    setStartDateTime(new Date());
    setEndDateTime(new Date());
    setImageFile(null);
    setCampaignType('');
    setSelectedCompanyId('');
    setSelectedBranchId('');
    setBranches([]);
    setBundlePrice('');
    setBundleTotalCount('');
    setStatus('');
    setCurrentImageUrl(null);
    setSelectedCategoryId('');
    setCategories([]);
  };

  const handleClose = () => {
    resetForm();
    setValidationError(undefined);
    onClose();
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDateTime(date);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setEndDateTime(date);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title) {
      setValidationError(t('campaign.title.required'));
      return;
    }
    if (!description) {
      setValidationError(t('campaign.description.required'));
      return;
    }
    if (!campaignType) {
      setValidationError(t('campaign.type.required'));
      return;
    }
    if (!isEditMode && !imageFile) {
      setValidationError(t('campaign.image.required'));
      return;
    }
    if (
      isBundleType &&
      campaignType === CampaignType.BUNDLE_PRODUCT &&
      (bundlePrice === '' || bundleTotalCount === '')
    ) {
      setValidationError(t('campaign.bundle.details.required'));
      return;
    }
    if (campaignType === CampaignType.CATEGORY && selectedCategoryId === '') {
      setValidationError(t('campaign.category.required'));
      return;
    }

    let branchId: number = -1;

    if (isBranchAdmin && currentBranch?.id) {
      branchId = currentBranch.id;
    } else if (typeof selectedBranchId === 'number') {
      branchId = selectedBranchId;
    } else {
      setValidationError(t('campaign.branch.required'));
      return;
    }

    try {
      setLoading(true);
      await onSave({
        title,
        description,
        discount,
        startDateTime,
        endDateTime,
        type: campaignType as CampaignType,
        imageFile,
        branchId,
        ...(isEditMode && status && { status: status as CampaignStatus }),
        ...(isBundleType && {
          bundlePrice:
            typeof bundlePrice === 'string'
              ? parseFloat(bundlePrice)
              : bundlePrice,
          bundleTotalCount:
            typeof bundleTotalCount === 'string'
              ? parseInt(bundleTotalCount.toString())
              : bundleTotalCount
        }),
        ...(campaignType === CampaignType.CATEGORY &&
          selectedCategoryId !== '' && {
            categoryId: selectedCategoryId as number
          })
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} className="campaign-dialog">
      <DialogTitle>
        {isEditMode ? t('edit.campaign') : t('new.campaign')}
        {isEditMode && ` - ${campaign?.title}`}
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
          label={t('title')}
          type="text"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          required
          margin="dense"
          label={t('description')}
          type="text"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <NumericInput
          required
          margin="dense"
          label={t('discount.percentage')}
          fullWidth
          value={discount}
          onChange={(value) => setDiscount(value)}
          helperText={t('discount.percentage.helper')}
          min={0}
          max={100}
          showEmptyForZero={false}
        />
        <FormControl fullWidth margin="dense" required>
          <InputLabel>{t('campaign.type')}</InputLabel>
          <Select
            value={campaignType}
            onChange={(e) => setCampaignType(e.target.value as CampaignType)}
            label={t('campaign.type')}
            disabled={isEditMode} // Disable type change in edit mode
          >
            {Object.values(CampaignType).map((type) => {
              const translationKey = type.toLowerCase().replace('_', '.');
              return (
                <MenuItem key={type} value={type}>
                  {t(translationKey)}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {isEditMode && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('status')}</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as CampaignStatus)}
              label={t('status')}
            >
              {Object.values(CampaignStatus).map((statusOption) => (
                <MenuItem key={statusOption} value={statusOption}>
                  {t(statusOption.toLowerCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Bundle fields when bundle campaign type is selected */}
        {isBundleType && (
          <>
            <TextField
              required
              margin="dense"
              label={t('bundle.price')}
              type="number"
              fullWidth
              value={bundlePrice}
              onChange={(e) => {
                const value = e.target.value;
                setBundlePrice(value === '' ? '' : Number(value));
              }}
              inputProps={{ min: 0 }}
            />
            {isBundleActivity && (
              <TextField
                required
                margin="dense"
                label={t('bundle.total.count')}
                type="number"
                fullWidth
                value={bundleTotalCount}
                onChange={(e) => {
                  const value = e.target.value;
                  setBundleTotalCount(value === '' ? '' : Number(value));
                }}
                inputProps={{ min: 1 }}
              />
            )}
          </>
        )}

        {/* Company selection for Super Admin */}
        {isSuperAdmin && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('company')}</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e.target.value as number)}
              label={t('company')}
              disabled={fetchingCompanies || isEditMode}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Branch selection for Super Admin and Company Admin */}
        {(isSuperAdmin || isCompanyAdmin) && isAdminView && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('branch')}</InputLabel>
            <Select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value as number)}
              label={t('branch')}
              disabled={
                fetchingBranches ||
                (isSuperAdmin && !selectedCompanyId) ||
                isEditMode
              }
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Category selection for CATEGORY campaign type */}
        {campaignType === CampaignType.CATEGORY && (
          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('category')}</InputLabel>
            <Select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value as number)}
              label={t('category')}
              disabled={fetchingCategories}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <StyledDatePicker
            label={t('start.date')}
            selected={startDateTime}
            onChange={handleStartDateChange}
            required
          />

          <StyledDatePicker
            label={t('end.date')}
            selected={endDateTime}
            onChange={handleEndDateChange}
            minDate={startDateTime}
          />
        </Box>
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
          className="campaign-dialog-cancel-button"
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CampaignDialog;
