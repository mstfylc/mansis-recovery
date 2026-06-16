import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MItem,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Box
} from '@mui/material';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import { useTranslation } from 'react-i18next';
import {
  CompanyProduct,
  SelectionType
} from '@/types/CompanyProduct.interface';

type GroupData = {
  groupName: string;
  selectionType: SelectionType;
  minSelection: number;
  maxSelection: number;
  items: any[];
};

interface BulkAddMenuItemsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  bulkForm: {
    groupName: string;
    extraPrice: string;
  };
  onChangeBulkForm: (
    updates: Partial<BulkAddMenuItemsDialogProps['bulkForm']>
  ) => void;
  bulkSearch: string;
  onChangeBulkSearch: (value: string) => void;
  availableProducts: CompanyProduct[];
  selectedProductIds: number[];
  onToggleSelectProduct: (productId: number) => void;
  onFetchAvailableProducts: (term: string) => Promise<void>;
  availableGroups: GroupData[];
}

// Selection type options - removed since we don't need this anymore

const BulkAddMenuItemsDialog: React.FC<BulkAddMenuItemsDialogProps> = ({
  open,
  onClose,
  onSubmit,
  bulkForm,
  onChangeBulkForm,
  bulkSearch,
  onChangeBulkSearch,
  availableProducts,
  selectedProductIds,
  onToggleSelectProduct,
  onFetchAvailableProducts,
  availableGroups
}) => {
  const { t } = useTranslation();

  const handleSubmit = () => {
    onSubmit();
  };

  const handleSearchChange = async (value: string) => {
    onChangeBulkSearch(value);
    await onFetchAvailableProducts(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('menu.bulk.add')}</DialogTitle>
      <DialogContent>
        {availableGroups.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('menu.no.groups.available')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('menu.create.group.first.message')}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('menu.group')}</InputLabel>
                <Select
                  label={t('menu.group')}
                  value={bulkForm.groupName}
                  onChange={(e) =>
                    onChangeBulkForm({ groupName: e.target.value })
                  }
                >
                  {availableGroups.map((group) => (
                    <MItem key={group.groupName} value={group.groupName}>
                      <Box>
                        <Typography variant="body2">
                          {group.groupName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t(`menu.selection.type.${group.selectionType}`)}
                          {group.selectionType === 'SELECTABLE' &&
                            ` (${group.minSelection}-${group.maxSelection})`}
                        </Typography>
                      </Box>
                    </MItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('menu.extra.price')}
                value={bulkForm.extraPrice}
                onChange={(e) =>
                  onChangeBulkForm({ extraPrice: e.target.value })
                }
                type="number"
                helperText={t('menu.extra.price.help.text')}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <SearchTwoToneIcon fontSize="small" />
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={t('menu.search.products')}
                    value={bulkSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </Stack>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('menu.available.items')}
                </Typography>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {availableProducts.map((p) => (
                    <ListItem key={p.id} disablePadding>
                      <ListItemButton
                        onClick={() => onToggleSelectProduct(p.id)}
                        selected={selectedProductIds.includes(p.id)}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar src={p.file?.url}>{p.name[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={p.name}
                          secondary={
                            p.description || `${t('price')}: ${p.basePrice}`
                          }
                        />
                        {selectedProductIds.includes(p.id) && (
                          <Chip
                            size="small"
                            color="primary"
                            label={t('select')}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={selectedProductIds.length === 0 || !bulkForm.groupName}
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkAddMenuItemsDialog;
