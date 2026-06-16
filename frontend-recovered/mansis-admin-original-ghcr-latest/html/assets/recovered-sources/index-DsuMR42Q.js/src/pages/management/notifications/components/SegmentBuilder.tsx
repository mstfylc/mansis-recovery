import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Autocomplete,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { SegmentFilter, SegmentPreview } from '@/types/Notification.interface';
import PreviewIcon from '@mui/icons-material/Preview';
import { notificationService } from '@/data/notificationService';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';

const ALL_ROLES = ['CUSTOMER', 'EMPLOYEE', 'BRANCH_ADMIN', 'COMPANY_ADMIN'];

interface SegmentBuilderProps {
  filter: SegmentFilter;
  onChange: (filter: SegmentFilter) => void;
  onPreview?: (preview: SegmentPreview) => void;
}

function SegmentBuilder({ filter, onChange, onPreview }: SegmentBuilderProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { isSuperAdmin, isBranchAdmin, isCompanyAdmin } = useUserViewMode();
  const [loading, setLoading] = useState(false);

  const availableRoles = ALL_ROLES.filter((role) => {
    if (isBranchAdmin) return role === 'CUSTOMER' || role === 'EMPLOYEE';
    if (isCompanyAdmin) return role !== 'COMPANY_ADMIN';
    return true;
  });
  const [companies, setCompanies] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>(
    []
  );

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [companiesData, branchesData] = await Promise.all([
          companyService.getAllFlat({ getAll: true }),
          branchService.getAllFlat({ getAll: true })
        ]);
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } catch {
        // silent — autocomplete will be empty
      }
    };
    fetchOptions();
  }, []);

  const handleRoleChange = (event: any) => {
    const value = event.target.value as string[];
    onChange({ ...filter, roles: value });
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const result = await notificationService.previewSegment(filter);
      onPreview?.(result);
    } catch {
      enqueueSnackbar(t('notification.segment.previewFailed'), {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h6">{t('notification.segment.title')}</Typography>

      {/* Role Selection */}
      <FormControl fullWidth>
        <InputLabel>{t('notification.segment.roles')}</InputLabel>
        <Select
          multiple
          value={filter.roles || []}
          onChange={handleRoleChange}
          input={<OutlinedInput label={t('notification.segment.roles')} />}
          renderValue={(selected) => (
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {(selected as string[]).map((role) => (
                <Chip
                  key={role}
                  label={t(`roles.${role.toLowerCase()}`)}
                  size="small"
                />
              ))}
            </Box>
          )}
        >
          {availableRoles.map((role) => (
            <MenuItem key={role} value={role}>
              {t(`roles.${role.toLowerCase()}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Company Autocomplete — only Super Admin sees all companies */}
      {isSuperAdmin && (
        <Autocomplete
          multiple
          options={companies}
          getOptionLabel={(option: any) => option.name}
          value={(Array.isArray(companies) ? companies : []).filter((c) =>
            filter.companyIds?.includes(c.id)
          )}
          onChange={(_e, values) =>
            onChange({ ...filter, companyIds: values.map((v: any) => v.id) })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('notification.segment.companies')}
              placeholder={t('notification.segment.companies')}
            />
          )}
        />
      )}

      {/* Branch Autocomplete — Branch Admin already scoped to their branch */}
      {!isBranchAdmin && (
        <Autocomplete
          multiple
          options={branches}
          getOptionLabel={(option: any) => option.name}
          value={(Array.isArray(branches) ? branches : []).filter((b) =>
            filter.branchIds?.includes(b.id)
          )}
          onChange={(_e, values) =>
            onChange({ ...filter, branchIds: values.map((v: any) => v.id) })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('notification.segment.branches')}
              placeholder={t('notification.segment.branches')}
            />
          )}
        />
      )}

      {/* Order-based filters */}
      <Typography variant="subtitle2">
        {t('notification.segment.orderHistory')}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={filter.orderBased?.hasOrderFromBranch || false}
            onChange={(e) =>
              onChange({
                ...filter,
                orderBased: {
                  ...filter.orderBased,
                  hasOrderFromBranch: e.target.checked
                }
              })
            }
          />
        }
        label={t('notification.segment.hasOrdered')}
      />
      <FormControlLabel
        control={
          <Switch
            checked={filter.orderBased?.hasWalletBalance || false}
            onChange={(e) =>
              onChange({
                ...filter,
                orderBased: {
                  ...filter.orderBased,
                  hasWalletBalance: e.target.checked
                }
              })
            }
          />
        }
        label={t('notification.segment.hasWalletBalance')}
      />

      <Divider />

      <Button
        variant="outlined"
        startIcon={<PreviewIcon />}
        onClick={handlePreview}
        disabled={loading}
      >
        {loading ? t('common.loading') : t('notification.segment.preview')}
      </Button>
    </Box>
  );
}

export default SegmentBuilder;
