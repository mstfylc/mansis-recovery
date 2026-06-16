import React, { useMemo, useCallback } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import NumericInput from '@/components/NumericInput';
import CustomImageComponent from '@/components/images/CustomImageComponent';
import { RewardGroupDto } from '@/types/Voucher.interface';
import { CompanyProduct } from '@/types/CompanyProduct.interface';

interface RewardGroupAccordionProps {
  group: RewardGroupDto;
  groupIndex: number;
  expanded: boolean;
  canRemove: boolean;
  availableProducts: CompanyProduct[];
  branchId: number | null;
  onToggleExpand: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<RewardGroupDto>) => void;
  onAddProduct: (groupIndex: number, productId: number) => void;
  onRemoveProduct: (groupIndex: number, productId: number) => void;
  onOpenProductPicker: (groupIndex: number) => void;
  getProductById: (productId: number) => CompanyProduct | undefined;
  t: (key: string) => string;
}

const RewardGroupAccordion = ({
  group,
  groupIndex,
  expanded,
  canRemove,
  availableProducts,
  branchId,
  onToggleExpand,
  onRemove,
  onUpdate,
  onAddProduct,
  onRemoveProduct,
  onOpenProductPicker,
  getProductById,
  t
}: RewardGroupAccordionProps) => {
  // Filter available products once per render, memoized
  const filteredOptions = useMemo(
    () =>
      availableProducts.filter(
        (p) => !group.products.some((gp) => gp.productId === p.id)
      ),
    [availableProducts, group.products]
  );

  // Memoize filter function to prevent recreating on every render
  const filterOptions = useCallback(
    (options: CompanyProduct[], { inputValue }: { inputValue: string }) => {
      if (!inputValue) return options.slice(0, 50);
      return options.filter((option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase())
      );
    },
    []
  );

  // Memoize render functions
  const renderOption = useCallback(
    (props: any, option: CompanyProduct) => (
      <li {...props} key={option.id}>
        <Box display="flex" alignItems="center" gap={1}>
          {option.file?.url && (
            <CustomImageComponent
              imageUrl={option.file.url}
              alt={option.name}
              width={24}
              height={24}
            />
          )}
          <Box>
            <Typography variant="body2">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.basePrice?.toFixed(2)} ₺
            </Typography>
          </Box>
        </Box>
      </li>
    ),
    []
  );

  const renderInput = useCallback(
    (params: any) => (
      <TextField
        {...params}
        label={t('voucher.add.product.to.group')}
        placeholder={t('search')}
      />
    ),
    [t]
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={() => onToggleExpand(groupIndex)}
      sx={{
        mb: 1,
        '&:before': { display: 'none' },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px !important',
        overflow: 'hidden',
        '&.Mui-expanded': { margin: '0 0 8px 0' }
      }}
      disableGutters
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor:
            group.products.length > 0 ? 'success.light' : 'warning.light',
          minHeight: 48,
          '&.Mui-expanded': { minHeight: 48 },
          '& .MuiAccordionSummary-content': { my: 1 }
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} width="100%" pr={1}>
          <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 100 }}>
            {group.name || `Grup ${groupIndex + 1}`}
          </Typography>
          <Chip
            label={`${group.products.length} ${t('products')}`}
            size="small"
            color={group.products.length > 0 ? 'success' : 'warning'}
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
          <Chip
            label={`${group.rewardQuantity} ${t('piece')}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
          <Box flex={1} />
          {canRemove && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(groupIndex);
              }}
              sx={{ p: 0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label={t('voucher.group.name')}
              value={group.name}
              onChange={(e) => onUpdate(groupIndex, { name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label={t('description')}
              value={group.description || ''}
              onChange={(e) =>
                onUpdate(groupIndex, { description: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <NumericInput
              fullWidth
              size="small"
              label={t('voucher.group.quantity')}
              value={group.rewardQuantity}
              onChange={(value) =>
                onUpdate(groupIndex, { rewardQuantity: value })
              }
              allowDecimals={false}
              allowNegative={false}
              min={1}
              max={10}
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={1} alignItems="flex-start">
              <Autocomplete
                sx={{ flex: 1 }}
                options={filteredOptions}
                getOptionLabel={(option) => option.name}
                size="small"
                value={null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    onAddProduct(groupIndex, newValue.id);
                  }
                }}
                filterOptions={filterOptions}
                renderOption={renderOption}
                renderInput={renderInput}
              />
              <Tooltip title={t('voucher.add.from.category')}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onOpenProductPicker(groupIndex)}
                  startIcon={<PlaylistAddIcon />}
                  sx={{
                    minWidth: 'auto',
                    height: 40,
                    whiteSpace: 'nowrap'
                  }}
                  disabled={!branchId}
                >
                  {t('voucher.category.select')}
                </Button>
              </Tooltip>
            </Box>
          </Grid>
          {group.products.length > 0 && (
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {group.products.map((gp) => {
                  const product = getProductById(gp.productId);
                  return (
                    <Chip
                      key={gp.productId}
                      avatar={
                        product?.file?.url ? (
                          <Avatar
                            src={product.file.url}
                            sx={{ width: 20, height: 20 }}
                          />
                        ) : undefined
                      }
                      label={product?.name || `ID: ${gp.productId}`}
                      onDelete={() => onRemoveProduct(groupIndex, gp.productId)}
                      size="small"
                      sx={{ height: 26 }}
                    />
                  );
                })}
              </Box>
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default React.memo(RewardGroupAccordion);
