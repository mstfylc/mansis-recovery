import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useState, useCallback } from 'react';
import { voucherService } from '@/data/voucherService';
import {
  VoucherTemplate,
  CreateVoucherTemplateDto,
  UpdateVoucherTemplateDto
} from '@/types/Voucher.interface';
import { Filters } from '@/types/Filters';
import PageHeader from '@/content/Management/Vouchers/PageHeader';
import VoucherTemplatesTable from '@/content/Management/Vouchers/VoucherTemplatesTable';
import VoucherTemplateDialog from '@/content/Management/Vouchers/VoucherTemplateDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const VoucherTemplatesManagement = () => {
  const { t } = useTranslation();

  const [templates, setTemplates] = useState<VoucherTemplate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTemplate, setDeleteTemplate] = useState<VoucherTemplate | null>(
    null
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<VoucherTemplate | null>(null);

  const [lastFilters, setLastFilters] = useState<Filters | undefined>();

  const fetchTemplates = useCallback(
    async (filters?: Filters) => {
      try {
        setLoading(true);
        const params = transformFiltersToApiParams(filters || {});

        const result = await voucherService.getAll(params);

        setTemplates(result.items || []);
        setTotalCount(result.total || 0);
      } catch {
        setError(t('voucher.templates.error.fetch'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const handleOpenAddDialog = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (template: VoucherTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleCreateTemplate = async (
    branchId: number,
    dto: CreateVoucherTemplateDto
  ) => {
    try {
      setLoading(true);
      await voucherService.create(branchId, dto);
      setSuccessMessage(t('voucher.templates.add.success'));
      setShowSuccess(true);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error creating voucher template:', err);
      setError(
        err?.response?.data?.message || t('voucher.templates.error.save')
      );
      throw err;
    } finally {
      setLoading(false);
    }
    fetchTemplates(lastFilters);
  };

  const handleUpdateTemplate = async (
    branchId: number,
    templateId: number,
    dto: UpdateVoucherTemplateDto
  ) => {
    try {
      setLoading(true);
      await voucherService.update(branchId, templateId, dto);
      setSuccessMessage(t('voucher.templates.update.success'));
      setShowSuccess(true);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error updating voucher template:', err);
      setError(
        err?.response?.data?.message || t('voucher.templates.error.save')
      );
      throw err;
    } finally {
      setLoading(false);
    }
    fetchTemplates(lastFilters);
  };

  const handleDeleteConfirm = (template: VoucherTemplate) => {
    setDeleteTemplate(template);
  };

  const handleDeleteCancel = () => {
    setDeleteTemplate(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTemplate) return;

    try {
      setLoading(true);
      await voucherService.delete(deleteTemplate.branchId, deleteTemplate.id);
      setSuccessMessage(t('voucher.templates.delete.success'));
      setShowSuccess(true);
    } catch (err: any) {
      console.error('Error deleting voucher template:', err);
      setError(t('voucher.templates.error.delete'));
    } finally {
      setLoading(false);
      setDeleteTemplate(null);
    }
    fetchTemplates(lastFilters);
  };

  const handleBulkDeleteTemplates = async (
    selectedTemplates: VoucherTemplate[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await voucherService.bulkDelete(selectedTemplates.map((t) => t.id));
      setSuccessMessage(t('voucher.templates.delete.success'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error during bulk deletion:', err);
      setError(t('voucher.templates.error.delete'));
    } finally {
      setLoading(false);
    }
    fetchTemplates(lastFilters);
  };

  const handleBulkUpdateStatus = async (
    selectedTemplates: VoucherTemplate[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await voucherService.bulkUpdateStatus(
        selectedTemplates.map((t) => t.id),
        status
      );

      const updatedCount = result?.updatedCount;
      setSuccessMessage(
        t('voucher.bulk.status.update.success', {
          count: updatedCount || selectedTemplates.length
        })
      );
      setShowSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error during bulk status update:', err);
      setError(t('voucher.templates.error.save'));
    } finally {
      setLoading(false);
    }
    fetchTemplates(lastFilters);
  };

  const handleFilterChange = (filters: Filters) => {
    setLastFilters(filters);
    fetchTemplates(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('voucher.templates.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <VoucherTemplatesTable
            templates={templates}
            loading={loading}
            totalCount={totalCount}
            onDeleteTemplate={handleDeleteConfirm}
            onBulkDeleteTemplates={handleBulkDeleteTemplates}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onOpenAddDialog={handleOpenAddDialog}
            onOpenEditDialog={handleOpenEditDialog}
            onFilterChange={handleFilterChange}
            pageKey="voucher-templates"
          />
        </Grid>
      </Grid>

      <VoucherTemplateDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        editingTemplate={editingTemplate}
        onCreateTemplate={handleCreateTemplate}
        onUpdateTemplate={handleUpdateTemplate}
      />

      <ConfirmDialog
        open={Boolean(deleteTemplate)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('confirm.delete')}
        message={t('voucher.templates.delete.confirm', {
          name: deleteTemplate?.name
        })}
      />
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
};

export default VoucherTemplatesManagement;
