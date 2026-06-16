import { useState, useEffect } from 'react';
import {
  Typography,
  Divider,
  Grid,
  Container,
  Paper,
  Box,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import { branchService } from '@/data/branchService';
import { Branch } from '@/types/Branch.interface';
import { BranchStatus } from '@/enums/branch-status';
import StatusLabel from '@/components/StatusLabel';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import MapIcon from '@mui/icons-material/Map';
import { branchState$, setSelectedBranch } from '@/store/branchStore';
import { useObservable } from '@legendapp/state/react';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import BranchFinancialInfoForm from '@/components/branch/BranchFinancialInfoForm';
import DailyLoginTypesManager from '@/components/branch/DailyLoginTypesManager';
import PageHeader from '@/content/Management/Branches/DetailsPageHeader';

const BranchDetails = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const { t } = useTranslation();
  const location = useLocation();
  const branchStateData = useObservable(branchState$);

  // Find branch according to priority:
  // 1. location.state (most recent data passed via navigation)
  // 2. selected branch in store
  // 3. branchId in the list of all branches in store
  const findBranchFromStore = () => {
    const selectedBranch = branchStateData.selectedBranch.get();

    if (
      selectedBranch &&
      branchId &&
      selectedBranch.id === parseInt(branchId)
    ) {
      return selectedBranch;
    }

    if (branchId) {
      return (
        branchStateData.branches
          .get()
          .find((b) => b.id === parseInt(branchId)) || null
      );
    }

    return null;
  };

  const initialBranch = location.state?.branch || findBranchFromStore();

  const [branch, setBranch] = useState<Branch | null>(initialBranch);
  const [loading, setLoading] = useState<boolean>(!branch);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  useEffect(() => {
    if (branch) {
      setSelectedBranch(branch);
    }
  }, [branch]);

  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (!branchId) return;
      if (branch) return;

      setLoading(true);
      try {
        const result = await branchService.getById(Number(branchId));
        setBranch(result);
        setSelectedBranch(result);
      } catch (err) {
        console.error('Error fetching branch details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchDetails();
  }, [branchId, branch, t]);

  const handleImageClick = (imageUrl: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewModalOpen(true);
    }
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!branch) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom color="error">
          {t('branch.not.found')}
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('branch.details')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                {t('branch.information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                {branch?.file?.url && (
                  <Grid item xs={12} sm={4} md={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        backgroundColor: 'background.paper',
                        height: '0.5vh',
                        minHeight: '200px'
                      }}
                    >
                      <img
                        src={branch?.file?.url || ''}
                        alt={branch.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() =>
                          handleImageClick(branch?.file?.url || '')
                        }
                      />
                    </Box>
                  </Grid>
                )}

                <Grid
                  item
                  xs={12}
                  sm={branch?.file?.url ? 8 : 12}
                  md={branch?.file?.url ? 9 : 12}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('name')}
                      </Typography>
                      <Typography
                        variant="body1"
                        gutterBottom
                        fontWeight="bold"
                      >
                        {branch.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('company')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {branch.company?.name || '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('status')}
                      </Typography>
                      <StatusLabel status={branch.status as BranchStatus} />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('created.at')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDateToDayMonthYearTime(branch.createdAt)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('updated.at')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {branch.updatedAt
                          ? formatDateToDayMonthYearTime(branch.updatedAt)
                          : '-'}
                      </Typography>
                    </Grid>

                    {branch.mapcode && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <MapIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {t('mapcode')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {branch.mapcode}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <PersonIcon
                        color="primary"
                        sx={{ fontSize: 40, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {branch.numberOfUsersRegistered || 0}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('registered.users')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <ShoppingCartIcon
                        color="primary"
                        sx={{ fontSize: 40, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {branch.numberOfProductsRegistered || 0}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('registered.products')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <LocalOfferIcon
                        color="primary"
                        sx={{ fontSize: 40, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {t('daily.login.types')}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('branch.rules')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {branch.contact && (
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {t('contact.information')}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  {branch.contact.email && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center">
                        <EmailIcon sx={{ mr: 1 }} color="action" />
                        <Typography variant="body1">
                          {branch.contact.email}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {branch.contact.phone && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center">
                        <PhoneIcon sx={{ mr: 1 }} color="action" />
                        <Typography variant="body1">
                          {branch.contact.phone}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <DailyLoginTypesManager branchId={parseInt(branchId || '0')} />
          </Grid>

          <Grid item xs={12}>
            <BranchFinancialInfoForm branchId={parseInt(branchId || '0')} />
          </Grid>
        </Grid>
      </Container>

      <ImagePreviewModal
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        imageUrl={previewImageUrl}
      />
    </>
  );
};

export default BranchDetails;
