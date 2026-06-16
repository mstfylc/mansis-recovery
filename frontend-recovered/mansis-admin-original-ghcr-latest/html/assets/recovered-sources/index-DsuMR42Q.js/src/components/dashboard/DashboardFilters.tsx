import {
  Box,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import {
  getOrderStatusOptions,
  getPurchaseTypeOptions
} from '@/utils/statusOptions';

interface DashboardFiltersProps {
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  companies: Company[];
  branches: Branch[];
  selectedCompanyId: number | null;
  selectedBranchId: number | null;
  selectedPurchaseType?: string;
  selectedOrderStatus?: string;
  onCompanyChange: (companyId: number) => void;
  onBranchChange: (branchId: number) => void;
  onPurchaseTypeChange?: (purchaseType: string) => void;
  onOrderStatusChange?: (orderStatus: string) => void;
  onResetFilters: () => void;
}

const DashboardFilters = ({
  isSuperAdmin,
  isCompanyAdmin,
  companies,
  branches,
  selectedCompanyId,
  selectedBranchId,
  selectedPurchaseType,
  selectedOrderStatus,
  onCompanyChange,
  onBranchChange,
  onPurchaseTypeChange,
  onOrderStatusChange,
  onResetFilters
}: DashboardFiltersProps) => {
  const { t } = useTranslation();

  const purchaseTypeOptions = getPurchaseTypeOptions().map((option) => ({
    value: option.value,
    label: t(option.label)
  }));

  const orderStatusOptions = getOrderStatusOptions().map((option) => ({
    value: option.value,
    label: t(option.label)
  }));

  return (
    <Box mb={2} className="dashboard-filters">
      <Card sx={{ p: 1.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexGrow: 1 }}
          >
            {isSuperAdmin && (
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel id="company-select-label">
                  {t('dashboard.select.company')}
                </InputLabel>
                <Select
                  labelId="company-select-label"
                  value={selectedCompanyId || ''}
                  label={t('dashboard.select.company')}
                  onChange={(e) => onCompanyChange(Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>{t('dashboard.all.companies')}</em>
                  </MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {((isSuperAdmin && (selectedCompanyId || branches.length > 0)) ||
              isCompanyAdmin) && (
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel id="branch-select-label">
                  {t('dashboard.select.branch')}
                </InputLabel>
                <Select
                  labelId="branch-select-label"
                  value={selectedBranchId || ''}
                  label={t('dashboard.select.branch')}
                  onChange={(e) => onBranchChange(Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>{t('dashboard.all.branches')}</em>
                  </MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {onPurchaseTypeChange && (
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel id="purchase-type-select-label">
                  {t('dashboard.select.payment.type')}
                </InputLabel>
                <Select
                  labelId="purchase-type-select-label"
                  value={selectedPurchaseType || ''}
                  label={t('dashboard.select.payment.type')}
                  onChange={(e) => onPurchaseTypeChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('dashboard.all.payment.types')}</em>
                  </MenuItem>
                  {purchaseTypeOptions.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {onOrderStatusChange && (
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel id="order-status-select-label">
                  {t('dashboard.select.order.status')}
                </InputLabel>
                <Select
                  labelId="order-status-select-label"
                  value={selectedOrderStatus || ''}
                  label={t('dashboard.select.order.status')}
                  onChange={(e) => onOrderStatusChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('dashboard.all.order.statuses')}</em>
                  </MenuItem>
                  {orderStatusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title={t('dashboard.reset.filters')}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onResetFilters}
                disabled={!selectedCompanyId && !selectedBranchId}
              >
                <FilterAltOffIcon />
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
};

export default DashboardFilters;
