import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import {
  LoyaltyProductDialogProps,
  CreateBranchLoyaltyProductDto,
  UpdateBranchLoyaltyProductDto
} from '@/types/Loyalty.interface';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { user$ } from '@/store/userStore';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { companyProductService } from '@/data/companyProductService';

const LoyaltyProductDialog = ({
  open,
  onClose,
  editingProduct,
  existingProducts,
  onCreateProduct,
  onUpdateProduct
}: LoyaltyProductDialogProps) => {
  const { t } = useTranslation();
  const { isSuperAdmin, isCompanyAdmin, isBranchAdmin, isAdminView } =
    useUserViewMode();
  const currentBranch = user$.currentBranch.get();
  const currentCompanyId = user$.company.get()?.id;

  const [selectedProduct, setSelectedProduct] = useState<CompanyProduct | null>(
    null
  );
  const [pointCost, setPointCost] = useState<number>(100);
  const [saving, setSaving] = useState(false);

  // Company selector state (SuperAdmin only)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');

  // Branch selector state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Product list state (fetched internally)
  const [availableProducts, setAvailableProducts] = useState<CompanyProduct[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = useState(false);

  const filteredAvailableProducts = availableProducts.filter(
    (p) =>
      !existingProducts.some(
        (lp) => lp.companyProductId === p.id && lp.branchId === selectedBranchId
      )
  );

  const fetchCompanies = async () => {
    try {
      const result = await companyService.getAllFlat({
        status: 'active',
        getAll: true
      });
      setCompanies(result || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchBranches = async (companyId?: number) => {
    try {
      setLoadingBranches(true);
      const params: Record<string, any> = { getAll: true };
      if (companyId) params.companyId = companyId;
      const result = await branchService.getAllFlat(params as any);
      setBranches(
        Array.isArray(result) ? result : (result as any)?.items || []
      );
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchProducts = async (companyId: number) => {
    try {
      setLoadingProducts(true);
      const result = await companyProductService.getAll({
        companyId,
        status: 'ACTIVE',
        isForSale: true,
        limit: 1000
      });
      setAvailableProducts(result?.items || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCompanyChange = (event: SelectChangeEvent<number | ''>) => {
    const companyId = event.target.value as number;
    setSelectedCompanyId(companyId);
    setSelectedProduct(null);
    setAvailableProducts([]);
    setSelectedBranchId('');
    setBranches([]);
    if (companyId) {
      fetchProducts(companyId);
      fetchBranches(companyId);
    }
  };

  const handleBranchChange = (event: SelectChangeEvent<number | ''>) => {
    setSelectedBranchId(event.target.value as number);
  };

  // Auto-fill branchId in Branch View or for BRANCH_ADMIN
  useEffect(() => {
    if ((!isAdminView || isBranchAdmin) && currentBranch?.id) {
      setSelectedBranchId(currentBranch.id);
    }
  }, [isAdminView, isBranchAdmin, currentBranch]);

  const resetDialogState = () => {
    setSelectedProduct(null);
    setSelectedCompanyId('');
    setAvailableProducts([]);
    setBranches([]);
  };

  const initCreateMode = () => {
    if (isSuperAdmin) {
      fetchCompanies();
      setSelectedBranchId('');
      return;
    }

    if (isCompanyAdmin && isAdminView) {
      setSelectedBranchId('');
      if (currentCompanyId) {
        fetchProducts(currentCompanyId);
        fetchBranches(currentCompanyId);
      }
      return;
    }

    // Branch view or BRANCH_ADMIN: auto-fill branch
    if (currentBranch?.id) {
      setSelectedBranchId(currentBranch.id);
      const companyId = currentBranch.companyId || currentCompanyId;
      if (companyId) fetchProducts(companyId);
    }
  };

  const handleEnter = () => {
    resetDialogState();
    if (editingProduct) {
      setPointCost(editingProduct.pointCost);
      setSelectedBranchId(editingProduct.branchId || '');
    } else {
      setPointCost(100);
      initCreateMode();
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedProduct(null);
    setPointCost(100);
    setSelectedCompanyId('');
    setSelectedBranchId('');
    setAvailableProducts([]);
    setCompanies([]);
    setBranches([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingProduct) {
        if (!editingProduct.branchId) return;
        const updateDto: UpdateBranchLoyaltyProductDto = {
          pointCost
        };
        await onUpdateProduct(
          editingProduct.id,
          editingProduct.branchId,
          updateDto
        );
      } else {
        if (!selectedProduct) return;
        if (!selectedBranchId) return;
        const createDto: CreateBranchLoyaltyProductDto = {
          companyProductId: selectedProduct.id,
          pointCost,
          branchId: selectedBranchId
        };
        await onCreateProduct(createDto);
      }
      handleClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const showBranchSelector =
    !editingProduct && (isSuperAdmin || isCompanyAdmin) && isAdminView;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      TransitionProps={{ onEnter: handleEnter }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {editingProduct
          ? t('loyalty.products.edit')
          : t('loyalty.products.add')}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {/* Company selector - SuperAdmin only, create mode only */}
          {isSuperAdmin && !editingProduct && (
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>{t('company')}</InputLabel>
              <Select
                value={selectedCompanyId}
                onChange={handleCompanyChange}
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

          {/* Branch selector - Admin view only */}
          {showBranchSelector && (
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>{t('branch')}</InputLabel>
              <Select
                value={selectedBranchId}
                onChange={handleBranchChange}
                label={t('branch')}
                disabled={
                  (isSuperAdmin && !selectedCompanyId) || loadingBranches
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

          {/* Branch info for BRANCH_ADMIN */}
          {isBranchAdmin && currentBranch && !editingProduct && (
            <TextField
              fullWidth
              label={t('branch')}
              value={currentBranch.name}
              disabled
              sx={{ mb: 2 }}
            />
          )}

          {!editingProduct && (
            <Autocomplete
              options={filteredAvailableProducts}
              getOptionLabel={(option) => option.name}
              value={selectedProduct}
              onChange={(_, newValue) => setSelectedProduct(newValue)}
              disabled={(isSuperAdmin && !selectedCompanyId) || loadingProducts}
              loading={loadingProducts}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;
                return options.filter((option) =>
                  option.name.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('loyalty.products.select.product')}
                  fullWidth
                  sx={{ mb: 2 }}
                  placeholder={
                    isSuperAdmin && !selectedCompanyId
                      ? t('select.company.first')
                      : t('search')
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingProducts ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {option.file?.url && (
                      <CustomImageComponent
                        imageUrl={option.file.url}
                        alt={option.name}
                        width={30}
                        height={30}
                      />
                    )}
                    <Box>
                      <Typography>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.basePrice?.toFixed(2)} ₺
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            />
          )}

          <NumericInput
            fullWidth
            label={t('loyalty.point.cost')}
            value={pointCost}
            onChange={setPointCost}
            allowDecimals={false}
            allowNegative={false}
            min={1}
            max={100000}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            saving ||
            (!editingProduct && !selectedProduct) ||
            (!editingProduct && !selectedBranchId)
          }
        >
          {saving ? <CircularProgress size={24} /> : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoyaltyProductDialog;
