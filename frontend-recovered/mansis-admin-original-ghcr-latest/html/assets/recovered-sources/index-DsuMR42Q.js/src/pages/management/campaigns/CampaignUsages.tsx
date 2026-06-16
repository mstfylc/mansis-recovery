import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Container,
  CircularProgress,
  Grid,
  Card,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  FormControl,
  OutlinedInput,
  InputAdornment,
  CardHeader
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { campaignService } from '@/data/campaignService';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { PurchaseType } from '@/enums/purchase-type';
import { PaymentStatus } from '@/enums/payment-status';
import { CampaignUserUsage } from '@/types/CampaignUserUsage.interface';
import CampaignUsagesHeader from './CampaignUsagesHeader';
import { SearchOutlined, MoneyOff } from '@mui/icons-material';
import { debounce } from '@/utils/helpers';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import { useTheme } from '@mui/material';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

interface UsageFilters {
  search?: string;
  page: number;
  limit: number;
}

const CampaignUsages = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usages, setUsages] = useState<CampaignUserUsage[]>([]);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const [refundUsageId, setRefundUsageId] = useState<number | null>(null);
  const [filters, setFilters] = useState<UsageFilters>({
    search: '',
    page: 0,
    limit: 10
  });

  const fetchUsages = async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      const result = await campaignService.getCampaignUsages(
        Number(campaignId),
        {
          page: filters.page,
          limit: filters.limit,
          ...(filters.search && { search: filters.search })
        }
      );

      setUsages(result?.items || []);
      setTotal(result?.total || 0);
    } catch (err) {
      console.error('Error fetching campaign usages:', err);
      setError(t('error.loading.campaign.usages'));
      setOpenNotification(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsages();
  }, [filters]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(0);
    setFilters((prev) => ({
      ...prev,
      page: 0,
      limit: newLimit
    }));
  };

  const handleCloseNotification = () => {
    setOpenNotification(false);
  };

  const handleSearch = debounce((value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 0
    }));
    setPage(0);
  }, 500);

  const handleRefundClick = (usageId: number) => {
    setRefundUsageId(usageId);
  };

  const handleRefundCancel = () => {
    setRefundUsageId(null);
  };

  const handleRefundConfirm = async () => {
    if (!refundUsageId) return;

    try {
      await campaignService.refundCampaignPackage(refundUsageId);
      setRefundUsageId(null);
      fetchUsages();
    } catch (err: any) {
      console.error('Error refunding campaign package:', err);
      setError(
        err?.response?.data?.message || t('error.refund.campaign.package')
      );
      setOpenNotification(true);
    }
  };

  const getPurchaseTypeLabel = (type: PurchaseType) => {
    switch (type) {
      case PurchaseType.CASH:
        return t('purchase.type.cash');
      case PurchaseType.WALLET:
        return t('purchase.type.wallet');
      case PurchaseType.CAMPAIGN:
        return t('purchase.type.campaign');
      case PurchaseType.CARD:
        return t('purchase.type.card');
      case PurchaseType.DIRECT:
        return t('purchase.type.direct');
      case PurchaseType.MEMBERSHIP:
        return t('purchase.type.membership');
      case PurchaseType.PHYSICAL_CARD:
        return t('purchase.type.physical.card');
      case PurchaseType.LOYALTY_POINTS:
        return t('purchase.type.loyalty.points');
      case PurchaseType.LOYALTY_POINTS_HYBRID:
        return t('purchase.type.loyalty.points.hybrid');
      default:
        return type;
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.FAILED:
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && !usages.length) {
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

  return (
    <>
      <Helmet>
        <title>{t('campaign.usages.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <CampaignUsagesHeader />
      </PageTitleWrapper>

      <Container maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                action={
                  <Box display="flex" alignItems="center" width="100%">
                    <FormControl sx={{ minWidth: 200, mr: 2 }}>
                      <OutlinedInput
                        placeholder={`${t('search')}...`}
                        onChange={(e) => handleSearch(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        }
                        size="small"
                      />
                    </FormControl>
                  </Box>
                }
                title={
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="span">
                      {t('campaign.usages')}
                    </Typography>
                    <Tooltip arrow title={t('refresh.list')}>
                      <IconButton
                        onClick={fetchUsages}
                        sx={{
                          ml: 1,
                          '&:hover': {
                            background: theme.colors.primary.lighter
                          },
                          color: theme.palette.primary.main
                        }}
                      >
                        <RefreshTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <Divider />

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('customer')}</TableCell>
                      <TableCell align="center">
                        {t('usage.remain.total')}
                      </TableCell>
                      <TableCell>{t('purchase.type')}</TableCell>
                      <TableCell>{t('branch')}</TableCell>
                      <TableCell>{t('payment.status')}</TableCell>
                      <TableCell>{t('date')}</TableCell>
                      <TableCell align="center">{t('actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Box p={2} display="flex" justifyContent="center">
                            <CircularProgress />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : usages.length > 0 ? (
                      usages.map((usage) => (
                        <TableRow
                          key={usage.id}
                          hover
                          sx={{
                            cursor: usage.user ? 'pointer' : 'default',
                            '&:hover': {
                              backgroundColor: theme.colors.alpha.black[5]
                            }
                          }}
                        >
                          <TableCell>
                            {usage.user ? (
                              <Box display="flex" alignItems="center">
                                <Typography variant="body2">
                                  {usage.user.name} {usage.user.surname}
                                </Typography>
                              </Box>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {usage.remain}/
                              {
                                usage.campaign?.campaignBundle?.bundle
                                  ?.totalCount
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {usage.purchaseType &&
                              getPurchaseTypeLabel(usage.purchaseType)}
                          </TableCell>
                          <TableCell>{usage.branch?.name || '-'}</TableCell>
                          <TableCell>
                            {usage.paymentAttempt ? (
                              <Chip
                                size="small"
                                label={usage.paymentAttempt.status}
                                color={
                                  getPaymentStatusColor(
                                    usage.paymentAttempt.status
                                  ) as any
                                }
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDateToDayMonthYearTime(usage.createdAt)}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={t('refund')} arrow>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRefundClick(usage.id);
                                }}
                                sx={{
                                  '&:hover': {
                                    background: theme.colors.warning.lighter
                                  },
                                  color: theme.palette.warning.main
                                }}
                                color="inherit"
                                size="small"
                                disabled={usage.remain === 0}
                              >
                                <MoneyOff fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box p={2}>
                            <Typography
                              variant="h6"
                              color="text.secondary"
                              align="center"
                            >
                              {t('no.campaign.usages')}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box p={2}>
                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={limit}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={openNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          variant="filled"
          severity="error"
          onClose={handleCloseNotification}
        >
          <Typography>{error}</Typography>
        </Alert>
      </Snackbar>
      <ConfirmDialog
        open={Boolean(refundUsageId)}
        onClose={handleRefundCancel}
        onConfirm={handleRefundConfirm}
        title={t('confirm.refund')}
        message={t('confirm.refund.question')}
        confirmButtonText={t('refund')}
        confirmButtonColor="warning"
      />
    </>
  );
};

export default CampaignUsages;
