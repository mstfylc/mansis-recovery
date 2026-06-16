import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as stockService from '../../data/stockService';
import type { BranchStock } from '../../types/stock';
import { prepareStockUnitLabel } from '@/utils/helpers';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import type { Branch } from '@/types/Branch.interface';
import * as warehouseService from '@/data/warehouseService';
import type { Warehouse } from '@/types/stock';
import { getStockErrorMessage } from '@/utils/errorHandlers';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import type { Company } from '@/types/Company.interface';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';

interface TransferStockDialogProps {
  open: boolean;
  onClose: () => void;
  stock: BranchStock;
  onSuccess: (message: string, severity: 'success' | 'error') => void;
}

const TransferStockDialog = ({
  open,
  onClose,
  stock,
  onSuccess
}: TransferStockDialogProps) => {
  const { t } = useTranslation();
  const { isSuperAdmin, isCompanyAdmin, company } = useUserViewMode();
  const userCompanyId = company?.id;

  const [quantity, setQuantity] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>(
    isSuperAdmin ? '' : userCompanyId || ''
  );
  const [toBranchId, setToBranchId] = useState<number | ''>('');
  const [toWarehouseId, setToWarehouseId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  // Reset form when dialog opens or stock changes
  useEffect(() => {
    if (open) {
      setQuantity('');
      setToBranchId('');
      setToWarehouseId('');
      setReason('');
    }
  }, [open, stock?.id]);

  // Fetch companies (only for SUPER_ADMIN)
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!open || !isSuperAdmin) return;

      try {
        setCompaniesLoading(true);
        const data = await companyService.getAllFlat({
          status: 'ACTIVE',
          getAll: true
        });
        setCompanies(data || []);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchCompanies();
  }, [open, isSuperAdmin]);

  useEffect(() => {
    const fetchBranches = async () => {
      let companyIdToUse: number | undefined;

      if (isSuperAdmin) {
        if (!selectedCompanyId) {
          setBranches([]);
          return;
        }
        companyIdToUse = Number(selectedCompanyId);
      } else if (isCompanyAdmin) {
        companyIdToUse = userCompanyId || undefined;
      } else {
        companyIdToUse = stock.branch?.company?.id;
      }

      if (!open || !companyIdToUse) return;

      try {
        setBranchesLoading(true);
        const result = await branchService.getAllFlat({
          companyId: companyIdToUse,
          status: 'ACTIVE',
          getAll: true
        });
        setBranches(result || []);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, [
    open,
    selectedCompanyId,
    isSuperAdmin,
    isCompanyAdmin,
    userCompanyId,
    stock.branch?.company?.id,
    stock.branchId
  ]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!toBranchId) {
        setWarehouses([]);
        setToWarehouseId('');
        return;
      }

      try {
        setWarehousesLoading(true);
        const response = await warehouseService.getWarehousesByBranch(
          Number(toBranchId)
        );

        const isSameBranch = Number(toBranchId) === stock.branchId;
        const availableWarehouses = isSameBranch
          ? (response || []).filter((w) => w.id !== stock.warehouseId)
          : response || [];

        setWarehouses(availableWarehouses);

        const defaultWarehouse = availableWarehouses.find((w) => w.isDefault);
        if (defaultWarehouse) {
          setToWarehouseId(defaultWarehouse.id);
        } else if (availableWarehouses.length === 1) {
          setToWarehouseId(availableWarehouses[0].id);
        } else {
          setToWarehouseId('');
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        setWarehouses([]);
      } finally {
        setWarehousesLoading(false);
      }
    };

    fetchWarehouses();
  }, [toBranchId, stock.branchId, stock.warehouseId]);

  const newQuantity =
    quantity && !isNaN(parseFloat(quantity))
      ? stock.quantity - parseFloat(quantity)
      : stock.quantity;
  const willGoNegative = newQuantity < 0;

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      onSuccess(t('stock.invalid.quantity'), 'error');
      return;
    }

    if (!toBranchId) {
      onSuccess(t('stock.select.branch'), 'error');
      return;
    }

    if (!toWarehouseId) {
      onSuccess(t('stock.select.warehouse'), 'error');
      return;
    }

    setLoading(true);
    try {
      await stockService.transferStock({
        fromBranchId: stock.branchId,
        toBranchId: Number(toBranchId),
        productId: stock.companyProductId,
        quantity: qty,
        reason: reason || undefined,
        fromWarehouseId: stock.warehouseId,
        toWarehouseId: Number(toWarehouseId),
        batchId: stock.batchId || undefined
      });

      onSuccess(t('stock.transferred.successfully'), 'success');
      onClose();
      setQuantity('');
      setSelectedCompanyId(isSuperAdmin ? '' : userCompanyId || '');
      setToBranchId('');
      setToWarehouseId('');
      setReason('');
    } catch (error: any) {
      onSuccess(getStockErrorMessage(error, t), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('transfer.stock')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            display="grid"
            gridTemplateColumns="1fr 1fr"
            gap={2}
            pb={1}
            borderBottom={1}
            borderColor="divider"
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('product')}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stock.companyProduct.name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('current.stock')}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stock.quantity}{' '}
                {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
              </Typography>
            </Box>
            {stock.batch && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('batch.number')}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stock.batch.batchNumber}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {t('expiry.date')}:{' '}
                  {formatDateToDayMonthYear(stock.batch.expiryDate)}
                </Typography>
              </Box>
            )}
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('from.branch')}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stock.branch.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {stock.warehouse.name}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.5}
              >
                {t('to.branch')}
              </Typography>
              {toBranchId ? (
                <>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {branches.find((b) => b.id === toBranchId)?.name}
                  </Typography>
                  {toWarehouseId && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {warehouses.find((w) => w.id === toWarehouseId)?.name}
                      {warehouses.find((w) => w.id === toWarehouseId)
                        ?.isDefault && ` (${t('default')})`}
                    </Typography>
                  )}
                  {quantity && !isNaN(parseFloat(quantity)) && (
                    <Typography variant="body2" color="success.main">
                      +{quantity}{' '}
                      {t(prepareStockUnitLabel(stock.companyProduct.stockUnit))}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography
                  variant="body2"
                  color="text.disabled"
                  fontStyle="italic"
                >
                  {t('select.branch.placeholder')}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Company Selector (only for SUPER_ADMIN) */}
          {isSuperAdmin && (
            <FormControl fullWidth required>
              <InputLabel>{t('company')}</InputLabel>
              <Select
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value as number);
                  setToBranchId(''); // Reset branch when company changes
                  setToWarehouseId(''); // Reset warehouse when company changes
                }}
                label={t('company')}
                disabled={companiesLoading}
              >
                {companiesLoading ? (
                  <MenuItem value="" disabled>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <em>{t('loading')}</em>
                    </Box>
                  </MenuItem>
                ) : companies.length === 0 ? (
                  <MenuItem value="" disabled>
                    <em>{t('no.companies.available')}</em>
                  </MenuItem>
                ) : (
                  [
                    <MenuItem key="empty" value="" disabled>
                      <em>{t('select.company')}</em>
                    </MenuItem>,
                    ...companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))
                  ]
                )}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth required>
            <InputLabel>{t('to.branch')}</InputLabel>
            <Select
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value as number)}
              label={t('to.branch')}
              disabled={branchesLoading || (isSuperAdmin && !selectedCompanyId)}
            >
              {branchesLoading ? (
                <MenuItem value="" disabled>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    <em>{t('loading')}</em>
                  </Box>
                </MenuItem>
              ) : branches.length === 0 ? (
                <MenuItem value="" disabled>
                  <em>{t('no.branches.available')}</em>
                </MenuItem>
              ) : (
                [
                  <MenuItem key="empty" value="" disabled>
                    <em>{t('select.branch')}</em>
                  </MenuItem>,
                  ...branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))
                ]
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth required disabled={!toBranchId}>
            <InputLabel>{t('to.warehouse')}</InputLabel>
            <Select
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value as number)}
              label={t('to.warehouse')}
              disabled={warehousesLoading || !toBranchId}
            >
              {warehousesLoading ? (
                <MenuItem value="" disabled>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    <em>{t('loading')}</em>
                  </Box>
                </MenuItem>
              ) : warehouses.length === 0 ? (
                <MenuItem value="" disabled>
                  <em>{t('no.warehouses.available')}</em>
                </MenuItem>
              ) : (
                [
                  <MenuItem key="empty" value="" disabled>
                    <em>{t('select.warehouse')}</em>
                  </MenuItem>,
                  ...warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                      {warehouse.isDefault && ` (${t('default')})`}
                    </MenuItem>
                  ))
                ]
              )}
            </Select>
          </FormControl>

          <TextField
            label={t('quantity.to.transfer')}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 0, step: 'any' }}
          />

          <TextField
            label={t('reason.optional')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder={t('stock.reason.example.transfer')}
          />

          {willGoNegative && (
            <Alert severity="warning">
              {t('stock.negative.warning.source')}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !quantity || !toBranchId || !toWarehouseId}
        >
          {loading ? t('transferring') : t('transfer.stock')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferStockDialog;
