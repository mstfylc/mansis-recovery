import { useState } from 'react';
import {
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import { Delete, Add, ArrowBack } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { campaignService } from '@/data/campaignService';
import { Campaign } from '@/types/Campaign.interface';
import { User } from '@/types/User.interface';
import { Role } from '@/enums/role';
import UserAutocomplete from '@/components/UserAutocomplete';
import CampaignAutocomplete from '@/components/CampaignAutocomplete';

interface BatchRow {
  user: User | null;
  campaign: Campaign | null;
  remainingRights: string;
}

const PageHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      sx={{ mb: 2 }}
    >
      <Box display="flex" alignItems="center">
        <ArrowBack
          sx={{ mr: 1, cursor: 'pointer' }}
          onClick={() => navigate('/management/campaigns')}
          className="back-button"
        />
        <Typography variant="h3" component="h3">
          {t('batch.customer.data.entry')}
        </Typography>
      </Box>
    </Box>
  );
};

const AddCustomerData = () => {
  const { t } = useTranslation();

  const [rows, setRows] = useState<BatchRow[]>([
    { user: null, campaign: null, remainingRights: '' }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openNotification, setOpenNotification] = useState<boolean>(false);

  const handleChange = (
    index: number,
    field: keyof BatchRow,
    value: string | User | Campaign | null
  ) => {
    const updated = [...rows];
    updated[index][field] = value as any;
    setRows(updated);
  };

  const isDuplicateRow = (currentIndex: number): boolean => {
    const currentRow = rows[currentIndex];
    if (!currentRow.user || !currentRow.campaign) return false;

    return rows.some((row, index) => {
      if (index === currentIndex) return false;
      return (
        row.user?.id === currentRow.user?.id &&
        row.campaign?.id === currentRow.campaign?.id
      );
    });
  };

  const handleAddRow = () => {
    setRows([...rows, { user: null, campaign: null, remainingRights: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length > 1) {
      const updated = [...rows];
      updated.splice(index, 1);
      setRows(updated);
    }
  };

  const validateRows = (): string | null => {
    const userCampaignCombinations = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.user || !row.campaign || !row.remainingRights) {
        return t('error.all.fields.required');
      }

      const combinationKey = `${row.user.id}-${row.campaign.id}`;
      if (userCampaignCombinations.has(combinationKey)) {
        const firstRowIndex = userCampaignCombinations.get(combinationKey)! + 1;
        const currentRowIndex = i + 1;
        return t('error.duplicate.user.campaign', {
          user: `${row.user.name} ${row.user.surname}`,
          campaign: row.campaign.title,
          firstRow: firstRowIndex,
          currentRow: currentRowIndex
        });
      }
      userCampaignCombinations.set(combinationKey, i);

      const remainingRights = parseInt(row.remainingRights);
      if (isNaN(remainingRights) || remainingRights < 0) {
        return t('error.invalid.remaining.rights');
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateRows();
    if (validationError) {
      setError(validationError);
      setOpenNotification(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        entries: rows.map((row) => ({
          userId: row.user!.id,
          campaignId: row.campaign!.id,
          remainingRights: parseInt(row.remainingRights)
        }))
      };

      await campaignService.batchCustomerDataEntry(payload);

      setSuccess(t('batch.customer.data.success'));
      setError(null);
      setOpenNotification(true);

      // Reset form after success
      setRows([{ user: null, campaign: null, remainingRights: '' }]);
    } catch (err) {
      console.error('Error saving batch customer data:', err);
      if (err.response.data.message[0].includes('exceeds bundle total count')) {
        setError(err.response.data.message);
      } else {
        setError(t('batch.customer.data.error'));
      }
      setOpenNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setOpenNotification(false);
  };

  return (
    <>
      <Helmet>
        <title>{t('batch.customer.data.entry')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="body2" mb={3} color="text.secondary">
            {t('batch.customer.data.description')}
          </Typography>

          {rows.map((row, index) => {
            const isDuplicate = isDuplicateRow(index);
            return (
              <Grid
                container
                spacing={2}
                key={index}
                sx={{
                  mb: 2,
                  p: 1,
                  borderRadius: 1,
                  border: isDuplicate ? '2px solid #f44336' : 'none',
                  backgroundColor: isDuplicate
                    ? 'rgba(244, 67, 54, 0.05)'
                    : 'transparent'
                }}
                alignItems={'center'}
              >
                <Grid item xs={12} sm={3}>
                  <UserAutocomplete
                    value={row.user}
                    onChange={(user) => handleChange(index, 'user', user)}
                    roles={[Role.CUSTOMER]}
                    error={isDuplicate}
                    helperText={
                      isDuplicate ? t('error.duplicate.detected') : undefined
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <CampaignAutocomplete
                    value={row.campaign}
                    onChange={(campaign) =>
                      handleChange(index, 'campaign', campaign)
                    }
                    error={isDuplicate}
                    helperText={
                      isDuplicate ? t('error.duplicate.detected') : undefined
                    }
                    types={['BUNDLE_PRODUCT', 'BUNDLE_ACTIVITY']}
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <TextField
                    type="number"
                    label={t('remaining.rights')}
                    value={row.remainingRights}
                    onChange={(e) =>
                      handleChange(index, 'remainingRights', e.target.value)
                    }
                    inputProps={{ min: 0 }}
                    fullWidth
                    error={isDuplicate}
                  />
                </Grid>

                <Grid item xs={12} sm={1}>
                  <IconButton
                    sx={{ pl: 0 }}
                    onClick={() => handleRemoveRow(index)}
                    color="error"
                    disabled={rows.length === 1}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })}

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button
              variant="outlined"
              onClick={handleAddRow}
              startIcon={<Add />}
            >
              {t('add.new.row')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : t('batch.save')}
            </Button>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={openNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          variant="filled"
          severity={error ? 'error' : 'success'}
          onClose={handleCloseNotification}
        >
          <Typography>{error || success}</Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddCustomerData;
