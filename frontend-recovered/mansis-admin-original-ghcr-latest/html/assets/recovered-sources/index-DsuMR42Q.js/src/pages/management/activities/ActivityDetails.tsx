import { useState, useEffect, useContext } from 'react';
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
  useTheme,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { activityService } from '@/data/activityService';
import { Activity } from '@/types/Activity.interface';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ActivityStatus } from '@/enums/activity-status';
import StatusLabel from '@/components/StatusLabel';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ImagePreviewModal from '@/components/images/ImagePreviewModal';
import EventIcon from '@mui/icons-material/Event';
import TodayIcon from '@mui/icons-material/Today';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChildActivityFormDialog, {
  ChildActivityFormData
} from '@/components/modals/ChildActivityFormDialog';
import { ChildActivity } from '@/types/ChildActivity.interface';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

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
          className="activity-back-button"
        />
        <Typography variant="h3" component="h3">
          {t('activity.details')}
        </Typography>
      </Box>
    </Box>
  );
};

const ActivityDetails = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const initialActivity = location.state?.activity || null;

  const [activity, setActivity] = useState<Activity | null>(initialActivity);
  const [loading, setLoading] = useState<boolean>(!activity);
  const [error, setError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedChildActivity, setSelectedChildActivity] =
    useState<ChildActivity | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [childActivityToDelete, setChildActivityToDelete] = useState<
    number | null
  >(null);

  const fetchActivityDetails = async () => {
    if (!activityId || !activity) return;

    setLoading(true);
    try {
      const result = await activityService.getById(Number(activityId));
      setActivity(result);
    } catch (err) {
      console.error('Error fetching activity details:', err);
      setError(t('error.loading.activity.details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityDetails();
  }, [activityId]);

  const handleImageClick = (imageUrl: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewModalOpen(true);
    }
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  const handleOpenDialog = () => {
    setIsEditMode(false);
    setSelectedChildActivity(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedChildActivity(null);
    setIsEditMode(false);
  };

  const handleEditChildActivity = (childActivity: ChildActivity) => {
    setSelectedChildActivity(childActivity);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteConfirm = (childActivityId: number) => {
    setChildActivityToDelete(childActivityId);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setChildActivityToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (childActivityToDelete) {
      await handleDeleteChildActivity(childActivityToDelete);
      handleCloseDeleteConfirm();
    }
  };

  const handleDeleteChildActivity = async (childActivityId: number) => {
    if (!activityId) return;

    try {
      await activityService.deleteChildActivity(
        Number(activityId),
        childActivityId
      );

      if (activity) {
        setActivity({
          ...activity,
          childActivities:
            activity.childActivities?.filter(
              (ca) => ca.id !== childActivityId
            ) || []
        });
      }

      setSnackbar({
        open: true,
        message: t('activity.child.delete.success'),
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting child activity:', err);
      if (err.response?.data?.message) {
        // Handle specific backend error messages
        const errorMessage = err.response.data.message;
        if (
          errorMessage.includes(
            'Child activity has at least one not used ticket'
          )
        ) {
          setSnackbar({
            open: true,
            message: t(
              'activity.child.delete.error.has.unused.tickets',
              'Session cannot be deleted because it has unused tickets'
            ),
            severity: 'error'
          });
        } else if (
          errorMessage.includes('Child activity is used in a campaign')
        ) {
          setSnackbar({
            open: true,
            message: t(
              'activity.child.delete.error.used.in.campaign',
              'Session cannot be deleted because it is used in a campaign'
            ),
            severity: 'error'
          });
        } else {
          setSnackbar({
            open: true,
            message: err.response.data.message,
            severity: 'error'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: t('activity.child.delete.error'),
          severity: 'error'
        });
      }
    }
  };

  const handleSubmitChildActivity = async (formData: ChildActivityFormData) => {
    if (!activityId) return;

    try {
      if (isEditMode && selectedChildActivity) {
        // Update existing child activity
        await activityService.updateChildActivity(
          Number(activityId),
          selectedChildActivity.id,
          formData
        );

        setSnackbar({
          open: true,
          message: t('activity.child.update.success'),
          severity: 'success'
        });
      } else {
        // Create new child activity
        const childActivityData = {
          ...formData,
          activityId: parseInt(activityId)
        };

        await activityService.createChildActivity(
          Number(activityId),
          childActivityData
        );

        setSnackbar({
          open: true,
          message: t('activity.child.create.success'),
          severity: 'success'
        });
      }

      await fetchActivityDetails();

      handleCloseDialog();
    } catch (err) {
      console.error('Error saving child activity:', err);
      setSnackbar({
        open: true,
        message: isEditMode
          ? t('activity.child.update.error')
          : t('activity.child.create.error'),
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  if (error || !activity) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom color="error">
          {error ?? t('activity.not.found')}
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('activity.details')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{ p: 3, borderRadius: 2 }}
              className="activity-info-section"
            >
              <Typography variant="h5" gutterBottom>
                {t('activity.information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                {activity.file?.url && (
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
                    >
                      <img
                        src={activity.file.url}
                        alt={activity.title}
                        style={{
                          maxWidth: '100%',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() =>
                          activity.file &&
                          handleImageClick(activity.file.url || '')
                        }
                      />
                    </Box>
                  </Grid>
                )}

                <Grid
                  item
                  xs={12}
                  sm={activity.file?.url ? 8 : 12}
                  md={activity.file?.url ? 9 : 12}
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
                          {t('name')}
                        </Typography>
                        <Typography
                          variant="body1"
                          gutterBottom
                          fontWeight="bold"
                        >
                          {activity.title}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('status')}
                        </Typography>
                        <StatusLabel
                          status={activity.status as ActivityStatus}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          <StorefrontIcon
                            fontSize="small"
                            sx={{ mr: 0.5, verticalAlign: 'middle' }}
                          />
                          {t('branch')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {activity.branch?.name || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          <TodayIcon
                            fontSize="small"
                            sx={{ mr: 0.5, verticalAlign: 'middle' }}
                          />
                          {t('created.at')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDateToDayMonthYearTime(activity.createdAt)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          <ScheduleIcon
                            fontSize="small"
                            sx={{ mr: 0.5, verticalAlign: 'middle' }}
                          />
                          {t('updated.at')}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {activity.updatedAt
                            ? formatDateToDayMonthYearTime(activity.updatedAt)
                            : '-'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box mt={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('description')}
                      </Typography>
                      <Typography variant="body1">
                        {activity.description || t('no.description')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{ p: 3, borderRadius: 2 }}
              className="activity-child-activities-section"
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h5" gutterBottom>
                  {t('child.activities')}
                </Typography>
                <Can I="create" a="Activity" ability={ability}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                    className="activity-add-child-button"
                  >
                    {t('add.child.activity')}
                  </Button>
                </Can>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {activity.childActivities &&
              activity.childActivities.length > 0 ? (
                <Grid container spacing={2}>
                  {activity.childActivities.map((childActivity) => (
                    <Grid item xs={12} md={6} lg={4} key={childActivity.id}>
                      <Card
                        sx={{ height: '100%' }}
                        className="child-activity-card"
                      >
                        <CardContent>
                          <Box>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="h6" gutterBottom>
                                {childActivity.title}
                              </Typography>
                              <Box>
                                <Can I="update" a="Activity" ability={ability}>
                                  <Tooltip title={t('edit')}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        handleEditChildActivity(childActivity)
                                      }
                                      className="activity-child-edit-button"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Can>
                                <Can I="delete" a="Activity" ability={ability}>
                                  <Tooltip title={t('delete')}>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleOpenDeleteConfirm(
                                          childActivity.id
                                        )
                                      }
                                      className="activity-child-delete-button"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Can>
                              </Box>
                            </Box>

                            <Box display="flex" alignItems="center" mb={1}>
                              <EventIcon
                                fontSize="small"
                                sx={{
                                  mr: 0.5,
                                  color: theme.palette.primary.main
                                }}
                              />
                              <Typography variant="body2">
                                {formatDateToDayMonthYearTime(
                                  childActivity.startDateTime
                                )}
                                {' - '}
                                {formatDateToDayMonthYearTime(
                                  childActivity.endDateTime
                                )}
                              </Typography>
                            </Box>

                            {childActivity.lastEnrollmentDateTime && (
                              <Box display="flex" alignItems="center" mb={1}>
                                <ScheduleIcon
                                  fontSize="small"
                                  sx={{
                                    mr: 0.5,
                                    color: theme.palette.warning.main
                                  }}
                                />
                                <Typography variant="body2">
                                  <strong>{t('last.enrollment.date')}:</strong>{' '}
                                  {formatDateToDayMonthYearTime(
                                    childActivity.lastEnrollmentDateTime
                                  )}
                                </Typography>
                              </Box>
                            )}

                            {childActivity.location && (
                              <Box display="flex" alignItems="center" mb={1}>
                                <StorefrontIcon
                                  fontSize="small"
                                  sx={{
                                    mr: 0.5,
                                    color: theme.palette.primary.main
                                  }}
                                />
                                <Typography variant="body2">
                                  {childActivity.location}
                                </Typography>
                              </Box>
                            )}

                            {childActivity.capacity !== null && (
                              <Box display="flex" alignItems="center" mb={1}>
                                <PersonIcon
                                  fontSize="small"
                                  sx={{
                                    mr: 0.5,
                                    color: theme.palette.primary.main
                                  }}
                                />
                                <Typography variant="body2">
                                  {t('capacity')}: {childActivity.capacity}
                                </Typography>
                              </Box>
                            )}

                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              mt={2}
                            >
                              <Typography variant="h6" color="primary">
                                {childActivity.price} TL
                              </Typography>
                            </Box>

                            {childActivity.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                              >
                                {childActivity.description}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box display="flex" justifyContent="center" p={4}>
                  <Typography variant="body1" color="text.secondary">
                    {t('no.child.activities')}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <ImagePreviewModal
        open={previewModalOpen}
        imageUrl={previewImageUrl}
        onClose={handleClosePreviewModal}
      />

      <ChildActivityFormDialog
        open={isDialogOpen}
        activityId={parseInt(activityId || '0')}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitChildActivity}
        childActivity={selectedChildActivity}
        isEditMode={isEditMode}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title={t('delete.child.activity')}
        message={t('delete.child.activity.question')}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          variant="filled"
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ActivityDetails;
