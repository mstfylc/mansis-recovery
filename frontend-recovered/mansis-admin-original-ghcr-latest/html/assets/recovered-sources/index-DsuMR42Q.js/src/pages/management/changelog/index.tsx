import { useEffect, useState, useCallback } from 'react';
import { Grid, Snackbar, Alert as MuiAlert, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/Changelog/PageHeader';
import ChangelogTable from '@/content/Management/Changelog/ChangelogTable';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import {
  fetchAllChangelog,
  createChangelogRelease,
  updateChangelogRelease,
  deleteChangelogRelease,
  bulkDeleteChangelogReleases,
  type CreateChangelogReleaseDto,
  type UpdateChangelogReleaseDto
} from '@/data/changelogService';
import type { ChangelogRelease } from '@/types/ChangelogRelease.interface';
import ChangelogDialog from './ChangelogDialog';

export default function ChangelogManagement() {
  const { t } = useTranslation();
  const [releases, setReleases] = useState<ChangelogRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] =
    useState<ChangelogRelease | null>(null);
  const [dialogError, setDialogError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchReleases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllChangelog();
      setReleases(data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setErrorMessage(msg || t('error.occurred'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleShowNewDialog = (show: boolean) => {
    if (show) {
      setSelectedRelease(null);
      setDialogError('');
    }
    setDialogOpen(show);
  };

  const handleEdit = (release: ChangelogRelease) => {
    setSelectedRelease(release);
    setDialogError('');
    setDialogOpen(true);
  };

  const handleSave = async (
    dto: CreateChangelogReleaseDto | UpdateChangelogReleaseDto
  ) => {
    try {
      if (selectedRelease) {
        await updateChangelogRelease(
          selectedRelease.id,
          dto as UpdateChangelogReleaseDto
        );
        setSuccessMessage(t('changelog.update.success'));
      } else {
        await createChangelogRelease(dto as CreateChangelogReleaseDto);
        setSuccessMessage(t('changelog.create.success'));
      }
      await fetchReleases();
      setDialogOpen(false);
      setDialogError('');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setDialogError(msg || t('error.occurred'));
      throw err;
    }
  };

  const handleDeleteConfirm = (id: number) => {
    setDeleteId(id);
  };

  const handleDeleteCancel = () => {
    setDeleteId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;

    const idToDelete = deleteId;
    setDeleteId(null);

    try {
      await deleteChangelogRelease(idToDelete);
      setSuccessMessage(t('changelog.delete.success'));
      await fetchReleases();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setErrorMessage(msg || t('error.occurred'));
    }
  };

  const handleBulkDelete = async (
    selected: ChangelogRelease[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await bulkDeleteChangelogReleases(selected.map((r) => r.id));
      setSuccessMessage(
        selected.length > 1
          ? t('changelog.bulk.delete.success.message')
          : t('changelog.delete.success')
      );
      onSuccess?.();
      await fetchReleases();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setErrorMessage(msg || t('error.occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('changelog.management.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ChangelogTable
            releases={releases}
            loading={loading}
            setShowNewDialog={handleShowNewDialog}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            onBulkDelete={handleBulkDelete}
            onRefresh={fetchReleases}
          />
        </Grid>
      </Grid>

      <ChangelogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        release={selectedRelease}
        error={dialogError}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('changelog.delete.title')}
        message={t('changelog.delete.message')}
      />

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
        >
          <Typography>{successMessage}</Typography>
        </MuiAlert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
        >
          <Typography>{errorMessage}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
}
