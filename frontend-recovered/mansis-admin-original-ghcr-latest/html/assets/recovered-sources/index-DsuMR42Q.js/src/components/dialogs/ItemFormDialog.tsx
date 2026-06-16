import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Avatar,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { debounce } from '@/utils/helpers';
import NumericInput from '@/components/NumericInput';
import {
  CompanyProduct,
  CompanyMenuItem
} from '@/types/CompanyProduct.interface';

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingItem: CompanyMenuItem | null;
  groupName: string; // Fixed group name - not editable
  form: {
    selectedItem: CompanyProduct | null;
    extraPrice: string;
    isDefault: boolean;
    sortOrder: number;
  };
  onChangeForm: (key: string, value: any) => void;
  availableProducts: CompanyProduct[];
  onFetchAvailableProducts: (term: string) => Promise<void>;
  usedSortOrders: number[];
  suggestedSortOrder: number;
}

const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingItem,
  groupName,
  form,
  onChangeForm,
  availableProducts,
  onFetchAvailableProducts,
  usedSortOrders,
  suggestedSortOrder
}) => {
  const { t } = useTranslation();

  // Track if form has been submitted or field has been touched
  const [showValidation, setShowValidation] = useState(false);

  // Reset validation state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setShowValidation(false);
    }
  }, [open]);

  // Create debounced version of fetch function
  const debouncedFetchProducts = useMemo(
    () => debounce(onFetchAvailableProducts, 300),
    [onFetchAvailableProducts]
  );

  // Check if the current sort order is valid (not already used)
  const isSortOrderValid = !usedSortOrders.includes(form.sortOrder);
  const sortOrderError =
    showValidation && !isSortOrderValid
      ? t('menu.sort.order.already.used', { sortOrder: form.sortOrder })
      : '';

  const handleSubmit = () => {
    // Enable validation display on submit attempt
    setShowValidation(true);

    if (!form.selectedItem && !editingItem) {
      return;
    }

    // Check sort order validity
    if (!isSortOrderValid) {
      return;
    }

    onSubmit();
  };

  const isValid =
    (form.selectedItem !== null || editingItem !== null) && isSortOrderValid;

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
      <DialogTitle>
        <Typography variant="h6">
          {editingItem ? t('menu.item.edit') : t('menu.item.add')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('group')}: <strong>{groupName}</strong>
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Product Selection - Only for new items */}
          {!editingItem && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('menu.select.product')}*
              </Typography>

              {availableProducts.length > 0 && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 1
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {t('menu.quick.select')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {availableProducts.slice(0, 6).map((product) => (
                      <Chip
                        key={product.id}
                        label={product.name}
                        size="small"
                        variant="outlined"
                        onClick={() => onChangeForm('selectedItem', product)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                    {availableProducts.length > 6 && (
                      <Chip
                        label={t('menu.and.more', {
                          count: availableProducts.length - 6
                        })}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                </Box>
              )}

              <Autocomplete
                options={availableProducts}
                getOptionLabel={(option) =>
                  `${option.name} (${t('price')}: ${option.basePrice}₺)`
                }
                value={form.selectedItem}
                onChange={(_, newValue) =>
                  onChangeForm('selectedItem', newValue)
                }
                onInputChange={(_, value) => {
                  debouncedFetchProducts(value);
                }}
                filterOptions={(x) => x}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={t('menu.search.products')}
                    fullWidth
                    error={showValidation && !form.selectedItem}
                    helperText={
                      showValidation && !form.selectedItem
                        ? t('menu.product.required')
                        : ''
                    }
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Avatar
                        src={option.file?.url}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        {option.name[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('base.price')}: {option.basePrice}₺
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />
            </Grid>
          )}

          {/* Current Product Display - For editing */}
          {editingItem && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.200'
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('menu.editing.product')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={editingItem.item?.file?.url}>
                    {editingItem.item?.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {editingItem.item?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('base.price')}: {editingItem.item?.basePrice}₺
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Extra Price */}
          <Grid item xs={12} sm={6}>
            <NumericInput
              fullWidth
              label={t('extra.price')}
              value={parseFloat(form.extraPrice) || 0}
              onChange={(value) => onChangeForm('extraPrice', value.toString())}
              allowDecimals={true}
              allowNegative={false}
              min={1}
              decimalPlaces={2}
              InputProps={{
                endAdornment: <Typography variant="body2">₺</Typography>
              }}
              helperText={t('extra.price.help')}
            />
          </Grid>

          {/* Sort Order */}
          <Grid item xs={12} sm={6}>
            <NumericInput
              fullWidth
              label={t('sort.order')}
              value={form.sortOrder}
              onChange={(value) => onChangeForm('sortOrder', value)}
              min={1}
              max={999}
              error={showValidation && !isSortOrderValid}
              helperText={
                showValidation && !isSortOrderValid
                  ? sortOrderError
                  : usedSortOrders.length > 0
                    ? t('menu.sort.order.used.orders', {
                        usedOrders: usedSortOrders.join(', '),
                        suggested: suggestedSortOrder
                      })
                    : t('sort.order.help')
              }
            />
            {usedSortOrders.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('menu.sort.order.info')}:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    flexWrap: 'wrap',
                    mt: 0.5
                  }}
                >
                  {usedSortOrders.map((order) => (
                    <Chip
                      key={order}
                      label={order}
                      size="small"
                      variant="outlined"
                      color={form.sortOrder === order ? 'error' : 'default'}
                    />
                  ))}
                  {!editingItem && (
                    <Chip
                      label={`${t('suggested')}: ${suggestedSortOrder}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() =>
                        onChangeForm('sortOrder', suggestedSortOrder)
                      }
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Is Default */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isDefault}
                  onChange={(e) => onChangeForm('isDefault', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{t('menu.default')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('menu.default.help')}
                  </Typography>
                </Box>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid}>
          {editingItem ? t('update') : t('add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemFormDialog;
