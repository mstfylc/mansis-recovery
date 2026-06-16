import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  Autocomplete,
  Collapse,
  Switch,
  FormControlLabel
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Category';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import ProductCategoryPickerModal from '@/components/dialogs/ProductCategoryPickerModal';
import {
  VoucherRewardType,
  CreateVoucherTemplateDto,
  UpdateVoucherTemplateDto,
  RewardGroupDto,
  VoucherTemplateDialogProps,
  VoucherTemplateFormData
} from '@/types/Voucher.interface';
import {
  createEmptyRewardGroup,
  getDefaultFormData
} from '@/utils/voucherHelpers';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { user$ } from '@/store/userStore';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { companyProductService } from '@/data/companyProductService';
import RewardGroupAccordion from './RewardGroupAccordion';

const VoucherTemplateDialog = ({
  open,
  onClose,
  editingTemplate,
  onCreateTemplate,
  onUpdateTemplate
}: VoucherTemplateDialogProps) => {
  const { t } = useTranslation();
  const { isSuperAdmin, isCompanyAdmin, isBranchAdmin, isAdminView } =
    useUserViewMode();
  const currentBranch = user$.currentBranch.get();
  const currentCompanyId = user$.company.get()?.id;

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [formData, setFormData] =
    useState<VoucherTemplateFormData>(getDefaultFormData());

  const [expandedGroups, setExpandedGroups] = useState<number[]>([0]);

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productPickerGroupIndex, setProductPickerGroupIndex] = useState<
    number | null
  >(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [availableProducts, setAvailableProducts] = useState<CompanyProduct[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchCompanies = async () => {
    try {
      const result = await companyService.getAllFlat({
        status: 'active',
        getAll: true
      });
      setCompanies(result || []);
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCompanyChange = (event: SelectChangeEvent<number | ''>) => {
    const companyId = event.target.value as number;
    setSelectedCompanyId(companyId);
    setAvailableProducts([]);
    setSelectedBranchId('');
    setBranches([]);
    setFormData((prev) => ({ ...prev, triggerProductId: undefined }));
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
    setFormData(getDefaultFormData());
    setExpandedGroups([0]);
    setValidationError(null);
    setSelectedCompanyId('');
    setAvailableProducts([]);
    setCompanies([]);
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

    if (currentBranch?.id) {
      setSelectedBranchId(currentBranch.id);
      const companyId = currentBranch.companyId || currentCompanyId;
      if (companyId) fetchProducts(companyId);
    }
  };

  const initEditMode = () => {
    if (!editingTemplate) return;

    if (editingTemplate.branchId) {
      setSelectedBranchId(editingTemplate.branchId);
    }

    const companyId =
      editingTemplate.companyId ||
      editingTemplate.branch?.company?.id ||
      currentBranch?.companyId ||
      currentCompanyId;
    if (companyId) {
      fetchProducts(companyId);
    }
  };

  const handleClose = () => {
    resetDialogState();
    onClose();
  };

  const handleEnter = () => {
    resetDialogState();
    if (editingTemplate) {
      const rewardGroups: RewardGroupDto[] =
        editingTemplate.rewardGroups && editingTemplate.rewardGroups.length > 0
          ? editingTemplate.rewardGroups.map((g, idx) => ({
              name: g.name,
              description: g.description || '',
              rewardQuantity: g.rewardQuantity,
              sortOrder: g.sortOrder ?? idx,
              products: g.products.map((p, pIdx) => ({
                productId: p.productId,
                customPrice: p.customPrice,
                sortOrder: p.sortOrder ?? pIdx
              }))
            }))
          : [createEmptyRewardGroup(0)];

      const triggerProdId =
        editingTemplate.triggerProductId || editingTemplate.triggerProduct?.id;

      setFormData({
        name: editingTemplate.name,
        description: editingTemplate.description || '',
        triggerProductId: triggerProdId,
        triggerMinQuantity: editingTemplate.triggerMinQuantity,
        rewardType: editingTemplate.rewardType,
        discountPercent: editingTemplate.discountPercent,
        discountAmount: editingTemplate.discountAmount,
        rewardGroups,
        validityDays: editingTemplate.validityDays,
        maxUsagePerUser: editingTemplate.maxUsagePerUser,
        totalMaxUsage: editingTemplate.totalMaxUsage,
        startDate: editingTemplate.startDate,
        endDate: editingTemplate.endDate,
        isActive: editingTemplate.isActive
      });
      setExpandedGroups(rewardGroups.map((_, i) => i));

      initEditMode();
    } else {
      initCreateMode();
    }
  };

  const handleAddRewardGroup = useCallback(() => {
    setFormData((prev) => {
      const newIndex = prev.rewardGroups.length;
      setExpandedGroups((prevExpanded) => [...prevExpanded, newIndex]);
      return {
        ...prev,
        rewardGroups: [...prev.rewardGroups, createEmptyRewardGroup(newIndex)]
      };
    });
  }, []);

  const handleRemoveRewardGroup = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.rewardGroups.length <= 1) return prev;
      return {
        ...prev,
        rewardGroups: prev.rewardGroups
          .filter((_, i) => i !== index)
          .map((g, i) => ({ ...g, sortOrder: i }))
      };
    });
    setExpandedGroups((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  }, []);

  const handleUpdateRewardGroup = useCallback(
    (index: number, updates: Partial<RewardGroupDto>) => {
      setFormData((prev) => ({
        ...prev,
        rewardGroups: prev.rewardGroups.map((g, i) =>
          i === index ? { ...g, ...updates } : g
        )
      }));
    },
    []
  );

  const handleAddProductToGroup = useCallback(
    (groupIndex: number, productId: number) => {
      setFormData((prev) => {
        const group = prev.rewardGroups[groupIndex];
        if (group.products.some((p) => p.productId === productId)) return prev;
        return {
          ...prev,
          rewardGroups: prev.rewardGroups.map((g, i) =>
            i === groupIndex
              ? {
                  ...g,
                  products: [
                    ...g.products,
                    { productId, sortOrder: g.products.length }
                  ]
                }
              : g
          )
        };
      });
    },
    []
  );

  const handleRemoveProductFromGroup = useCallback(
    (groupIndex: number, productId: number) => {
      setFormData((prev) => ({
        ...prev,
        rewardGroups: prev.rewardGroups.map((g, i) =>
          i === groupIndex
            ? {
                ...g,
                products: g.products.filter((p) => p.productId !== productId)
              }
            : g
        )
      }));
    },
    []
  );

  const handleOpenProductPicker = useCallback((groupIndex: number) => {
    setProductPickerGroupIndex(groupIndex);
    setProductPickerOpen(true);
  }, []);

  const handleProductsSelectedFromPicker = (productIds: number[]) => {
    if (productPickerGroupIndex === null) return;

    const group = formData.rewardGroups[productPickerGroupIndex];
    const existingProductIds = group.products.map((p) => p.productId);
    const newProductIds = productIds.filter(
      (id) => !existingProductIds.includes(id)
    );

    if (newProductIds.length > 0) {
      handleUpdateRewardGroup(productPickerGroupIndex, {
        products: [
          ...group.products,
          ...newProductIds.map((productId, idx) => ({
            productId,
            sortOrder: group.products.length + idx
          }))
        ]
      });
    }

    setProductPickerOpen(false);
    setProductPickerGroupIndex(null);
  };

  const handleToggleGroupExpand = useCallback((index: number) => {
    setExpandedGroups((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const getProductById = useCallback(
    (productId: number): CompanyProduct | undefined =>
      availableProducts.find((p) => p.id === productId),
    [availableProducts]
  );

  const handleSave = async () => {
    setValidationError(null);

    if (!selectedBranchId) {
      setValidationError(t('voucher.validation.branch.required'));
      return;
    }

    if (!formData.name.trim()) {
      setValidationError(t('voucher.validation.name.required'));
      return;
    }
    if (
      formData.rewardType === 'PERCENT_DISCOUNT' &&
      !formData.discountPercent
    ) {
      setValidationError(t('voucher.validation.discount.percent.required'));
      return;
    }
    if (formData.rewardType === 'FIXED_DISCOUNT' && !formData.discountAmount) {
      setValidationError(t('voucher.validation.discount.amount.required'));
      return;
    }
    if (formData.rewardGroups.length === 0) {
      setValidationError(t('voucher.validation.groups.required'));
      return;
    }

    for (const group of formData.rewardGroups) {
      if (!group.name.trim()) {
        setValidationError(t('voucher.validation.group.name.required'));
        return;
      }
      if (group.products.length === 0) {
        setValidationError(
          t('voucher.validation.group.products.required', { group: group.name })
        );
        return;
      }
    }

    try {
      setSaving(true);

      const dto: CreateVoucherTemplateDto = {
        name: formData.name,
        description: formData.description || undefined,
        triggerProductId: formData.triggerProductId,
        triggerMinQuantity: formData.triggerMinQuantity,
        rewardType: formData.rewardType,
        discountPercent:
          formData.rewardType === 'PERCENT_DISCOUNT'
            ? formData.discountPercent
            : undefined,
        discountAmount:
          formData.rewardType === 'FIXED_DISCOUNT'
            ? formData.discountAmount
            : undefined,
        rewardGroups: formData.rewardGroups,
        validityDays: formData.validityDays,
        maxUsagePerUser: formData.maxUsagePerUser || undefined,
        totalMaxUsage: formData.totalMaxUsage || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive
      };

      const branchId = Number(selectedBranchId);

      if (editingTemplate) {
        await onUpdateTemplate(
          branchId,
          editingTemplate.id,
          dto as UpdateVoucherTemplateDto
        );
      } else {
        await onCreateTemplate(branchId, dto);
      }
      handleClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const showBranchSelector =
    !editingTemplate && (isSuperAdmin || isCompanyAdmin) && isAdminView;

  const effectiveBranchId = selectedBranchId ? Number(selectedBranchId) : null;

  const showBranchSection =
    !editingTemplate && (isSuperAdmin || showBranchSelector || isBranchAdmin);
  const showRestOfForm = !!editingTemplate || !!effectiveBranchId;
  const sectionOffset = showBranchSection ? 1 : 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { borderRadius: 2 } }}
        TransitionProps={{ onEnter: handleEnter }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          }}
        >
          <CardGiftcardIcon />
          <Typography variant="h6" component="span" fontWeight="bold">
            {editingTemplate
              ? t('voucher.templates.edit')
              : t('voucher.templates.add')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {showBranchSection && (
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <SectionHeader number={1} title={t('voucher.branch.section')} />
              <Grid container spacing={2}>
                {isSuperAdmin && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small" required>
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
                  </Grid>
                )}

                {showBranchSelector && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>{t('branch')}</InputLabel>
                      <Select
                        value={selectedBranchId}
                        onChange={handleBranchChange}
                        label={t('branch')}
                        disabled={
                          (isSuperAdmin && !selectedCompanyId) ||
                          loadingBranches
                        }
                      >
                        {branches.map((branch) => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {isBranchAdmin && currentBranch && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('branch')}
                      value={currentBranch.name}
                      disabled
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {showBranchSection && !effectiveBranchId && (
            <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                {t('voucher.select.branch.hint')}
              </Typography>
            </Box>
          )}

          <Collapse in={showRestOfForm} timeout={400}>
            {showBranchSection && <Divider />}

            {/* Section: Basic Info */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <SectionHeader
                number={1 + sectionOffset}
                title={t('voucher.basic.info')}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('name')}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('description')}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Section: Trigger Settings */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <SectionHeader
                number={2 + sectionOffset}
                title={t('voucher.trigger.section')}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Autocomplete
                    options={availableProducts}
                    getOptionLabel={(option) => option.name}
                    size="small"
                    loading={loadingProducts}
                    value={
                      availableProducts.find(
                        (p) => p.id === formData.triggerProductId
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        triggerProductId: newValue?.id
                      }))
                    }
                    filterOptions={(options, { inputValue }) => {
                      if (!inputValue) return options.slice(0, 50);
                      return options.filter((option) =>
                        option.name
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      );
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {option.file?.url && (
                            <CustomImageComponent
                              imageUrl={option.file.url}
                              alt={option.name}
                              width={28}
                              height={28}
                            />
                          )}
                          {option.name}
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('voucher.trigger.product')}
                        helperText={t('voucher.trigger.product.helper')}
                        placeholder={t('search')}
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
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <NumericInput
                    fullWidth
                    size="small"
                    label={t('voucher.trigger.min.quantity')}
                    value={formData.triggerMinQuantity || 1}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        triggerMinQuantity: value
                      }))
                    }
                    allowDecimals={false}
                    allowNegative={false}
                    min={1}
                    max={100}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Section: Reward Settings */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <SectionHeader
                number={3 + sectionOffset}
                title={t('voucher.reward.section')}
              />
              <Grid container spacing={2}>
                <Grid
                  item
                  xs={12}
                  md={formData.rewardType === 'FREE_PRODUCT' ? 12 : 6}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('voucher.reward.type')}</InputLabel>
                    <Select
                      value={formData.rewardType}
                      label={t('voucher.reward.type')}
                      onChange={(e) => {
                        const newType = e.target.value as VoucherRewardType;
                        setFormData((prev) => ({
                          ...prev,
                          rewardType: newType,
                          discountPercent:
                            newType === 'PERCENT_DISCOUNT'
                              ? prev.discountPercent || 10
                              : undefined,
                          discountAmount:
                            newType === 'FIXED_DISCOUNT'
                              ? prev.discountAmount || 10
                              : undefined
                        }));
                      }}
                    >
                      <MenuItem value="FREE_PRODUCT">
                        {t('voucher.reward.type.free.product')}
                      </MenuItem>
                      <MenuItem value="PERCENT_DISCOUNT">
                        {t('voucher.reward.type.percent.discount')}
                      </MenuItem>
                      <MenuItem value="FIXED_DISCOUNT">
                        {t('voucher.reward.type.fixed.discount')}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {formData.rewardType === 'PERCENT_DISCOUNT' && (
                  <Grid item xs={12} md={6}>
                    <NumericInput
                      fullWidth
                      size="small"
                      label={t('voucher.discount.percent')}
                      value={formData.discountPercent || 0}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountPercent: value
                        }))
                      }
                      allowDecimals={false}
                      allowNegative={false}
                      min={1}
                      max={100}
                      InputProps={{
                        endAdornment: (
                          <Typography color="text.secondary">%</Typography>
                        )
                      }}
                    />
                  </Grid>
                )}

                {formData.rewardType === 'FIXED_DISCOUNT' && (
                  <Grid item xs={12} md={6}>
                    <NumericInput
                      fullWidth
                      size="small"
                      label={t('voucher.discount.amount')}
                      value={formData.discountAmount || 0}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountAmount: value
                        }))
                      }
                      allowDecimals={true}
                      allowNegative={false}
                      min={0.01}
                      max={10000}
                      InputProps={{
                        endAdornment: (
                          <Typography color="text.secondary">₺</Typography>
                        )
                      }}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Reward Groups */}
              <Card
                variant="outlined"
                sx={{ mt: 2, borderColor: 'primary.light' }}
              >
                <CardHeader
                  title={
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <GroupIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t('voucher.reward.groups')}
                        </Typography>
                        <Chip
                          label={`${formData.rewardGroups.length} ${t('voucher.groups')}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddRewardGroup}
                        sx={{ borderRadius: 2 }}
                      >
                        {t('voucher.add.group')}
                      </Button>
                    </Box>
                  }
                  subheader={
                    <Typography variant="caption" color="text.secondary">
                      {t('voucher.reward.groups.description')}
                    </Typography>
                  }
                  sx={{ pb: 0, pt: 1.5, px: 2 }}
                />
                <CardContent sx={{ pt: 1, px: 2, pb: 2 }}>
                  {formData.rewardGroups.map((group, groupIndex) => (
                    <RewardGroupAccordion
                      key={groupIndex}
                      group={group}
                      groupIndex={groupIndex}
                      expanded={expandedGroups.includes(groupIndex)}
                      canRemove={formData.rewardGroups.length > 1}
                      availableProducts={availableProducts}
                      branchId={effectiveBranchId}
                      onToggleExpand={handleToggleGroupExpand}
                      onRemove={handleRemoveRewardGroup}
                      onUpdate={handleUpdateRewardGroup}
                      onAddProduct={handleAddProductToGroup}
                      onRemoveProduct={handleRemoveProductFromGroup}
                      onOpenProductPicker={handleOpenProductPicker}
                      getProductById={getProductById}
                      t={t}
                    />
                  ))}

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5, textAlign: 'center' }}
                  >
                    <Box
                      component="span"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {formData.rewardGroups.length}
                    </Box>{' '}
                    {t('voucher.groups')} •{' '}
                    <Box
                      component="span"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {formData.rewardGroups.reduce(
                        (sum, g) => sum + g.rewardQuantity,
                        0
                      )}
                    </Box>{' '}
                    {t('voucher.total.products')}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Divider />

            {/* Section: Validity & Limits */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <SectionHeader
                number={4 + sectionOffset}
                title={`${t('voucher.validity.section')} & ${t('voucher.usage.limits')}`}
              />
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={6} md={3}>
                  <NumericInput
                    fullWidth
                    size="small"
                    label={t('voucher.validity.days')}
                    value={formData.validityDays || 30}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, validityDays: value }))
                    }
                    allowDecimals={false}
                    allowNegative={false}
                    min={1}
                    max={365}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label={t('start.date')}
                    value={formData.startDate.split('T')[0]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: new Date(e.target.value).toISOString()
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label={t('end.date')}
                    value={formData.endDate.split('T')[0]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: new Date(e.target.value).toISOString()
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <NumericInput
                    fullWidth
                    size="small"
                    label={t('voucher.max.usage.per.user')}
                    value={formData.maxUsagePerUser || 0}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxUsagePerUser: value || undefined
                      }))
                    }
                    allowDecimals={false}
                    allowNegative={false}
                    min={0}
                    max={100}
                    helperText="0 = ∞"
                  />
                </Grid>
              </Grid>

              {editingTemplate && (
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.checked
                          }))
                        }
                        color="success"
                      />
                    }
                    label={t('voucher.template.active.label')}
                  />
                </Box>
              )}
            </Box>
          </Collapse>
        </DialogContent>

        {validationError && (
          <Box sx={{ px: 3, py: 1 }}>
            <Typography color="error" variant="body2">
              {validationError}
            </Typography>
          </Box>
        )}

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2, minWidth: 100 }}
          >
            {saving ? <CircularProgress size={20} /> : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {effectiveBranchId && (
        <ProductCategoryPickerModal
          open={productPickerOpen}
          onClose={() => {
            setProductPickerOpen(false);
            setProductPickerGroupIndex(null);
          }}
          branchId={effectiveBranchId}
          onProductsSelected={handleProductsSelectedFromPicker}
          selectedProductIds={
            productPickerGroupIndex !== null
              ? formData.rewardGroups[productPickerGroupIndex]?.products.map(
                  (p) => p.productId
                ) || []
              : []
          }
          title={t('voucher.select.products.from.category')}
        />
      )}
    </>
  );
};

// --- Sub-components ---

interface SectionHeaderProps {
  number: number;
  title: string;
}

const SectionHeader = ({ number, title }: SectionHeaderProps) => (
  <Typography
    variant="subtitle2"
    color="primary"
    sx={{
      mb: 2,
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}
  >
    <Box
      component="span"
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12
      }}
    >
      {number}
    </Box>
    {title}
  </Typography>
);

export default VoucherTemplateDialog;
