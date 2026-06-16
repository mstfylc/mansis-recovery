import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  Divider,
  Collapse,
  CircularProgress,
  Paper,
  Alert,
  Tabs,
  Tab,
  useTheme,
  Avatar,
  alpha
} from '@mui/material';
import {
  Add,
  ContentCopy,
  Delete,
  Download,
  Refresh,
  QrCode2
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/data/apiService';
import {
  PROMO_CODES,
  PROMO_CODES_BULK_DELETE,
  PROMO_CODE_UPDATE
} from '@/data/endpoints';
import {
  PromoCode,
  PromoCodeStats,
  PromoCodesDialogProps,
  CreatePromoCodeFormData,
  BulkCreatePromoCodesFormData
} from '@/types/Voucher.interface';
import { getRewardTypeLabel, getRewardTypeColor } from '@/utils/voucherHelpers';
import NoDataFound from '@/components/NoDataFound';
import NumericInput from '@/components/NumericInput';

const PromoCodesDialog: React.FC<PromoCodesDialogProps> = ({
  open,
  onClose,
  template
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const [createTab, setCreateTab] = useState(0);

  // Promo codes list
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Stats
  const [stats, setStats] = useState<PromoCodeStats | null>(null);

  // Create single form
  const [singleForm, setSingleForm] = useState<CreatePromoCodeFormData>({
    code: '',
    maxRedemptions: 1,
    maxPerUser: 1
  });

  // Bulk create form
  const [bulkForm, setBulkForm] = useState<BulkCreatePromoCodesFormData>({
    count: 10,
    prefix: '',
    maxRedemptions: 1,
    maxPerUser: 1,
    batchLabel: ''
  });

  // UI state
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [expandedCode, setExpandedCode] = useState<number | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);

  const basePath = `${PROMO_CODES}/${template.branchId}/${template.id}/promo-codes`;

  // Fetch promo codes
  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const response = await apiClient.get<{
        items: PromoCode[];
        total: number;
      }>(basePath, params);

      setPromoCodes(response.data.items || []);
      setTotalCount(response.data.total || 0);
    } catch {
      setError(t('promoCode.error.fetch'));
    } finally {
      setLoading(false);
    }
  }, [basePath, page, limit, searchQuery, statusFilter, t]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<PromoCodeStats>(`${basePath}/stats`);
      setStats(response.data);
    } catch {
      // Silent fail for stats
    }
  }, [basePath]);

  useEffect(() => {
    if (open) {
      fetchPromoCodes();
      fetchStats();
    }
  }, [open, fetchPromoCodes, fetchStats]);

  // Create single promo code
  const handleCreateSingle = async () => {
    try {
      setCreating(true);
      setError(null);
      await apiClient.post(basePath, {
        code: singleForm.code || undefined,
        maxRedemptions: singleForm.maxRedemptions,
        maxPerUser: singleForm.maxPerUser
      });
      setSuccessMessage(t('promoCode.create.success'));
      setSingleForm({ code: '', maxRedemptions: 1, maxPerUser: 1 });
      fetchPromoCodes();
      fetchStats();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('promoCode.error.create'));
    } finally {
      setCreating(false);
    }
  };

  // Bulk create promo codes
  const handleBulkCreate = async () => {
    try {
      setCreating(true);
      setError(null);
      const response = await apiClient.post<{
        codes: string[];
        promoCodes: any[];
      }>(`${basePath}/bulk`, {
        count: bulkForm.count,
        prefix: bulkForm.prefix || undefined,
        maxRedemptions: bulkForm.maxRedemptions,
        maxPerUser: bulkForm.maxPerUser,
        batchLabel: bulkForm.batchLabel || undefined
      });
      const data = response.data as any;
      setGeneratedCodes(data.codes || []);
      setSuccessMessage(
        t('promoCode.bulk.success', {
          count: data.codes?.length || bulkForm.count
        })
      );
      fetchPromoCodes();
      fetchStats();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('promoCode.error.create'));
    } finally {
      setCreating(false);
    }
  };

  // Toggle promo code active/inactive
  const handleToggleActive = async (promoCodeId: number, isActive: boolean) => {
    try {
      await apiClient.patch(`${PROMO_CODE_UPDATE}/${promoCodeId}`, {
        isActive: !isActive
      });
      fetchPromoCodes();
      fetchStats();
    } catch {
      setError(t('promoCode.error.update'));
    }
  };

  // Delete promo code
  const handleDelete = async (promoCodeId: number) => {
    try {
      await apiClient.delete(`${PROMO_CODE_UPDATE}/${promoCodeId}`);
      setSuccessMessage(t('promoCode.delete.success'));
      fetchPromoCodes();
      fetchStats();
    } catch {
      setError(t('promoCode.error.delete'));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedCodes.length === 0) return;
    try {
      await apiClient.post(PROMO_CODES_BULK_DELETE, {
        promoCodeIds: selectedCodes
      });
      setSuccessMessage(
        t('promoCode.bulk.delete.success', { count: selectedCodes.length })
      );
      setSelectedCodes([]);
      fetchPromoCodes();
      fetchStats();
    } catch {
      setError(t('promoCode.error.delete'));
    }
  };

  // Copy codes
  const handleCopyAllCodes = () => {
    const codes = promoCodes.map((pc) => pc.code).join('\n');
    navigator.clipboard.writeText(codes);
    setSuccessMessage(t('promoCode.copied'));
  };

  const handleCopyGeneratedCodes = () => {
    if (generatedCodes) {
      navigator.clipboard.writeText(generatedCodes.join('\n'));
      setSuccessMessage(t('promoCode.copied'));
    }
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const csvContent =
      'Kod,Maks Kullanım,Kullanılan,Kalan,Durum,Grup Etiketi\n' +
      promoCodes
        .map(
          (pc) =>
            `${pc.code},${pc.maxRedemptions},${pc.currentRedemptions},${pc.remainingRedemptions},${pc.isActive ? 'Aktif' : 'Pasif'},${pc.batchLabel || ''}`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `promo-codes-${template.name}.csv`;
    link.click();
  };

  const getStatusChip = (pc: PromoCode) => {
    if (!pc.isActive) {
      return <Chip label={t('status.passive')} color="default" size="small" />;
    }
    if (pc.isExhausted) {
      return (
        <Chip label={t('promoCode.exhausted')} color="warning" size="small" />
      );
    }
    return <Chip label={t('status.active')} color="success" size="small" />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <QrCode2 color="primary" />
          <Box>
            <Typography variant="h5">{t('promoCode.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {template.name} —{' '}
              <Chip
                label={getRewardTypeLabel(template.rewardType, t)}
                size="small"
                sx={{ height: 20, ...getRewardTypeColor(template.rewardType) }}
              />
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Stats Bar */}
        {stats && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.action.hover
            }}
          >
            <Box textAlign="center" flex={1}>
              <Typography variant="h4">{stats.totalCodes}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('promoCode.stats.total')}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box textAlign="center" flex={1}>
              <Typography variant="h4" color="success.main">
                {stats.activeCodes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('promoCode.stats.active')}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box textAlign="center" flex={1}>
              <Typography variant="h4" color="warning.main">
                {stats.exhaustedCodes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('promoCode.stats.exhausted')}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box textAlign="center" flex={1}>
              <Typography variant="h4" color="info.main">
                {stats.totalRedemptions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('promoCode.stats.redemptions')}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box textAlign="center" flex={1}>
              <Typography variant="h4" color="secondary.main">
                {stats.uniqueUsers}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('promoCode.stats.uniqueUsers')}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 2 }}
        >
          <Tab label={t('promoCode.tab.codes')} />
          <Tab label={t('promoCode.tab.create')} />
        </Tabs>

        {/* Tab 0: Code List */}
        {activeTab === 0 && (
          <Box>
            {/* Toolbar */}
            <Box
              display="flex"
              gap={1}
              mb={2}
              alignItems="center"
              flexWrap="wrap"
            >
              <TextField
                size="small"
                placeholder={t('promoCode.search')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 200 }}
              />
              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                SelectProps={{ native: true }}
                sx={{ minWidth: 140 }}
              >
                <option value="">{t('promoCode.filter.all')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="exhausted">{t('promoCode.exhausted')}</option>
                <option value="inactive">{t('status.passive')}</option>
              </TextField>
              <Box flex={1} />
              {selectedCodes.length > 0 && (
                <Button
                  color="error"
                  variant="outlined"
                  size="small"
                  startIcon={<Delete />}
                  onClick={handleBulkDelete}
                >
                  {t('promoCode.bulk.delete', {
                    count: selectedCodes.length
                  })}
                </Button>
              )}
              <Tooltip title={t('promoCode.copyAll')}>
                <IconButton size="small" onClick={handleCopyAllCodes}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('promoCode.downloadCsv')}>
                <IconButton size="small" onClick={handleDownloadCsv}>
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('refresh')}>
                <IconButton
                  size="small"
                  onClick={() => {
                    fetchPromoCodes();
                    fetchStats();
                  }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={
                          selectedCodes.length === promoCodes.length &&
                          promoCodes.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCodes(promoCodes.map((pc) => pc.id));
                          } else {
                            setSelectedCodes([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{t('promoCode.code')}</TableCell>
                    <TableCell align="center">{t('promoCode.type')}</TableCell>
                    <TableCell align="center">{t('usage')}</TableCell>
                    <TableCell align="center">
                      {t('promoCode.perUser')}
                    </TableCell>
                    <TableCell align="center">{t('status.label')}</TableCell>
                    <TableCell align="center">{t('promoCode.batch')}</TableCell>
                    <TableCell align="center">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : promoCodes.length > 0 ? (
                    promoCodes.map((pc) => (
                      <React.Fragment key={pc.id}>
                        <TableRow
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() =>
                            setExpandedCode(
                              expandedCode === pc.id ? null : pc.id
                            )
                          }
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCodes.includes(pc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCodes([...selectedCodes, pc.id]);
                                } else {
                                  setSelectedCodes(
                                    selectedCodes.filter((id) => id !== pc.id)
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                fontFamily="monospace"
                              >
                                {pc.code}
                              </Typography>
                              <Tooltip title={t('copy')}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(pc.code);
                                  }}
                                >
                                  <ContentCopy sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                pc.maxRedemptions === 1
                                  ? t('promoCode.singleUse')
                                  : t('promoCode.multiUse')
                              }
                              size="small"
                              variant="outlined"
                              color={
                                pc.maxRedemptions === 1 ? 'default' : 'primary'
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {pc.currentRedemptions}/{pc.maxRedemptions}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {pc.maxPerUser}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {getStatusChip(pc)}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {pc.batchLabel || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tooltip
                              title={
                                pc.isActive
                                  ? t('promoCode.deactivate')
                                  : t('promoCode.activate')
                              }
                            >
                              <Switch
                                size="small"
                                checked={pc.isActive}
                                onChange={() =>
                                  handleToggleActive(pc.id, pc.isActive)
                                }
                              />
                            </Tooltip>
                            <Tooltip title={t('delete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(pc.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {/* Expanded: Redemption details */}
                        {expandedCode === pc.id && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              sx={{ p: 0, borderBottom: 'none' }}
                            >
                              <Collapse in={expandedCode === pc.id}>
                                <Box
                                  sx={{
                                    m: 1.5,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.04
                                    ),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{ mb: 1.5, color: 'primary.main' }}
                                  >
                                    {t('promoCode.redemptionDetails')} (
                                    {pc.redemptions.length})
                                  </Typography>
                                  {pc.redemptions.length > 0 ? (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                      }}
                                    >
                                      {pc.redemptions.map((r) => (
                                        <Box
                                          key={r.id}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1.5,
                                            borderRadius: 1.5,
                                            bgcolor: 'background.paper',
                                            border: `1px solid ${theme.palette.divider}`,
                                            transition: 'box-shadow 0.2s',
                                            '&:hover': {
                                              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                                            }
                                          }}
                                        >
                                          <Avatar
                                            sx={{
                                              width: 36,
                                              height: 36,
                                              bgcolor: alpha(
                                                theme.palette.success.main,
                                                0.12
                                              ),
                                              color: 'success.main',
                                              fontSize: 14,
                                              fontWeight: 700
                                            }}
                                          >
                                            {r.userName
                                              ?.charAt(0)
                                              ?.toUpperCase() || '?'}
                                          </Avatar>
                                          <Box flex={1} minWidth={0}>
                                            <Typography
                                              variant="body2"
                                              fontWeight={600}
                                              noWrap
                                            >
                                              {r.userName}
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              noWrap
                                            >
                                              {r.userEmail}
                                              {r.userPhone
                                                ? ` • ${r.userPhone}`
                                                : ''}
                                            </Typography>
                                          </Box>
                                          <Chip
                                            label={new Date(
                                              r.redeemedAt
                                            ).toLocaleString('tr-TR')}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                              fontSize: 11,
                                              fontWeight: 500
                                            }}
                                          />
                                        </Box>
                                      ))}
                                    </Box>
                                  ) : (
                                    <Box
                                      sx={{
                                        textAlign: 'center',
                                        py: 2,
                                        color: 'text.secondary'
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {t('promoCode.noRedemptions')}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <NoDataFound message={t('promoCode.noData')} colSpan={8} />
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={limit}
              onRowsPerPageChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </Box>
        )}

        {/* Tab 1: Create Codes */}
        {activeTab === 1 && (
          <Box>
            {/* Generated codes display */}
            {generatedCodes && (
              <Alert
                severity="success"
                sx={{ mb: 3 }}
                action={
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      startIcon={<ContentCopy />}
                      onClick={handleCopyGeneratedCodes}
                    >
                      {t('copy')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setGeneratedCodes(null)}
                    >
                      {t('close')}
                    </Button>
                  </Box>
                }
              >
                <Typography variant="subtitle2" gutterBottom>
                  {t('promoCode.generated', {
                    count: generatedCodes.length
                  })}
                </Typography>
                <Box
                  sx={{
                    maxHeight: 150,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: 12
                  }}
                >
                  {generatedCodes.map((code, i) => (
                    <div key={i}>{code}</div>
                  ))}
                </Box>
              </Alert>
            )}

            {/* Sub-tabs: Single / Bulk */}
            <Box
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                mb: 3
              }}
            >
              <Tabs
                value={createTab}
                onChange={(_, v) => setCreateTab(v)}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: 14
                  }
                }}
              >
                <Tab label={t('promoCode.createSingle')} />
                <Tab label={t('promoCode.createBulk')} />
              </Tabs>
            </Box>

            {/* Single Code Creation */}
            {createTab === 0 && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.background.default, 0.5)
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('promoCode.customCode')}
                      placeholder="YAZ2026"
                      value={singleForm.code}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          code: e.target.value.toUpperCase()
                        })
                      }
                      helperText={t('promoCode.customCode.helper')}
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <NumericInput
                      fullWidth
                      size="small"
                      label={t('promoCode.maxRedemptions')}
                      value={singleForm.maxRedemptions}
                      onChange={(val) =>
                        setSingleForm({
                          ...singleForm,
                          maxRedemptions: val || 1
                        })
                      }
                      min={1}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <NumericInput
                      fullWidth
                      size="small"
                      label={t('promoCode.maxPerUser')}
                      value={singleForm.maxPerUser}
                      onChange={(val) =>
                        setSingleForm({
                          ...singleForm,
                          maxPerUser: val || 1
                        })
                      }
                      min={1}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleCreateSingle}
                      disabled={creating}
                      startIcon={
                        creating ? <CircularProgress size={16} /> : <Add />
                      }
                    >
                      {t('create')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Bulk Code Creation */}
            {createTab === 1 && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.background.default, 0.5)
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <NumericInput
                      fullWidth
                      size="small"
                      label={t('promoCode.count')}
                      value={bulkForm.count}
                      onChange={(val) =>
                        setBulkForm({ ...bulkForm, count: val || 1 })
                      }
                      min={1}
                      max={1000}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('promoCode.prefix')}
                      placeholder="YAZ2026"
                      value={bulkForm.prefix}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          prefix: e.target.value.toUpperCase()
                        })
                      }
                      helperText={t('promoCode.prefix.helper')}
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <NumericInput
                      fullWidth
                      size="small"
                      label={t('promoCode.maxRedemptions')}
                      value={bulkForm.maxRedemptions}
                      onChange={(val) =>
                        setBulkForm({
                          ...bulkForm,
                          maxRedemptions: val || 1
                        })
                      }
                      min={1}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <NumericInput
                      fullWidth
                      size="small"
                      label={t('promoCode.maxPerUser')}
                      value={bulkForm.maxPerUser}
                      onChange={(val) =>
                        setBulkForm({
                          ...bulkForm,
                          maxPerUser: val || 1
                        })
                      }
                      min={1}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('promoCode.batchLabel')}
                      placeholder={t('promoCode.batchLabel.placeholder')}
                      value={bulkForm.batchLabel}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          batchLabel: e.target.value
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      onClick={handleBulkCreate}
                      disabled={creating}
                      startIcon={
                        creating ? <CircularProgress size={16} /> : <Add />
                      }
                    >
                      {t('promoCode.generateCodes', { count: bulkForm.count })}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromoCodesDialog;
