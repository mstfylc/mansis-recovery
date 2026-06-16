import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Typography,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import StatusLabel from '@/components/StatusLabel';
import NotificationPreview from './components/NotificationPreview';
import { notificationService } from '@/data/notificationService';
import {
  NotificationCampaign,
  CampaignStatus
} from '@/types/Notification.interface';
import { Can } from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import { format, Locale } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';

const dateFnsLocaleMap: Record<string, Locale> = { tr, en: enUS };
import { useSnackbar } from 'notistack';

function CampaignDetail() {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? enUS;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [campaign, setCampaign] = useState<NotificationCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });

  const notificationStatusMap = {
    DRAFT: {
      text: t('notification.status.draft'),
      color: 'secondary' as const
    },
    SCHEDULED: {
      text: t('notification.status.scheduled'),
      color: 'info' as const
    },
    SENDING: {
      text: t('notification.status.sending'),
      color: 'warning' as const
    },
    SENT: { text: t('notification.status.sent'), color: 'success' as const },
    CANCELLED: {
      text: t('notification.status.cancelled'),
      color: 'error' as const
    },
    FAILED: { text: t('notification.status.failed'), color: 'error' as const },
    PARTIALLY_SENT: {
      text: t('notification.status.partially_sent'),
      color: 'warning' as const
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCampaign(null);

    const fetchCampaign = async () => {
      try {
        const result = await notificationService.getCampaignDetail(id!);
        if (!cancelled) {
          setCampaign(result);
        }
      } catch {
        if (!cancelled) {
          enqueueSnackbar(t('common.error'), { variant: 'error' });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCampaign();

    return () => {
      cancelled = true;
    };
  }, [id, enqueueSnackbar, t]);

  useEffect(() => {
    let cancelled = false;

    const fetchRecipients = async () => {
      if (!id) return;
      try {
        setRecipientsLoading(true);
        const res = await notificationService.getCampaignRecipients(id, {
          page: paginationModel.page,
          limit: paginationModel.pageSize
        });
        if (!cancelled) {
          setRecipients(res?.items || []);
          setRecipientsTotal(res?.total || 0);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) {
          setRecipientsLoading(false);
        }
      }
    };

    fetchRecipients();

    return () => {
      cancelled = true;
    };
  }, [id, paginationModel]);

  const handleCancel = async () => {
    try {
      await notificationService.cancelCampaign(id!);
      setCampaign((prev) =>
        prev ? { ...prev, status: CampaignStatus.CANCELLED } : prev
      );
      enqueueSnackbar(t('notification.campaign.cancelled'), {
        variant: 'success'
      });
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || t('common.error'), {
        variant: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) return null;

  const deliveryRate = campaign.totalRecipients
    ? Math.round((campaign.delivered / campaign.totalRecipients) * 100)
    : 0;
  const readRate = campaign.totalRecipients
    ? Math.round((campaign.read / campaign.totalRecipients) * 100)
    : 0;

  const analyticsCards = [
    {
      label: t('notification.analytics.total'),
      value: campaign.totalRecipients
    },
    {
      label: t('notification.analytics.delivered'),
      value: `${campaign.delivered} (${deliveryRate}%)`
    },
    {
      label: t('notification.analytics.read'),
      value: `${campaign.read} (${readRate}%)`
    },
    { label: t('notification.analytics.failed'), value: campaign.failed }
  ];

  const columns: GridColDef[] = [
    {
      field: 'user.name',
      headerName: t('common.name'),
      flex: 1,
      valueGetter: (_value: any, row: any) =>
        `${row.user?.name || ''} ${row.user?.surname || ''}`
    },
    {
      field: 'user.email',
      headerName: t('common.email'),
      flex: 1,
      valueGetter: (_value: any, row: any) => row.user?.email || '-'
    },
    {
      field: 'isDelivered',
      headerName: t('notification.analytics.delivered'),
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: any) => (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
        >
          {params.value ? (
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
          ) : (
            <CancelOutlinedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          )}
        </Box>
      )
    },
    {
      field: 'isRead',
      headerName: t('notification.analytics.read'),
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: any) => (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
        >
          {params.value ? (
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
          ) : (
            <CancelOutlinedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          )}
        </Box>
      )
    },
    {
      field: 'readAt',
      headerName: t('notification.inbox.readAt'),
      width: 170,
      align: 'center',
      renderCell: (params: any) =>
        params.value
          ? format(new Date(params.value), 'dd MMM yyyy HH:mm', {
              locale: dateFnsLocale
            })
          : '-'
    }
  ];

  return (
    <>
      <Helmet>
        <title>{campaign.title}</title>
      </Helmet>
      <PageTitleWrapper>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/management/notifications')}
            >
              {t('common.back')}
            </Button>
            <Typography variant="h3">{campaign.title}</Typography>
            <StatusLabel
              status={campaign.status}
              customMap={notificationStatusMap}
            />
          </Box>
          <Can I={Action.Update} a="Notification">
            {campaign.status === CampaignStatus.SCHEDULED && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                {t('notification.campaign.cancel')}
              </Button>
            )}
          </Can>
        </Box>
      </PageTitleWrapper>

      <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3}>
          {/* Analytics Cards */}
          {analyticsCards.map((card) => (
            <Grid item xs={6} md={3} key={card.label}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{card.value}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {card.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Content Preview */}
          <Grid
            item
            xs={12}
            md={6}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <NotificationPreview
              title={campaign.title}
              body={campaign.body}
              imageUrl={campaign.imageUrl || undefined}
              category={campaign.category}
            />
          </Grid>

          {/* Campaign Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title={t('notification.campaign.info')} />
              <Divider />
              <CardContent>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Typography>
                    <strong>{t('notification.campaign.category')}:</strong>{' '}
                    {t(
                      `notification.category.${campaign.category.toLowerCase()}`
                    )}
                  </Typography>
                  <Typography>
                    <strong>{t('notification.audience.type')}:</strong>{' '}
                    {t(
                      `notification.audience.${
                        !campaign.segmentFilter ||
                        Object.keys(campaign.segmentFilter).length === 0
                          ? 'all'
                          : campaign.segmentFilter.includeUserIds?.length &&
                              !campaign.segmentFilter.roles?.length
                            ? 'individual'
                            : 'segment'
                      }`
                    )}
                  </Typography>
                  {campaign.scheduledAt && (
                    <Typography>
                      <strong>{t('notification.schedule.scheduledAt')}:</strong>{' '}
                      {format(
                        new Date(campaign.scheduledAt),
                        'dd MMM yyyy HH:mm',
                        {
                          locale: dateFnsLocale
                        }
                      )}
                    </Typography>
                  )}
                  {campaign.sentAt && (
                    <Typography>
                      <strong>{t('notification.campaign.sentAt')}:</strong>{' '}
                      {format(new Date(campaign.sentAt), 'dd MMM yyyy HH:mm', {
                        locale: dateFnsLocale
                      })}
                    </Typography>
                  )}
                  {campaign.deepLink && (
                    <Typography>
                      <strong>Deep Link:</strong> {campaign.deepLink}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recipients DataGrid */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title={t('notification.campaign.recipients')} />
              <Divider />
              <CardContent>
                <DataGrid
                  rows={recipients}
                  columns={columns}
                  rowCount={recipientsTotal}
                  paginationMode="server"
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[10, 25, 50]}
                  loading={recipientsLoading}
                  disableRowSelectionOnClick
                  autoHeight
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default CampaignDetail;
