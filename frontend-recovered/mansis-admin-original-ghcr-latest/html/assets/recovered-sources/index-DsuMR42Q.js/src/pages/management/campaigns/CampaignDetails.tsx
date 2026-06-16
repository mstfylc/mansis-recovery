import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Divider,
  Grid,
  Container,
  Paper,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Button
} from '@mui/material';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { campaignService } from '@/data/campaignService';
import {
  CAMPAIGNS,
  PRODUCTS,
  CATEGORIES,
  CHILD_ACTIVITIES,
  BUNDLES
} from '@/data/endpoints';
import { Campaign } from '@/types/Campaign.interface';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CampaignStatus } from '@/enums/campaign-status';
import { CampaignType } from '@/enums/campaign-type';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CategoryIcon from '@mui/icons-material/Category';
import TodayIcon from '@mui/icons-material/Today';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { campaignState$, setSelectedCampaign } from '@/store/campaignStore';
import { useObservable } from '@legendapp/state/react';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import { Remove } from '@mui/icons-material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

import { CampaignItemsList } from '@/components/campaign/CampaignItemsList';
import AddCampaignItemsModal from '@/components/campaign/AddCampaignItemsModal';

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
        <ArrowBackIcon
          sx={{ mr: 1, cursor: 'pointer' }}
          onClick={() => navigate(-1)}
          className="campaign-back-button"
        />
        <Typography variant="h3" component="h3">
          {t('campaign.details')}
        </Typography>
      </Box>
    </Box>
  );
};

export interface CampaignResponse {
  status: number;
  message: string;
  campaign: Campaign;
}

const CampaignDetails = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const campaignStateData = useObservable(campaignState$);

  // Find campaign according to priority:
  // 1. location.state (most recent data passed via navigation)
  // 2. selected campaign in store
  // 3. campaignId in the list of all campaigns in store
  const findCampaignFromStore = () => {
    const selectedCampaign = campaignStateData.selectedCampaign.get();

    if (
      selectedCampaign &&
      campaignId &&
      selectedCampaign.id === parseInt(campaignId)
    ) {
      return selectedCampaign;
    }

    if (campaignId) {
      return (
        campaignStateData.campaigns
          .get()
          .find((c) => c.id === parseInt(campaignId)) || null
      );
    }

    return null;
  };

  const initialCampaign = location.state?.campaign || findCampaignFromStore();

  const [campaign, setCampaign] = useState<Campaign | null>(initialCampaign);
  const [loading, setLoading] = useState<boolean>(!campaign);
  const [error, setError] = useState<string | null>(null);
  const [errorSeverity, setErrorSeverity] = useState<
    'error' | 'success' | 'warning'
  >('error');
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [addItemsModalOpen, setAddItemsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (campaign) {
      setSelectedCampaign(campaign);
    }
  }, [campaign]);

  const fetchCampaignDetails = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      const result = await campaignService.getById(Number(campaignId));
      // getById returns Campaign directly from service (response.data)
      const campaignData = (result as any).campaign ?? result;
      setCampaign(campaignData);
      setSelectedCampaign(campaignData);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setError(t('error.loading.campaign.details'));
      setErrorSeverity('error');
      setOpenNotification(true);
    } finally {
      setLoading(false);
    }
  }, [campaignId, t]);

  useEffect(() => {
    if (campaign) return;
    fetchCampaignDetails();
  }, [fetchCampaignDetails, campaign]);

  const handleImageClick = (imageUrl: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewModalOpen(true);
    }
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  const handleCloseNotification = () => {
    setOpenNotification(false);
  };

  const getCampaignTypeLabel = (type: CampaignType) => {
    switch (type) {
      case CampaignType.PRODUCT:
        return t('product');
      case CampaignType.CATEGORY:
        return t('category');
      case CampaignType.ACTIVITY:
        return t('activity');
      case CampaignType.BUNDLE_ACTIVITY:
        return t('bundle.activity');
      case CampaignType.BUNDLE_PRODUCT:
        return t('bundle.product');
      default:
        return type;
    }
  };

  const handleAddItems = async (selectedItems: any[]) => {
    if (!campaign || !campaignId || selectedItems.length === 0) return;

    try {
      setLoading(true);

      let endpoint = '';
      let addPayload = {};

      switch (campaign.type) {
        case CampaignType.PRODUCT:
          endpoint = `${CAMPAIGNS}/${campaignId}${PRODUCTS}`;
          addPayload = {
            itemIds: selectedItems.map((item) => item.id)
          };
          break;
        case CampaignType.CATEGORY:
          endpoint = `${CAMPAIGNS}/${campaignId}${CATEGORIES}`;
          addPayload = {
            itemIds: selectedItems.map((item) => item.id)
          };
          break;
        case CampaignType.ACTIVITY:
          endpoint = `${CAMPAIGNS}/${campaignId}${CHILD_ACTIVITIES}`;
          addPayload = {
            itemIds: selectedItems.map((item) => item.id)
          };
          break;
        case CampaignType.BUNDLE_PRODUCT:
          endpoint = `${CAMPAIGNS}/${campaignId}${BUNDLES}?type=PRODUCT`;
          addPayload = {
            itemIds: selectedItems.map((item) => item.id)
          };
          break;
        case CampaignType.BUNDLE_ACTIVITY:
          endpoint = `${CAMPAIGNS}/${campaignId}${BUNDLES}?type=CHILD_ACTIVITY`;
          addPayload = {
            itemIds: selectedItems.map((item) => item.id)
          };
          break;
        default:
          throw new Error('Unsupported campaign type');
      }

      const responseData = await campaignService.addItemsToEndpoint(
        endpoint,
        addPayload
      );

      await fetchCampaignDetails();

      if (
        responseData?.success &&
        responseData?.skippedCount > 0 &&
        responseData?.addedCount > 0
      ) {
        setSuccessMessage(
          t('items.added.to.campaign.success.with.skipped', {
            count: responseData.skippedCount
          })
        );
        setErrorSeverity('success');
      } else if (
        responseData?.success &&
        responseData?.skippedCount === 0 &&
        responseData?.addedCount > 0
      ) {
        setSuccessMessage(t('campaign.items.added.successfully'));
        setErrorSeverity('success');
      } else if (responseData?.success && responseData?.addedCount === 0) {
        setSuccessMessage(t('items.already.in.campaign'));
        setErrorSeverity('warning');
      }

      setOpenNotification(true);
      setAddItemsModalOpen(false);
    } catch (err) {
      console.error('Error adding items to campaign:', err);
      setError(t('error.adding.campaign.items'));
      setErrorSeverity('error');
      setOpenNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const onItemsRemoved = async () => {
    await fetchCampaignDetails();
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

  if (!campaign) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom color="error">
          {t('campaign.not.found')}
        </Typography>
      </Container>
    );
  }

  const numberOfBundlesUnderCampaign = campaign.campaignBundle ? 1 : 0; // For now, in our structure we can assign only 1 bundle to 1 campaign.

  return (
    <>
      <Helmet>
        <title>{t('campaign.details')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{ p: 3, borderRadius: 2 }}
              className="campaign-info-section"
            >
              <Typography variant="h5" gutterBottom>
                {t('campaign.information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                {campaign.file?.url && (
                  <Grid item xs={12} sm={4} md={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        backgroundColor: 'background.paper',
                        height: '100%',
                        position: 'relative'
                      }}
                      className="campaign-image-preview"
                    >
                      <img
                        src={campaign.file.url}
                        alt={campaign.title}
                        style={{
                          maxWidth: '100%',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() =>
                          campaign.file &&
                          handleImageClick(campaign.file.url || '')
                        }
                      />
                    </Box>
                  </Grid>
                )}

                <Grid
                  item
                  xs={12}
                  sm={campaign.file?.url ? 8 : 12}
                  md={campaign.file?.url ? 9 : 12}
                >
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('title')}
                        </Typography>
                        <Typography
                          variant="body1"
                          gutterBottom
                          fontWeight="bold"
                        >
                          {campaign.title}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('created.at')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDateToDayMonthYearTime(campaign.createdAt)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('updated.at')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {campaign.updatedAt
                            ? formatDateToDayMonthYearTime(campaign.updatedAt)
                            : '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          <TodayIcon
                            fontSize="small"
                            sx={{ mr: 0.5, verticalAlign: 'middle' }}
                          />
                          {t('start.date')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDateToDayMonthYearTime(campaign.startDateTime)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          <ScheduleIcon
                            fontSize="small"
                            sx={{ mr: 0.5, verticalAlign: 'middle' }}
                          />
                          {t('end.date')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDateToDayMonthYearTime(campaign.endDateTime)}
                        </Typography>
                      </Grid>

                      {campaign.type === CampaignType.BUNDLE_ACTIVITY && (
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            <ConfirmationNumberIcon
                              fontSize="small"
                              sx={{ mr: 0.5, verticalAlign: 'middle' }}
                            />
                            {t('bundle.total.count')}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {campaign.campaignBundle?.bundle?.totalCount || 0}
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('description')}
                        </Typography>

                        <Typography variant="body1">
                          {campaign.description || t('no.description')}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<ListAltIcon />}
                            onClick={() =>
                              navigate(
                                `/management/campaigns/${campaign.id}/usages`
                              )
                            }
                            className="campaign-usages-button"
                          >
                            {t('list.usages')}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2} className="campaign-stats">
              {/* Campaign Type Card */}
              <Grid item xs={12} md={6} lg={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <CategoryIcon
                        color="primary"
                        sx={{ fontSize: 40, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {getCampaignTypeLabel(campaign.type)}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('campaign.type')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Status Card */}
              <Grid item xs={12} md={6} lg={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      {campaign.status === CampaignStatus.ACTIVE ? (
                        <CheckCircleIcon
                          color="success"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                      ) : campaign.status === CampaignStatus.PASSIVE ? (
                        <Remove color="error" sx={{ fontSize: 40, mr: 2 }} />
                      ) : campaign.status === CampaignStatus.PENDING ? (
                        <ScheduleIcon
                          color="warning"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                      ) : (
                        <CancelIcon
                          color="error"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                      )}
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {t(campaign.status.toLowerCase())}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('status')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Discount Percentage Card */}
              <Grid item xs={12} md={6} lg={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <LocalOfferIcon
                        color="primary"
                        sx={{ fontSize: 40, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {campaign.discount}%
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('discount.percentage')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Content-specific cards based on campaign type */}
              {(campaign.type === CampaignType.PRODUCT ||
                campaign.type === undefined) && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <ShoppingCartIcon
                          color="primary"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {campaign.campaignProducts?.length || 0}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('products')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {campaign.type === CampaignType.CATEGORY && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <CategoryIcon
                          color="primary"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {campaign.campaignCategories?.length || 0}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('categories')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {campaign.type === CampaignType.ACTIVITY && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <LocalOfferIcon
                          color="primary"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {campaign.campaignChildActivities?.length || 0}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('activities')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {campaign.type === CampaignType.BUNDLE_ACTIVITY && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <LocalOfferIcon
                          color="primary"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {numberOfBundlesUnderCampaign}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('bundle.activities')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {campaign.type === CampaignType.BUNDLE_PRODUCT && (
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <ShoppingCartIcon
                          color="primary"
                          sx={{ fontSize: 40, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {numberOfBundlesUnderCampaign}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('bundle.products')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12} className="campaign-items-list">
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <CampaignItemsList
                campaign={campaign}
                onAddItems={() => setAddItemsModalOpen(true)}
                onItemsRemoved={onItemsRemoved}
              />
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Add Items Modal - now using our new component */}
      <AddCampaignItemsModal
        open={addItemsModalOpen}
        onClose={() => setAddItemsModalOpen(false)}
        campaign={campaign}
        onSave={handleAddItems}
      />

      <ImagePreviewModal
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        imageUrl={previewImageUrl}
      />

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={openNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          variant="filled"
          severity={errorSeverity}
          onClose={handleCloseNotification}
        >
          <Typography>{error || successMessage}</Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default CampaignDetails;
