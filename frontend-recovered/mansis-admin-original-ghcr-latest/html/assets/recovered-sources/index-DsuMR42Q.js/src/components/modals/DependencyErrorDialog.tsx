import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import {
  Warning as WarningIcon,
  DeleteForever as ForceDeleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface DependencyDetail {
  productId: number;
  productName?: string;
  reason: string;
  details?: string;
  branchOverrides?: number;
  linkedAttributeOptions?: number;
}

interface DependencyErrorDialogProps {
  open: boolean;
  onClose: () => void;
  onForceDelete: () => void;
  dependencies: DependencyDetail[];
  title?: string;
  loading?: boolean;
}

const DependencyErrorDialog: React.FC<DependencyErrorDialogProps> = ({
  open,
  onClose,
  onForceDelete,
  dependencies,
  title,
  loading = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const getTotalDependencies = () => {
    return dependencies.reduce((total, dep) => {
      return total + (dep.branchOverrides || 0); // Only count branch overrides now
    }, 0);
  };

  const renderDependencyDetails = (dependency: DependencyDetail) => {
    const details: React.ReactElement[] = [];

    if (dependency.branchOverrides && dependency.branchOverrides > 0) {
      details.push(
        (
          <Chip
            key="branch"
            label={t('product.dependency.branch.overrides', {
              count: dependency.branchOverrides
            })}
            size="small"
            color="warning"
            variant="outlined"
          />
        ) as React.ReactElement
      );
    }

    // Note: We no longer show attribute options as they are handled automatically

    return details;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h5" component="span">
            {title || t('product.dependency.error.title')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>{t('product.dependency.error.alert.title')}</AlertTitle>
          {t('product.dependency.error.alert.message', {
            count: dependencies.length,
            dependencies: getTotalDependencies()
          })}
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
          {t('product.dependency.affected.products')} ({dependencies.length})
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            maxHeight: 400,
            overflow: 'auto',
            backgroundColor: theme.palette.background.default
          }}
        >
          <List dense>
            {dependencies.map((dependency, index) => (
              <React.Fragment key={dependency.productId}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          {dependency.productName ||
                            `Product #${dependency.productName}`}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {dependency.reason}
                        </Typography>
                        {dependency.details && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1, display: 'block' }}
                          >
                            {dependency.details}
                          </Typography>
                        )}
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {renderDependencyDetails(dependency)}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < dependencies.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>{t('product.dependency.force.delete.title')}</AlertTitle>
          {t('product.dependency.force.delete.description')}
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onForceDelete}
          variant="contained"
          color="error"
          startIcon={<ForceDeleteIcon />}
          disabled={loading}
          sx={{ ml: 1 }}
        >
          {loading ? t('product.force.deleting') : t('product.force.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DependencyErrorDialog;
