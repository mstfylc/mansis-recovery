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

type CompanyProductDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  product?: CompanyProduct | null;
  menuMode?: boolean; // New prop to force menu creation mode
  onSave: (product: {
    name: string;
    description: string;
    basePrice: string;
    costPrice?: string;
    pointValue?: number;
    categoryId: number;
    isMenu: boolean;
    status: CompanyProductStatus;
    companyId: number;
    allowNegativeStock: boolean;
    isStockTracked: boolean;
    trackExpiry: boolean;
    stockUnit: StockUnit;
    imageFile?: File;
  }) => Promise<void>;
};

const CompanyProductDialog = ({
  open,
  onClose,
  onSave,
  error,
  product,
  menuMode = false
}: CompanyProductDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [pointValue, setPointValue] = useState(0);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [status, setStatus] = useState<CompanyProductStatus>('PASSIVE');
  const [isMenu, setIsMenu] = useState(false);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [isStockTracked, setIsStockTracked] = useState(false);
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [stockUnit, setStockUnit] = useState<StockUnit>(StockUnit.PIECE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );
  const isEditMode = !!product;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const { role: userRole, company: currentUserCompany } = useUserViewMode();
  const resetForm = useCallback(() => {
    setName('');
    setBasePrice(0);
    setCostPrice(0);
    setPointValue(0);
    setDescription('');
    setCategoryId(null);
    setCompanyId(null);
    setStatus('PASSIVE');
    setIsMenu(menuMode); // Set to true if in menu mode
    setAllowNegativeStock(false);
    setIsStockTracked(false);
    setTrackExpiry(false);
    setStockUnit(StockUnit.PIECE);
    setImageFile(null);
    setValidationError(undefined);
  }, [menuMode]);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setBasePrice(product.basePrice || 0);
      setCostPrice(product.costPrice || 0);
      setPointValue(product.pointValue || 0);
      setCategoryId(product.categoryId || null);
      setCompanyId(product.companyId || null);
      setStatus(product.status || 'PASSIVE');
      setIsMenu(product.isMenu || false);
      setAllowNegativeStock(product.allowNegativeStock || false);
      setIsStockTracked(product.isStockTracked || false);
      setTrackExpiry(product.trackExpiry || false);
      setStockUnit((product.stockUnit as StockUnit) || StockUnit.PIECE);
    } else {
      resetForm();
    }
  }, [product, userRole, currentUserCompany, menuMode, resetForm]);

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

    if (!basePrice) {
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
        basePrice: basePrice.toString(),
        costPrice: costPrice > 0 ? costPrice.toString() : undefined,
        pointValue: pointValue > 0 ? pointValue : undefined,
        categoryId,
        isMenu,
        status,
        companyId,
        allowNegativeStock,
        isStockTracked,
        trackExpiry,
        stockUnit,
        ...(imageFile && { imageFile })
      });

      // Başarılı save işleminden sonra formu temizle ve dialog'u kapat
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

      // Eğer yeni ürün modundaysa (product yok) formu temizle
      if (!product) {
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
  }, [open, userRole, currentUserCompany, fetchCategories, product, resetForm]);

  const { t } = useTranslation();

  const handleFileSelect = (file: File) => {
    setImageFile(file);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        className="company-product-add-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditMode
            ? t('edit.product')
            : menuMode
              ? t('menu.create.new')
              : t('new.product')}
          {isEditMode && ` - ${product?.name}`}
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

          {costPrice > 0 && basePrice > 0 && costPrice > basePrice && (
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
                label={t('name')}
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
                      <Typography color="text.secondary">{t('tl')}</Typography>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <NumericInput
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
                helperText={t('cost.price.helper')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <NumericInput
                margin="dense"
                label={t('product.point.value')}
                fullWidth
                value={pointValue}
                onChange={setPointValue}
                allowDecimals={false}
                min={0}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography color="text.secondary">
                        {t('points')}
                      </Typography>
                    </InputAdornment>
                  )
                }}
                helperText={t('product.point.value.helper')}
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

            {!menuMode && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isMenu}
                      onChange={(e) => setIsMenu(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('is.menu.help.text')}
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
                imageUrl={product?.file?.url}
                accept="image/*"
                helperText={
                  isEditMode ? t('edit.image.helper.text') : undefined
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="primary"
            disabled={loading}
            className="company-product-add-dialog-cancel-button"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={
              !name ||
              !basePrice ||
              !categoryId ||
              !companyId ||
              (!isEditMode && !imageFile) ||
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

export default CompanyProductDialog;
