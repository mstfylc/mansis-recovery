import { useState, useEffect, useCallback, useContext } from 'react';
import {
  Typography,
  Grid,
  Snackbar,
  Alert as MuiAlert,
  Container,
  Button,
  Paper,
  CircularProgress,
  Box
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useTranslation } from 'react-i18next';
import { stampCardService } from '@/data/stampCardService';
import { branchService } from '@/data/branchService';
import {
  StampCard,
  CreateStampCardDto,
  UpdateStampCardDto
} from '@/types/StampCard.interface';
import { Branch } from '@/types/Branch.interface';
import { user$ } from '@/store/userStore';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import PageHeader from '@/content/Management/StampCards/PageHeader';
import StampCardSettingsForm from '@/content/Management/StampCards/StampCardSettingsForm';
import StampCardBranchProducts from '@/content/Management/StampCards/StampCardBranchProducts';
import StampCardStats from '@/content/Management/StampCards/StampCardStats';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { CardGiftcardTwoTone } from '@mui/icons-material';

const StampCardsManagement = () => {
  const { t } = useTranslation();
  const ability = useContext(AbilityContext);
  const { isSuperAdmin, isCompanyAdmin, isBranchAdmin, currentBranch } =
    useUserViewMode();
  const companyId = user$.company.get()?.id;

  const [stampCard, setStampCard] = useState<StampCard | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Şirket admini veya süper admin: kampanya ayarlarını düzenleyebilir
  const canManageCampaign =
    ability.can(Action.Manage, 'StampCard') && (isSuperAdmin || isCompanyAdmin);

  // Şube admini: sadece kendi şubesinin ürünlerini yönetebilir
  const canManageProducts =
    canManageCampaign ||
    (isBranchAdmin && ability.can(Action.Update, 'StampCard'));

  const fetchStampCard = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const result = await stampCardService.getByCompany(companyId);

      if (result.status === 200 && result.stampCard) {
        setStampCard(result.stampCard);
        setShowCreateForm(false);
      } else {
        setStampCard(null);
      }
    } catch {
      setStampCard(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchBranches = useCallback(async () => {
    if (!companyId) return;
    // Şube admini kendi şubesini zaten biliyor, şubeleri çekmeye gerek yok
    if (isBranchAdmin) return;

    try {
      const result = await branchService.getAllFlat({
        companyId,
        status: 'ACTIVE',
        getAll: true
      });
      setBranches(result || []);
    } catch {
      console.error('Error fetching branches');
    }
  }, [companyId, isBranchAdmin]);

  useEffect(() => {
    fetchStampCard();
    fetchBranches();
  }, [fetchStampCard, fetchBranches]);

  const handleCreate = async (
    data: CreateStampCardDto | UpdateStampCardDto
  ) => {
    if (!companyId) return;
    try {
      await stampCardService.create(companyId, data);
      setSuccessMessage(t('stampCard.create.success'));
      setShowSuccess(true);
      fetchStampCard();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('stampCard.error.save'));
      throw err;
    }
  };

  const handleUpdate = async (
    data: CreateStampCardDto | UpdateStampCardDto
  ) => {
    if (!companyId || !stampCard) return;
    try {
      await stampCardService.update(companyId, stampCard.id, data);
      setSuccessMessage(t('stampCard.update.success'));
      setShowSuccess(true);
      fetchStampCard();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('stampCard.error.save'));
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!companyId || !stampCard) return;
    try {
      await stampCardService.delete(companyId, stampCard.id);
      setSuccessMessage(t('stampCard.delete.success'));
      setShowSuccess(true);
      setStampCard(null);
      setDeleteConfirmOpen(false);
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('stampCard.error.delete'));
    }
  };

  const handleProductSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  const handleProductError = (message: string) => {
    setError(message);
  };

  // ============================================================
  // ŞUBE ADMİNİ GÖRÜNÜMÜ
  // Yalnızca kendi şubesinin ürünlerini yönetir.
  // Kampanya ayarlarını ve istatistikleri görmez.
  // ============================================================
  if (isBranchAdmin) {
    if (loading) {
      return (
        <>
          <Helmet>
            <title>{t('stampCard.title')}</title>
          </Helmet>
          <PageTitleWrapper>
            <PageHeader />
          </PageTitleWrapper>
          <Container
            disableGutters
            maxWidth={false}
            sx={{ maxWidth: '90%', textAlign: 'center', mt: 4 }}
          >
            <CircularProgress />
          </Container>
        </>
      );
    }

    // Damga kartı yok veya aktif değil
    if (!stampCard || !stampCard.isActive) {
      return (
        <>
          <Helmet>
            <title>{t('stampCard.title')}</title>
          </Helmet>
          <PageTitleWrapper>
            <PageHeader />
          </PageTitleWrapper>
          <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CardGiftcardTwoTone
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h5" color="text.secondary">
                {t('stampCard.branch.noCampaign')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('stampCard.branch.noCampaign.description')}
              </Typography>
            </Paper>
          </Container>
        </>
      );
    }

    // Şubenin kendi ürün yönetimi
    const branchId = currentBranch?.id;
    const branchName = currentBranch?.name;

    if (!branchId) {
      return (
        <>
          <Helmet>
            <title>{t('stampCard.title')}</title>
          </Helmet>
          <PageTitleWrapper>
            <PageHeader />
          </PageTitleWrapper>
          <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {t('branch.not.selected')}
              </Typography>
            </Paper>
          </Container>
        </>
      );
    }

    return (
      <>
        <Helmet>
          <title>{t('stampCard.title')}</title>
        </Helmet>
        <PageTitleWrapper>
          <PageHeader />
        </PageTitleWrapper>

        <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
          <Grid container spacing={3}>
            {/* Kampanya bilgisi özeti */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <CardGiftcardTwoTone color="primary" />
                  <Typography variant="h6">{stampCard.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    — {stampCard.requiredStamps} {t('stampCard.stamps.short')}
                  </Typography>
                </Box>
                {stampCard.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {stampCard.description}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Şubenin ürün yönetimi — şube seçici olmadan direkt kendi şubesi */}
            <Grid item xs={12}>
              <StampCardBranchProducts
                stampCard={stampCard}
                branches={[{ id: branchId, name: branchName || '' } as Branch]}
                fixedBranchId={branchId}
                canManage={canManageProducts}
                onSuccess={handleProductSuccess}
                onError={handleProductError}
              />
            </Grid>
          </Grid>
        </Container>

        {/* Snackbar'lar */}
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
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={() => setError(undefined)}
        >
          <MuiAlert
            variant="filled"
            severity="error"
            onClose={() => setError(undefined)}
          >
            <Typography>{error}</Typography>
          </MuiAlert>
        </Snackbar>
      </>
    );
  }

  // ============================================================
  // ŞİRKET ADMİNİ / SÜPER ADMİN GÖRÜNÜMÜ
  // Kampanya ayarları + istatistikler + tüm şubelerin ürünleri
  // ============================================================
  return (
    <>
      <Helmet>
        <title>{t('stampCard.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3}>
          {/* Yükleniyor */}
          {loading && (
            <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Grid>
          )}

          {/* Kampanya Yok - Boş Durum */}
          {!loading && !stampCard && !showCreateForm && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <CardGiftcardTwoTone
                  sx={{ fontSize: 64, color: 'text.disabled' }}
                />
                <Typography variant="h5" color="text.secondary">
                  {t('stampCard.noData')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 400 }}
                >
                  {t('stampCard.noData.description')}
                </Typography>
                {canManageCampaign && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CardGiftcardTwoTone />}
                    onClick={() => setShowCreateForm(true)}
                    sx={{ mt: 2 }}
                  >
                    {t('stampCard.create')}
                  </Button>
                )}
              </Paper>
            </Grid>
          )}

          {/* Oluşturma Formu */}
          {!loading && !stampCard && showCreateForm && (
            <Grid item xs={12}>
              <StampCardSettingsForm
                stampCard={null}
                loading={false}
                onSubmit={handleCreate}
                canManage={canManageCampaign}
              />
            </Grid>
          )}

          {/* Mevcut Kampanya */}
          {!loading && stampCard && (
            <>
              {/* Kampanya Ayarları */}
              <Grid item xs={12}>
                <StampCardSettingsForm
                  stampCard={stampCard}
                  loading={loading}
                  onSubmit={handleUpdate}
                  onDelete={() => setDeleteConfirmOpen(true)}
                  canManage={canManageCampaign}
                />
              </Grid>

              {/* İstatistikler */}
              <Grid item xs={12}>
                <StampCardStats stampCard={stampCard} />
              </Grid>

              {/* Şube Ürün Yönetimi */}
              <Grid item xs={12}>
                <StampCardBranchProducts
                  stampCard={stampCard}
                  branches={branches}
                  canManage={canManageCampaign}
                  onSuccess={handleProductSuccess}
                  onError={handleProductError}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Container>

      {/* Silme Onayı */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={t('confirm.delete')}
        message={t('stampCard.delete.confirm', { name: stampCard?.name })}
      />

      {/* Başarı Snackbar */}
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

      {/* Hata Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(undefined)}
      >
        <MuiAlert
          variant="filled"
          severity="error"
          onClose={() => setError(undefined)}
        >
          <Typography>{error}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default StampCardsManagement;
