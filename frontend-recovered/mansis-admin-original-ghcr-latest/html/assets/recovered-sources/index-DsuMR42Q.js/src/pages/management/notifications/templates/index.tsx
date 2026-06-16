import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@/data/notificationService';
import { NotificationTemplate } from '@/types/Notification.interface';
import { Can } from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import { useSnackbar } from 'notistack';
import TemplateDialog from './TemplateDialog';

function TemplateListPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getTemplates();
      setTemplates(data);
    } catch {
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await notificationService.deleteTemplate(id);
      enqueueSnackbar(t('common.deleteSuccess'), { variant: 'success' });
      fetchTemplates();
    } catch {
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    }
  };

  const handleDialogClose = (saved?: boolean) => {
    setDialogOpen(false);
    setSelectedTemplate(null);
    if (saved) fetchTemplates();
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: t('notification.template.name'),
      flex: 1
    },
    {
      field: 'title',
      headerName: t('notification.campaign.title'),
      flex: 1
    },
    {
      field: 'category',
      headerName: t('notification.campaign.category'),
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" />
      )
    },
    {
      field: 'isActive',
      headerName: t('common.status'),
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? t('common.active') : t('common.inactive')}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<NotificationTemplate>) => (
        <Box display="flex" gap={0.5}>
          <Can I={Action.Update} a="Notification">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Can>
          <Can I={Action.Delete} a="Notification">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Can>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        mt={2}
      >
        <Typography variant="h4">{t('notification.template.list')}</Typography>
        <Can I={Action.Create} a="Notification">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
          >
            {t('notification.template.create')}
          </Button>
        </Can>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={templates}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            autoHeight
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } }
            }}
          />
        </CardContent>
      </Card>

      <TemplateDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        template={selectedTemplate}
      />
    </Container>
  );
}

export default TemplateListPage;
