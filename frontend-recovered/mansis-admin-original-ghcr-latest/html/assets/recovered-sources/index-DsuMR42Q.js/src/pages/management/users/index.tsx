import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/Users/management/PageHeader';
import UsersTable from '@/content/Management/Users/management/UsersTable';
import { useState } from 'react';
import { Role } from '@/enums/role';
import { User } from '@/types/User.interface';
import { Filters } from '@/types/Filters';
import { userService } from '@/data/userService';
import UserDialog from '@/components/modals/UserDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const { t } = useTranslation();

  const fetchUsers = async (filters?: Filters) => {
    try {
      setLoading(true);
      const params = transformFiltersToApiParams(filters);
      const data = await userService.getAll(params);
      setUsers(data.items);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewUser = async (user: {
    name: string;
    surname: string;
    email: string;
    phone?: string;
    role: Role;
  }) => {
    try {
      setLoading(true);
      await userService.create(user);
      setError(undefined);
      setShowNewUserDialog(false);
      setShowSuccess(true);
      setSuccessMessage(t('user.create.success.message'));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setError(t('user.create.error.duplicate'));
      } else {
        setError(t('user.create.error.message'));
        console.error('Error creating user:', error);
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchUsers();
  };

  const handleDeleteConfirm = async (userId: number) => {
    setDeleteUserId(userId);
  };

  const handleDeleteCancel = () => {
    setDeleteUserId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteUserId) return;

    try {
      setLoading(true);
      await userService.delete(deleteUserId);
      setSuccessMessage(t('user.delete.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error while deleting user:', error);
      return;
    } finally {
      setLoading(false);
      setDeleteUserId(null);
    }
    fetchUsers();
  };

  const handleBulkDeleteUsers = async (
    selectedUsers: User[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await userService.bulkDelete(selectedUsers.map((user) => user.id));
      setSuccessMessage(t('user.bulk.delete.success.message'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      setError(t('user.bulk.delete.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchUsers();
  };

  const handleBulkUpdateUserStatus = async (
    selectedUsers: User[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await userService.bulkUpdateStatus(
        selectedUsers.map((user) => user.id),
        status
      );

      const updatedCount = result?.updatedCount;
      setSuccessMessage(
        t('user.bulk.status.update.success.message', {
          count: updatedCount || selectedUsers.length
        })
      );
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk status update:', error);
      return;
    } finally {
      setLoading(false);
    }
    fetchUsers();
  };

  const handleUpdateUser = async (userId: number, updates: Partial<User>) => {
    try {
      setLoading(true);
      await userService.update(userId, updates);
      setSuccessMessage(t('user.update.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(t('user.update.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchUsers();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchUsers(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('user.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <UsersTable
            users={users}
            loading={loading}
            totalCount={totalCount}
            setShowNewUserDialog={setShowNewUserDialog}
            onDeleteUser={handleDeleteConfirm}
            onBulkDeleteUsers={handleBulkDeleteUsers}
            onBulkUpdateStatus={handleBulkUpdateUserStatus}
            onUpdateUser={handleUpdateUser}
            onFilterChange={handleFilterChange}
            pageKey="users"
          />
        </Grid>
      </Grid>
      <UserDialog
        open={showNewUserDialog}
        onClose={() => {
          setError(undefined);
          setShowNewUserDialog(false);
        }}
        onSave={handleSaveNewUser}
        error={error}
      />
      <ConfirmDialog
        open={Boolean(deleteUserId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.user')}
        message={t('delete.user.question')}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <MuiAlert
          variant="filled"
          severity="success"
          onClose={() => setShowSuccess(false)}
        >
          <Typography>{successMessage}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default UserManagement;
