import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { companyProductService } from '@/data/companyProductService';
import {
  ProductAttribute,
  AvailableAttributeGroup,
  ImportAttributeGroupDto
} from '@/types/ProductAttribute.interface';

interface ImportAttributeDialogProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  onImportSuccess: (importedGroup: ProductAttribute) => void;
}

const ImportAttributeDialog: React.FC<ImportAttributeDialogProps> = ({
  open,
  onClose,
  productId,
  onImportSuccess
}) => {
  const { t } = useTranslation();
  const [availableGroups, setAvailableGroups] = useState<
    AvailableAttributeGroup[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchAvailableGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const result =
        await companyProductService.getAvailableAttributesForImport(productId);
      setAvailableGroups(result);
    } catch (err: any) {
      console.error('Error fetching available attribute groups:', err);
      setError(
        err.response?.data?.message ||
          t('error.failed.to.load.available.attributes')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAvailableGroups();
    }
  }, [open]);

  const handleImportGroup = async (group: AvailableAttributeGroup) => {
    try {
      setImporting(true);
      setError(null);

      const importData: ImportAttributeGroupDto = {
        attributeName: group.attributeName,
        options: group.options.map((option) => ({
          optionName: option.optionName,
          extraPrice: option.extraPrice,
          isDefault: option.isDefault,
          sortOrder: option.sortOrder,
          isRequired: option.isRequired
        }))
      };
      const imported = await companyProductService.importAttributeGroup(
        productId,
        importData
      );
      onImportSuccess(imported);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          t('error.failed.to.import.attribute.group')
      );
    } finally {
      setImporting(false);
    }
  };

  const toggleGroupExpansion = (groupKey: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupKey)) {
      newExpandedGroups.delete(groupKey);
    } else {
      newExpandedGroups.add(groupKey);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const filteredGroups = availableGroups.filter(
    (group) =>
      group.attributeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '70vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">{t('import.attribute.group')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('import.attribute.group.description')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          placeholder={t('search.attribute.groups')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        ) : filteredGroups.length === 0 ? (
          <Alert severity="info">
            {searchTerm
              ? t('no.attribute.groups.found.for.search')
              : t('no.attribute.groups.available.for.import')}
          </Alert>
        ) : (
          <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {filteredGroups.map((group) => {
              const groupKey = `${group.companyProductId}_${group.attributeName}`;
              const isExpanded = expandedGroups.has(groupKey);

              return (
                <Box key={groupKey} sx={{ mb: 1 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => toggleGroupExpansion(groupKey)}
                      >
                        <Box flex={1}>
                          <Typography variant="h6" component="div">
                            {group.attributeName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {group.productName} • {group.companyName}
                          </Typography>
                          <Box mt={1}>
                            <Chip
                              label={t('options.count', {
                                count: group.options.length
                              })}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImportGroup(group);
                            }}
                            disabled={importing}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton>
                            {isExpanded ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </Box>
                      </Box>

                      <Collapse in={isExpanded}>
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            {t('attribute.options')}:
                          </Typography>
                          {group.options.map((option, index) => (
                            <ListItem key={index} dense>
                              <ListItemText
                                primary={option.optionName}
                                secondary={
                                  option.extraPrice > 0
                                    ? t('extra.price', {
                                        price: option.extraPrice
                                      })
                                    : t('no.extra.price')
                                }
                              />
                              <ListItemSecondaryAction>
                                {option.isDefault && (
                                  <Chip
                                    label={t('default')}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={importing}>
          {t('cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportAttributeDialog;
