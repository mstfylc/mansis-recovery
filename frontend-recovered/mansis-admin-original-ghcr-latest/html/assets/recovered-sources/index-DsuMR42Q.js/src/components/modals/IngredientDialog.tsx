import { useState, useEffect, useCallback } from 'react';
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
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
  Grid,
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { Company } from '@/types/Company.interface';
import FileUploadCard from '../FileUploadCard';
import NumericInput from '../NumericInput';
import { useTranslation } from 'react-i18next';
import { categoryService } from '@/data/categoryService';
import { companyService } from '@/data/companyService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Role } from '@/enums/role';
import { Category } from '@/types/Category.interface';
import { StockUnit } from '@/types/stock';

type CompanyProductStatus = 'ACTIVE' | 'PASSIVE' | 'PENDING' | 'DELETED';

type IngredientDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  ingredient?: CompanyProduct | null;
  onSave: (ingredient: {
    name: string;
    description: string;
    basePrice: string;
    costPrice?: string;
    categoryId: number;
    status: CompanyProductStatus;
    companyId: number;
    isForSale?: boolean;
    allowNegativeStock: boolean;
    isStockTracked: boolean;
    trackExpiry: boolean;
    stockUnit: StockUnit;
    imageFile?: File;
  }) => Promise<void>;
};

const IngredientDialog = ({
  open,
  onClose,
  onSave,
  error,
  ingredient
}: IngredientDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [status, setStatus] = useState<CompanyProductStatus>('PASSIVE');
  const [isForSale, setIsForSale] = useState(false); // Default false for ingredients
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [isStockTracked, setIsStockTracked] = useState(true); // Default true for ingredients
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [stockUnit, setStockUnit] = useState<StockUnit>(StockUnit.PIECE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );
  const isEditMode = !!ingredient;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const { role: userRole, company: currentUserCompany } = useUserViewMode();
  const { t } = useTranslation();

  const resetForm = useCallback(() => {
    setName('');
    setBasePrice(0);
    setCostPrice(0);
    setDescription('');
    setCategoryId(null);
    setCompanyId(null);
    setStatus('PASSIVE');
    setIsForSale(false);
    setAllowNegativeStock(false);
    setIsStockTracked(true);
    setTrackExpiry(false);
    setStockUnit(StockUnit.PIECE);
    setImageFile(null);
    setValidationError(undefined);
  }, []);

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name || '');
      setDescription(ingredient.description || '');
      setBasePrice(ingredient.basePrice || 0);
      setCostPrice(ingredient.costPrice || 0);
      setCategoryId(ingredient.categoryId || null);
      setCompanyId(ingredient.companyId || null);
      setStatus(ingredient.status || 'PASSIVE');
      setIsForSale(ingredient.isForSale ?? false);
      setAllowNegativeStock(ingredient.allowNegativeStock || false);
      setIsStockTracked(ingredient.isStockTracked || true);
      setTrackExpiry(ingredient.trackExpiry || false);
      setStockUnit((ingredient.stockUnit as StockUnit) || StockUnit.PIECE);
    } else {
      resetForm();
    }
  }, [ingredient, userRole, currentUserCompany, resetForm]);

  const handleClose = () => {
    resetForm();
    setValidationError(undefined);
    onClose();
  };

  const handleSave = async () => {
    if (!name) {
      setValidationError(t('product.name.required'));
      return;
    }

    if (!costPrice) {
      setValidationError(t('cost.price.required'));
      return;
    }

    if (isForSale && !basePrice) {
      setValidationError(t('product.base.price.required'));
      return;
    }

    if (!categoryId) {
      setValidationError(t('product.category.required'));
      return;
    }

    if (!companyId) {
      setValidationError(t('product.company.required'));
      return;
    }

    try {
      setLoading(true);
      await onSave({
        name,
        description,
        basePrice: isForSale ? basePrice.toString() : '0',
        costPrice: costPrice > 0 ? costPrice.toString() : undefined,
        categoryId,
        status,
        companyId,
        isForSale,
        allowNegativeStock,
        isStockTracked,
        trackExpiry,
        stockUnit,
        ...(imageFile && { imageFile })
      });

      resetForm();
      setValidationError(undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const params: Record<string, unknown> = { getAll: true };
      if (currentUserCompany?.id) {
        params.companyId = currentUserCompany.id;
      }

      const result = await categoryService.getAllFlat(params);
      setCategories(result || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [currentUserCompany]);

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const result = await companyService.getAllFlat({ getAll: true });
      setCompanies(result || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setValidationError(undefined);

      if (!ingredient) {
        resetForm();
      }

      if (userRole === Role.SUPER_ADMIN) {
        fetchCompanies();
      } else if (
        (userRole === Role.COMPANY_ADMIN || userRole === Role.BRANCH_ADMIN) &&
        currentUserCompany?.id
      ) {
        setCompanyId(currentUserCompany?.id);
      }

      fetchCategories();
    }
  }, [
    open,
    userRole,
    currentUserCompany,
    fetchCategories,
    ingredient,
    resetForm
  ]);

  const handleFileSelect = (file: File) => {
    setImageFile(file);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        className="ingredient-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? t('edit.ingredient') : t('new.ingredient')}
          {isEditMode && ` - ${ingredient?.name}`}
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

          {isForSale &&
            costPrice > 0 &&
            basePrice > 0 &&
            costPrice > basePrice && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('warning.cost.greater.than.base.price')}
              </Alert>
            )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                autoFocus
                margin="dense"
                label={t('ingredient.name')}
                type="text"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                margin="dense"
                label={t('description')}
                type="text"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <NumericInput
                required
                margin="dense"
                label={t('cost.price')}
                fullWidth
                value={costPrice}
                onChange={setCostPrice}
                allowDecimals
                decimalPlaces={2}
                min={0}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography color="text.secondary">{t('tl')}</Typography>
                    </InputAdornment>
                  )
                }}
                helperText={t('cost.price.helper.required')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" required>
                <InputLabel>{t('stock.unit')}</InputLabel>
                <Select
                  value={stockUnit}
                  onChange={(e) => setStockUnit(e.target.value as StockUnit)}
                  label={t('stock.unit')}
                >
                  {Object.values(StockUnit).map((unitValue) => (
                    <MenuItem key={unitValue} value={unitValue}>
                      {t(`stock.unit.${unitValue.toLowerCase()}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" required>
                <InputLabel>{t('category')}</InputLabel>
                <Select
                  value={
                    categories.length === 0 ||
                    !categories.some((c) => c.id === categoryId)
                      ? ''
                      : categoryId
                  }
                  onChange={(e) => setCategoryId(e.target.value as number)}
                  label={t('category')}
                  disabled={categoriesLoading}
                >
                  <MenuItem value="">
                    <em>{t('select.category')}</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {categoriesLoading && (
                  <CircularProgress size={20} sx={{ ml: 1 }} />
                )}
              </FormControl>
            </Grid>

            {userRole === Role.SUPER_ADMIN && (
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense" required>
                  <InputLabel>{t('company')}</InputLabel>
                  <Select
                    value={
                      companies.length === 0 ||
                      !companies.some((c) => c.id === companyId)
                        ? ''
                        : companyId
                    }
                    onChange={(e) => setCompanyId(e.target.value as number)}
                    label={t('company')}
                    disabled={companiesLoading}
                  >
                    <MenuItem value="">
                      <em>{t('select.company')}</em>
                    </MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {companiesLoading && (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  )}
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isForSale}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setIsForSale(newValue);
                      if (!newValue) {
                        setBasePrice(0); // Reset sale price when not for sale
                      }
                    }}
                    color="primary"
                  />
                }
                label={t('is.for.sale')}
              />
              <Typography color="text.secondary" display="block" sx={{ ml: 4 }}>
                {t('is.for.sale.helper')}
              </Typography>
            </Grid>

            {isForSale && (
              <Grid item xs={12} sm={6}>
                <NumericInput
                  required
                  margin="dense"
                  label={t('base.price')}
                  fullWidth
                  value={basePrice}
                  onChange={setBasePrice}
                  allowDecimals
                  decimalPlaces={2}
                  min={0}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography color="text.secondary">
                          {t('tl')}
                        </Typography>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            )}

            {/* Stock Settings Section */}
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: 'divider',
                  borderRadius: 2,
                  backgroundColor: 'background.default'
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 2 }}
                >
                  {t('stock.settings')}
                </Typography>

                {isEditMode && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('product.stock.settings.edit.warning')}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isStockTracked}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            setIsStockTracked(newValue);
                            if (!newValue) {
                              setTrackExpiry(false);
                            }
                          }}
                          color="primary"
                        />
                      }
                      label={t('product.enable.stock.tracking')}
                    />
                    <Typography
                      color="text.secondary"
                      display="block"
                      sx={{ ml: 4 }}
                    >
                      {t('product.enable.stock.tracking.help')}
                    </Typography>
                  </Grid>

                  {isStockTracked && (
                    <>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={trackExpiry}
                              onChange={(e) => setTrackExpiry(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={t('product.enable.batch.tracking')}
                        />
                        <Typography
                          color="text.secondary"
                          display="block"
                          sx={{ ml: 4 }}
                        >
                          {t('product.enable.batch.tracking.help')}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={allowNegativeStock}
                              onChange={(e) =>
                                setAllowNegativeStock(e.target.checked)
                              }
                              color="warning"
                            />
                          }
                          label={t('product.allow.negative.stock')}
                        />
                        <Typography
                          color="text.secondary"
                          display="block"
                          sx={{ ml: 4 }}
                        >
                          {t('product.allow.negative.stock.help')}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>
            </Grid>

            {isEditMode && (
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense" required>
                  <InputLabel>{t('status')}</InputLabel>
                  <Select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as CompanyProductStatus)
                    }
                    label={t('status')}
                  >
                    <MenuItem value="ACTIVE">{t('status.active')}</MenuItem>
                    <MenuItem value="PASSIVE">{t('status.passive')}</MenuItem>
                    <MenuItem value="PENDING">{t('status.pending')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FileUploadCard
                onFileSelect={handleFileSelect}
                imageUrl={ingredient?.file?.url}
                accept="image/*"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="primary"
            disabled={loading}
            className="ingredient-dialog-cancel-button"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={
              !name ||
              !costPrice ||
              (isForSale && !basePrice) ||
              !categoryId ||
              !companyId ||
              loading
            }
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? t('saving') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default IngredientDialog;
