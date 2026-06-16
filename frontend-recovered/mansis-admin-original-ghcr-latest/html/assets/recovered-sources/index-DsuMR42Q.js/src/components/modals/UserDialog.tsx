import { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import { Role } from '@/enums/role';
import { useTranslation } from 'react-i18next';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { user$ } from '@/store/userStore';
import { User } from '@/types/User.interface';
import { UserStatus } from '@/enums/user-status';
import { getAvailableRoles } from '@/utils/helpers';

type UserDialogProps = {
  open: boolean;
  onClose: () => void;
  error?: string;
  user?: User | null;
  onSave: (user: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    role: Role;
    status?: UserStatus;
    password?: string;
    companyId?: number;
    branchId?: number;
  }) => Promise<void>;
};

const UserDialog = ({
  open,
  onClose,
  onSave,
  error,
  user
}: UserDialogProps) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const { t } = useTranslation();
  const { role: currentUserRole, isAdminView } = useUserViewMode();
  const isEditMode = !!user;

  // Use the helper function to get available roles
  const availableRoles = getAvailableRoles(currentUserRole as Role);

  const resetForm = () => {
    setName('');
    setSurname('');
    setEmail('');
    setPhone('');
    setRole('');
    setStatus('');
    setPassword('');
    setSelectedCompanyId('');
    setSelectedBranchId('');
    setBranches([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const data = await companyService.getAll({});
      setCompanies(data.items || []);
    } catch (error) {
      console.error('Error fetching companies: ', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchBranches = async (companyId: number) => {
    try {
      setLoadingBranches(true);
      const result = await branchService.getAll({ companyId });
      setBranches(result.items || []);
    } catch (error) {
      console.error('Error fetching branches: ', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Initialize form with user data when editing
  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        setName(user.name || '');
        setSurname(user.surname || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setRole((user.role as Role) || '');
        setStatus((user.status as UserStatus) || '');
        setPassword(''); // Don't set password when editing

        if (user.company && user.company.id) {
          setSelectedCompanyId(user.company.id);
        }

        if (user.userBranches && user.userBranches.length > 0) {
          // Find primary branch or use first branch
          const primaryBranch = user.userBranches.find((ub) => ub.isPrimary);
          const branchToUse = primaryBranch || user.userBranches[0];
          if (branchToUse && branchToUse.branch) {
            setSelectedBranchId(branchToUse.branch.id);
          }
        } else if (user.currentBranch && user.currentBranch.id) {
          // Fallback to currentBranch for backward compatibility
          setSelectedBranchId(user.currentBranch.id);
        }

        // If company is selected, fetch branches
        if (user.company && user.company.id) {
          fetchBranches(user.company.id);
        }
      } else {
        resetForm();
      }
    }
  }, [open, user, isEditMode]);

  useEffect(() => {
    const currentUserRole = user$.role.get();
    const currentUserCompanyId = user$.company?.id?.get();
    const currentUserBranchId = user$.currentBranch?.id?.get();

    if (!open) {
      resetForm();
      return;
    }

    if (
      role === Role.COMPANY_ADMIN ||
      role === Role.CUSTOMER ||
      (role === Role.BRANCH_ADMIN && currentUserRole === Role.SUPER_ADMIN) ||
      (role === Role.EMPLOYEE && currentUserRole === Role.SUPER_ADMIN)
    ) {
      fetchCompanies();
      // Only clear branch selection if not in edit mode
      if (!isEditMode) {
        setSelectedBranchId('');
      }
    } else if (
      (role === Role.BRANCH_ADMIN || role === Role.EMPLOYEE) &&
      currentUserRole === Role.COMPANY_ADMIN &&
      currentUserCompanyId
    ) {
      fetchBranches(currentUserCompanyId);
      setSelectedCompanyId(currentUserCompanyId);
    } else if (
      role === Role.EMPLOYEE &&
      currentUserRole === Role.BRANCH_ADMIN &&
      currentUserBranchId
    ) {
      setSelectedBranchId(currentUserBranchId);
      setSelectedCompanyId(currentUserCompanyId || '');
    }
  }, [role, open, isEditMode]);

  const handleSave = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await onSave({
        name,
        surname,
        email,
        phone,
        role: role as Role,
        ...(isEditMode && status && { status: status as UserStatus }),
        ...(!isEditMode && { password }), // Only include password for new users
        ...(!isEditMode &&
          selectedCompanyId && { companyId: Number(selectedCompanyId) }),
        branchId: selectedBranchId ? Number(selectedBranchId) : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        className="user-add-dialog"
      >
        <DialogTitle>
          {isEditMode ? t('edit.user') : t('new.user')}
          {isEditMode && ` - ${user?.name} ${user?.surname}`}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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
          <TextField
            required
            margin="dense"
            label={t('surname')}
            type="text"
            fullWidth
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
          <TextField
            required
            margin="dense"
            label={t('email')}
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEditMode} // Email cannot be changed when editing
          />
          <TextField
            required
            margin="dense"
            label={t('phone')}
            type="tel"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {!isEditMode && (
            <TextField
              required
              margin="dense"
              label={t('password')}
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText={
                <Typography component="span" color="textSecondary">
                  {t('create.password.for.new.user.helper')}
                </Typography>
              }
            />
          )}

          <FormControl fullWidth margin="dense" required>
            <InputLabel>{t('role')}</InputLabel>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              label={t('role')}
            >
              {availableRoles.map((roleOption) => (
                <MenuItem key={roleOption} value={roleOption}>
                  {t(`roles.${roleOption.toLowerCase()}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isEditMode && (
            <FormControl fullWidth margin="dense" required>
              <InputLabel>{t('status')}</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                label={t('status')}
              >
                {Object.values(UserStatus).map((statusOption) => (
                  <MenuItem key={statusOption} value={statusOption}>
                    {t(statusOption.toLowerCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {(role === Role.COMPANY_ADMIN ||
            role === Role.CUSTOMER ||
            ((role === Role.BRANCH_ADMIN || role === Role.EMPLOYEE) &&
              currentUserRole === Role.SUPER_ADMIN)) && (
            <FormControl fullWidth margin="dense" required>
              <InputLabel>{t('company')}</InputLabel>
              <Select
                value={selectedCompanyId}
                onChange={(e) => {
                  const companyId = e.target.value as number;
                  setSelectedCompanyId(companyId);
                  setSelectedBranchId('');
                  if (companyId) {
                    fetchBranches(companyId);
                  } else {
                    setBranches([]);
                  }
                }}
                label={t('company')}
                disabled={loadingCompanies || isEditMode}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
              {loadingCompanies && (
                <CircularProgress size={20} sx={{ ml: 1 }} />
              )}
            </FormControl>
          )}

          {(role === Role.BRANCH_ADMIN ||
            (role === Role.EMPLOYEE &&
              currentUserRole !== Role.BRANCH_ADMIN)) &&
            isAdminView && (
              <FormControl fullWidth margin="dense" required>
                <InputLabel>{t('branch')}</InputLabel>
                <Select
                  value={selectedBranchId}
                  onChange={(e) =>
                    setSelectedBranchId(e.target.value as number)
                  }
                  label={t('branch')}
                  disabled={
                    loadingBranches ||
                    branches.length === 0 ||
                    selectedCompanyId === ''
                  }
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
                {loadingBranches && (
                  <CircularProgress size={20} sx={{ ml: 1 }} />
                )}
                {!loadingBranches && selectedCompanyId === '' && (
                  <Typography
                    color="textSecondary"
                    variant="body2"
                    sx={{ mt: 1 }}
                  >
                    {t('select.company.first')}
                  </Typography>
                )}
                {!loadingBranches &&
                  branches.length === 0 &&
                  selectedCompanyId !== '' && (
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                      {t('no.branches.available')}
                    </Typography>
                  )}
              </FormControl>
            )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="primary"
            disabled={loading}
            className="user-dialog-cancel-button"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={
              !name ||
              !surname ||
              !email ||
              !role ||
              !phone ||
              (!isEditMode && !password) ||
              loading ||
              (role === Role.COMPANY_ADMIN && !selectedCompanyId) ||
              (role === Role.CUSTOMER && !selectedCompanyId) ||
              (role === Role.BRANCH_ADMIN &&
                currentUserRole !== Role.SUPER_ADMIN &&
                !selectedBranchId) ||
              (role === Role.EMPLOYEE &&
                currentUserRole !== Role.SUPER_ADMIN &&
                currentUserRole !== Role.BRANCH_ADMIN &&
                (!selectedCompanyId || !selectedBranchId))
            }
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              t('update')
            ) : (
              t('save')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserDialog;
