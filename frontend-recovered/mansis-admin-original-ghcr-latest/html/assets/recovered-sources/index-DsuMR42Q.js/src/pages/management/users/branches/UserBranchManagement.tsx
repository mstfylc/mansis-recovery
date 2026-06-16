import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Tooltip,
  Autocomplete,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import { userService } from '@/data/userService';
import { userBranchService } from '@/data/userBranchService';
import { branchService } from '@/data/branchService';
import { Branch } from '@/types/Branch.interface';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import StatusLabel from '@/components/StatusLabel';
import { useTranslation } from 'react-i18next';

interface UserBranch {
  id: number;
  name: string;
  address: string;
  status: string;
  isPrimary: boolean;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

const UserBranchManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userBranches, setUserBranches] = useState<UserBranch[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchUserBranches = async () => {
    setLoading(true);
    try {
      const userData = await userService.getById(Number(id));
      setUserName(`${userData.name} ${userData.surname}`);
      setUserRole(userData.role);

      const branchData = await userBranchService.getUserBranches(Number(id));
      setUserBranches(branchData);
    } catch (error) {
      console.error('Error fetching user branches:', error);
      showAlert(t('user.branch.fetch.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBranches = async () => {
    try {
      const allBranches = await branchService.getAllFlat({ getAll: true });

      const filteredBranches = allBranches.filter(
        (branch: Branch) => !userBranches.some((ub) => ub.id === branch.id)
      );

      setAvailableBranches(filteredBranches);
    } catch (error) {
      console.error('Error fetching available branches:', error);
      showAlert(t('branch.available.fetch.error'), 'error');
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserBranches();
    }
  }, [id]);

  useEffect(() => {
    if (addDialogOpen) {
      fetchAvailableBranches();
    }
  }, [addDialogOpen, userBranches]);

  const handleSetPrimary = async (branchId: number) => {
    try {
      await userBranchService.setPrimaryBranch(Number(id), branchId);
      fetchUserBranches();
      showAlert(t('branch.primary.set.success'), 'success');
    } catch (error) {
      console.error('Error setting primary branch:', error);
      showAlert(t('branch.primary.set.error'), 'error');
    }
  };

  const handleRemoveBranch = async (branchId: number) => {
    if (userRole === 'BRANCH_ADMIN' && userBranches.length === 1) {
      showAlert(t('branch.remove.only.error'), 'error');
      return;
    }

    try {
      await userBranchService.removeBranch(Number(id), branchId);
      fetchUserBranches();
      showAlert(t('branch.removed.success'), 'success');
    } catch (error: any) {
      console.error('Error removing branch:', error);

      if (error.response && error.response.status === 409) {
        showAlert(t('branch.remove.only.error'), 'error');
      } else {
        showAlert(t('branch.remove.error'), 'error');
      }
    }
  };

  const handleAddBranch = async () => {
    if (!selectedBranch) return;

    try {
      await userBranchService.addBranch(Number(id), selectedBranch.id);
      // If this was the first branch, make it primary
      if (userBranches.length === 0) {
        await userBranchService.setPrimaryBranch(Number(id), selectedBranch.id);
      }
      setAddDialogOpen(false);
      setSelectedBranch(null);
      fetchUserBranches();
      showAlert(t('branch.added.success'), 'success');
    } catch (error) {
      console.error('Error adding branch:', error);
      showAlert(t('branch.add.error'), 'error');
    }
  };

  const handleBackToUserDetails = () => {
    navigate(`/management/users/details/${id}`);
  };

  const showAlert = (
    message: string,
    severity: 'error' | 'warning' | 'info' | 'success'
  ) => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('user.branch.management')}</title>
      </Helmet>

      <PageTitleWrapper>
        <Box display="flex" alignItems="center">
          <Tooltip arrow placement="top" title={t('back.to.users')}>
            <IconButton
              onClick={handleBackToUserDetails}
              color="primary"
              sx={{ p: 1, mr: 2 }}
            >
              <ArrowBackTwoToneIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h3" component="h3" gutterBottom>
              {t('branch.management')} - {userName}
            </Typography>
            <Typography variant="subtitle2">
              {t('user.branch.management')}
            </Typography>
          </Box>
        </Box>
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Card>
          <CardHeader
            title={t('assigned.branches')}
            action={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                {t('add.branch')}
              </Button>
            }
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('branch.name')}</TableCell>
                  <TableCell>{t('branch.address')}</TableCell>
                  <TableCell>{t('branch.status')}</TableCell>
                  <TableCell align="center">{t('primary')}</TableCell>
                  <TableCell align="right">{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : userBranches.length > 0 ? (
                  userBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>{branch.name}</TableCell>
                      <TableCell>{branch.address}</TableCell>
                      <TableCell>
                        <StatusLabel status={branch.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('primary.branch.tooltip')}>
                          <IconButton
                            onClick={() =>
                              !branch.isPrimary && handleSetPrimary(branch.id)
                            }
                            color={branch.isPrimary ? 'primary' : 'default'}
                            disabled={branch.isPrimary}
                          >
                            {branch.isPrimary ? (
                              <StarIcon />
                            ) : (
                              <StarOutlineIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('remove.branch')}>
                          <IconButton
                            onClick={() => handleRemoveBranch(branch.id)}
                            color="error"
                            disabled={
                              (branch.isPrimary && userBranches.length > 1) || // Can't remove primary if there are other branches
                              (userRole === 'BRANCH_ADMIN' &&
                                userBranches.length === 1) // Can't remove the only branch for branch admin
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>{t('no.branches.assigned')}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Add Branch Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
          <DialogTitle>{t('add.branch')}</DialogTitle>
          <DialogContent>
            <Box sx={{ width: 500, mt: 2 }}>
              <Autocomplete
                options={availableBranches}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField {...params} label={t('select.branch')} />
                )}
                value={selectedBranch}
                onChange={(_, newValue) => setSelectedBranch(newValue)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddBranch}
              variant="contained"
              disabled={!selectedBranch}
            >
              {t('add')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseAlert}
            severity={alert.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default UserBranchManagement;
