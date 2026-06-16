import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as stockService from '@/data/stockService';
import { getStockErrorMessage } from '@/utils/errorHandlers';
import * as warehouseService from '@/data/warehouseService';
import { Warehouse, StockUnit } from '@/types/stock';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { companyProductService } from '@/data/companyProductService';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import NumericInput from '@/components/NumericInput';
import StyledDatePicker from '@/components/date&time/StyledDatePicker';

interface Product {
  id: number;
  name: string;
  stockUnit: StockUnit;
  isBatchTracked?: boolean;
  category?: {
    name: string;
  };
}

interface InitializeStockDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string, severity: 'success' | 'error') => void;
}

const InitializeStockDialog = ({
  open,
  onClose,
  onSuccess
}: InitializeStockDialogProps) => {
  const { t } = useTranslation();
  const {
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    isAdminView,
    company,
    currentBranch
  } = useUserViewMode();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [minThreshold, setMinThreshold] = useState<number>(0);
  const [maxThreshold, setMaxThreshold] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [manufacturingDate, setManufacturingDate] = useState<Date | null>(null);
  const [supplierBatchNo, setSupplierBatchNo] = useState<string>('');
  const [supplierInfo, setSupplierInfo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Fetch companies for Super Admin
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

  // Fetch branches based on selected company
  const fetchBranches = async (companyId: number) => {
    try {
      setLoadingBranches(true);
      const result = await branchService.getAllFlat({ companyId });
      setBranches(result || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchWarehouses = async (branchId: number) => {
    try {
      setLoadingWarehouses(true);
      const response = await warehouseService.getWarehousesByBranch(branchId);
      setWarehouses(response || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setWarehouses([]);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    if (!branchId) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    try {
      const result =
        await companyProductService.getStockTrackedByBranch(branchId);
      setProducts(
        Array.isArray(result) ? (result as unknown as Product[]) : []
      );
    } catch (error) {
      console.error('Error fetching stock tracked products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [branchId]);

  // Fetch companies on dialog open for Super Admin
  useEffect(() => {
    if (!open) return;

    if (isSuperAdmin) {
      fetchCompanies();
    }
    // Fetch branches for company admin
    else if (isCompanyAdmin && company?.id) {
      const companyId = company.id;
      fetchCompanies();
      setSelectedCompanyId(companyId);
      fetchBranches(companyId);
    }
    // For branch admin, set branchId automatically
    else if (isBranchAdmin) {
      const branchIdFromUser = currentBranch?.id; // SAFE
      if (branchIdFromUser !== undefined) {
        setBranchId(branchIdFromUser);
      }
    }
  }, [
    open,
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    company,
    currentBranch
  ]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchBranches(selectedCompanyId);
      setBranchId(null);
      setWarehouseId('');
      setWarehouses([]);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (branchId) {
      fetchWarehouses(branchId);
      fetchProducts();
    } else {
      setWarehouses([]);
      setWarehouseId('');
      setProducts([]);
    }
  }, [branchId, fetchProducts]);

  // Set default warehouse if only one exists
  useEffect(() => {
    if (warehouses.length === 1) {
      setWarehouseId(warehouses[0].id);
    } else if (warehouses.length === 0) {
      setWarehouseId('');
    }
  }, [warehouses]);

  // Reset batch fields when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setExpiryDate(null);
      setManufacturingDate(null);
      setSupplierBatchNo('');
      setSupplierInfo('');
      setNotes('');
    }
  }, [selectedProduct]);

  const handleSubmit = async () => {
    if (!selectedProduct || !branchId || !warehouseId) {
      onSuccess(t('stock.initialize.fill.required'), 'error');
      return;
    }

    if (quantity <= 0) {
      onSuccess(t('stock.invalid.quantity'), 'error');
      return;
    }

    if (selectedProduct.isBatchTracked && !expiryDate) {
      onSuccess(t('stock.expiry.date.required'), 'error');
      return;
    }

    setLoading(true);
    try {
      await stockService.initializeStock({
        branchId,
        productId: selectedProduct.id,
        quantity,
        minThreshold: minThreshold > 0 ? minThreshold : undefined,
        maxThreshold: maxThreshold > 0 ? maxThreshold : undefined,
        warehouseId: Number(warehouseId),
        expiryDate: expiryDate || undefined,
        manufacturingDate: manufacturingDate || undefined,
        supplierBatchNo: supplierBatchNo || undefined,
        supplierInfo: supplierInfo || undefined,
        notes: notes || undefined
      });

      onSuccess(t('stock.initialized.successfully'), 'success');
      handleClose();
    } catch (error: any) {
      onSuccess(getStockErrorMessage(error, t), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setWarehouseId('');
    setQuantity(0);
    setMinThreshold(0);
    setMaxThreshold(0);
    setExpiryDate(null);
    setManufacturingDate(null);
    setSupplierBatchNo('');
    setSupplierInfo('');
    setNotes('');
    setBranchId(null);
    setSelectedCompanyId('');
    setBranches([]);
    setWarehouses([]);
    setCompanies([]);
    onClose();
  };

  const handleBranchChange = (newBranchId: number) => {
    setBranchId(newBranchId);
    setWarehouseId(''); // Reset warehouse when branch changes
  };

  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setBranchId(null);
    setWarehouseId('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('stock.initialize.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Company Selection - Super Admin Only */}
          {isSuperAdmin && (
            <FormControl fullWidth required>
              <InputLabel>{t('company')}</InputLabel>
              <Select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(Number(e.target.value))}
                label={t('company')}
                disabled={loadingCompanies}
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
            </FormControl>
          )}

          {!isBranchAdmin &&
            (isSuperAdmin ? selectedCompanyId : true) &&
            isAdminView && (
              <FormControl fullWidth required>
                <InputLabel>{t('branch')}</InputLabel>
                <Select
                  value={branchId || ''}
                  onChange={(e) => handleBranchChange(Number(e.target.value))}
                  label={t('branch')}
                  disabled={loadingBranches}
                >
                  <MenuItem value="">
                    <em>{t('select.branch')}</em>
                  </MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

          {branchId ? (
            <>
              <Alert severity="info" sx={{ mb: 1 }}>
                {t('stock.initialize.showing.stock.tracked.only')}
              </Alert>

              <Autocomplete
                options={products || []}
                loading={loadingProducts}
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                getOptionLabel={(option) => option.name}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      {option.category && (
                        <Typography variant="caption" color="text.secondary">
                          {option.category.name}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('select.product')}
                    required
                    autoFocus
                  />
                )}
              />

              <FormControl fullWidth required>
                <InputLabel>{t('warehouse')}</InputLabel>
                <Select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value as number)}
                  label={t('warehouse')}
                  disabled={warehouses.length === 0 || loadingWarehouses}
                >
                  <MenuItem value="">
                    <em>
                      {loadingWarehouses ? t('loading') : t('select.warehouse')}
                    </em>
                  </MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <NumericInput
                label={t('initial.quantity')}
                value={quantity}
                onChange={setQuantity}
                fullWidth
                required
                allowDecimals
                decimalPlaces={2}
                min={0}
                helperText={t('stock.initial.quantity.help')}
              />

              <TextField
                label={t('stock.unit')}
                value={
                  selectedProduct
                    ? t(prepareStockUnitLabel(selectedProduct.stockUnit))
                    : ''
                }
                fullWidth
                disabled
                helperText={t('stock.unit.from.product')}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <NumericInput
                  label={t('min.threshold.optional')}
                  value={minThreshold}
                  onChange={setMinThreshold}
                  fullWidth
                  allowDecimals
                  decimalPlaces={2}
                  min={0}
                  helperText={t('stock.min.threshold.help')}
                />

                <NumericInput
                  label={t('max.threshold.optional')}
                  value={maxThreshold}
                  onChange={setMaxThreshold}
                  fullWidth
                  allowDecimals
                  decimalPlaces={2}
                  min={0}
                  helperText={t('stock.max.threshold.help')}
                />
              </Box>

              {selectedProduct?.isBatchTracked && (
                <>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {t('stock.batch.tracking.required')}
                  </Alert>

                  <StyledDatePicker
                    label={t('expiry.date')}
                    selected={expiryDate}
                    onChange={(date) => setExpiryDate(date)}
                    required
                  />

                  <StyledDatePicker
                    label={t('manufacturing.date.optional')}
                    selected={manufacturingDate}
                    onChange={(date) => setManufacturingDate(date)}
                  />

                  <TextField
                    label={t('supplier.batch.no.optional')}
                    value={supplierBatchNo}
                    onChange={(e) => setSupplierBatchNo(e.target.value)}
                    fullWidth
                    helperText={t('stock.supplier.batch.no.help')}
                  />

                  <TextField
                    label={t('supplier.info.optional')}
                    value={supplierInfo}
                    onChange={(e) => setSupplierInfo(e.target.value)}
                    fullWidth
                    helperText={t('stock.supplier.info.help')}
                  />

                  <TextField
                    label={t('notes.optional')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    helperText={t('stock.notes.help')}
                  />
                </>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              {isSuperAdmin && !selectedCompanyId && t('select.company.first')}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={
            loading ||
            !selectedProduct ||
            !branchId ||
            !warehouseId ||
            quantity <= 0
          }
        >
          {loading ? t('initializing') : t('stock.initialize')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InitializeStockDialog;
