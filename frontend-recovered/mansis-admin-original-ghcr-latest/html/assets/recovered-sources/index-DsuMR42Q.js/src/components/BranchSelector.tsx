import { useState, useEffect } from 'react';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { useObservable } from '@legendapp/state/react';
import { user$, setCurrentBranch } from '../store/userStore';
import { Branch } from '@/types/Branch.interface';
import { Role } from '@/enums/role';
import { useTranslation } from 'react-i18next';
import { branchService } from '@/data/branchService';
import { authService } from '@/data/authService';
import { useLocation } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const STORAGE_KEYS = {
  SELECTED_BRANCH_ID: 'selected_branch_id',
  VIEW_MODE_PREFERENCE: 'view_mode_preference',
  LAST_BRANCH_ID: 'last_branch_id'
};

interface SwitchBranchResponse {
  accessToken: string;
  refreshToken: string;
}

interface BranchWithPrimary extends Branch {
  isPrimary: boolean;
}

const BranchSelector = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<BranchWithPrimary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const user = useObservable(user$);
  const location = useLocation();

  const isOnPOSPage = location.pathname.startsWith('/pos');
  const userRole = user.get().role;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        let response;

        if (userRole === Role.SUPER_ADMIN) {
          const data = await branchService.getAllFlat({
            status: 'ACTIVE',
            getAll: true
          });
          if (data) {
            const branchesWithPrimary: BranchWithPrimary[] = data.map(
              (branch) => ({
                ...branch,
                isPrimary: false
              })
            );
            setBranches(branchesWithPrimary);
            response = { data: branchesWithPrimary };
          }
        } else if (userRole === Role.COMPANY_ADMIN) {
          const companyId = user.get().company?.id;
          if (companyId) {
            const data = await branchService.getAllFlat({
              companyId: companyId,
              status: 'ACTIVE',
              getAll: true
            });
            if (data) {
              const branchesWithPrimary: BranchWithPrimary[] = data.map(
                (branch) => ({
                  ...branch,
                  isPrimary: false
                })
              );
              setBranches(branchesWithPrimary);
              response = { data: branchesWithPrimary };
            }
          }
        } else {
          response = { data: await branchService.getMyBranches() };
        }

        if (response?.data && response.data.length > 0) {
          setBranches(response.data);

          const viewModePreference = localStorage.getItem(
            STORAGE_KEYS.VIEW_MODE_PREFERENCE
          );
          const storedBranchId = localStorage.getItem(
            STORAGE_KEYS.SELECTED_BRANCH_ID
          );

          if (
            viewModePreference === 'admin' &&
            (userRole === Role.COMPANY_ADMIN || userRole === Role.SUPER_ADMIN)
          ) {
            setSelectedBranchId('');
            setCurrentBranch(undefined as any);
          } else if (
            storedBranchId &&
            response.data.some((b) => b.id === parseInt(storedBranchId))
          ) {
            setSelectedBranchId(parseInt(storedBranchId));

            const selectedBranch = response.data.find(
              (b) => b.id === parseInt(storedBranchId)
            );
            if (selectedBranch) {
              setCurrentBranch(selectedBranch);
            }
          } else {
            const currentBranchId = user.get().currentBranch?.id;

            if (
              currentBranchId &&
              response.data.some((b) => b.id === currentBranchId)
            ) {
              setSelectedBranchId(currentBranchId);
              localStorage.setItem(
                STORAGE_KEYS.SELECTED_BRANCH_ID,
                currentBranchId.toString()
              );
            } else {
              if (
                userRole === Role.COMPANY_ADMIN ||
                userRole === Role.SUPER_ADMIN
              ) {
                setSelectedBranchId('');
                setCurrentBranch(undefined as any);
                localStorage.setItem(
                  STORAGE_KEYS.VIEW_MODE_PREFERENCE,
                  'admin'
                );
              } else {
                const primaryBranch = response.data.find((b) => b.isPrimary);
                if (primaryBranch) {
                  setSelectedBranchId(primaryBranch.id);
                  localStorage.setItem(
                    STORAGE_KEYS.SELECTED_BRANCH_ID,
                    primaryBranch.id.toString()
                  );
                } else {
                  setSelectedBranchId(response.data[0].id);
                  localStorage.setItem(
                    STORAGE_KEYS.SELECTED_BRANCH_ID,
                    response.data[0].id.toString()
                  );
                }
              }
            }
          }
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error('Error fetching user branches:', error);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [isOnPOSPage, userRole, user]);

  const switchBranch = async (
    branchId: number
  ): Promise<SwitchBranchResponse> => {
    try {
      return await authService.switchBranch(branchId);
    } catch (error) {
      console.error('Error switching branch:', error);
      throw error;
    }
  };

  const handleBranchChange = async (branchId: number | 'admin') => {
    try {
      setLoading(true);

      if (branchId === 'admin') {
        setSelectedBranchId('');

        if (selectedBranchId) {
          localStorage.setItem(
            STORAGE_KEYS.LAST_BRANCH_ID,
            selectedBranchId.toString()
          );
        }

        localStorage.removeItem(STORAGE_KEYS.SELECTED_BRANCH_ID);
        localStorage.setItem(STORAGE_KEYS.VIEW_MODE_PREFERENCE, 'admin');

        const switchResponse = await authService.switchBranch(null);

        localStorage.setItem('access_token', switchResponse.accessToken);
        localStorage.setItem('refresh_token', switchResponse.refreshToken);

        setCurrentBranch(undefined as any);

        window.dispatchEvent(new Event('ability-update'));

        window.location.reload();
        return;
      }

      setSelectedBranchId(branchId);

      localStorage.setItem(
        STORAGE_KEYS.SELECTED_BRANCH_ID,
        branchId.toString()
      );
      localStorage.setItem(STORAGE_KEYS.LAST_BRANCH_ID, branchId.toString());
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE_PREFERENCE, 'branch');

      const { accessToken, refreshToken } = await switchBranch(branchId);

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      const selectedBranch = branches.find((b) => b.id === branchId);

      if (selectedBranch) {
        await setCurrentBranch(selectedBranch);
      }

      window.dispatchEvent(new Event('ability-update'));

      window.location.reload();
    } catch (error) {
      console.error('Error switching branch:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId && branches.length > 0) {
      const branchExists = branches.some((b) => b.id === selectedBranchId);
      if (!branchExists) {
        setSelectedBranchId('');
      }
    }
  }, [selectedBranchId, branches]);

  return (
    <Box
      sx={{
        minWidth: { xs: 150, sm: 180, lg: 200 },
        maxWidth: { xs: 200, sm: 250, lg: 300, xl: 350 },
        mx: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5
      }}
    >
      <FormControl fullWidth size="small">
        <Select
          value={selectedBranchId}
          onChange={(e) =>
            handleBranchChange(e.target.value as number | 'admin')
          }
          displayEmpty
          disabled={loading}
          sx={{
            backgroundColor: 'background.paper',
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center'
            }
          }}
          renderValue={(selected) => {
            if (!selected) {
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AdminPanelSettingsIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight="medium">
                    {userRole === Role.COMPANY_ADMIN ||
                    userRole === Role.SUPER_ADMIN
                      ? t('admin.view')
                      : t('select.branch')}
                  </Typography>
                </Box>
              );
            }

            const branch = branches.find((b) => b.id === selected);

            return (
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {branch ? branch.name : t('select.branch')}
              </Typography>
            );
          }}
        >
          {(userRole === Role.COMPANY_ADMIN ||
            userRole === Role.SUPER_ADMIN) && (
            <MenuItem value="admin">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettingsIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {t('admin.view')}
                </Typography>
              </Box>
            </MenuItem>
          )}

          {branches.length > 0 ? (
            branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                <Typography variant="body2">
                  {branch.name} {branch.isPrimary && t('branch.primary')}
                </Typography>
              </MenuItem>
            ))
          ) : (
            <MenuItem value="" disabled>
              <Typography variant="body2">
                {t('no.branches.available')}
              </Typography>
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default BranchSelector;
