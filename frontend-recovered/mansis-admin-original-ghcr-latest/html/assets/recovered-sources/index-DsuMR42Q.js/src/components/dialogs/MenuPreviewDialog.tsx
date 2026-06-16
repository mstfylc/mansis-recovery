import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Paper,
  Typography,
  Chip,
  Grid,
  Avatar,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import {
  prepareSelectionTypeLabel,
  getSelectionTypeColor
} from '@/utils/helpers';
import { CancelTwoTone, CheckCircle } from '@mui/icons-material';

type PreviewGroup = {
  groupName: string;
  selectionType: 'REQUIRED' | 'OPTIONAL' | 'SELECTABLE';
  minSelection: number;
  maxSelection: number;
  items: Array<{
    id: number;
    name: string;
    basePrice: number;
    extraPrice: number;
    isDefault: boolean;
    sortOrder: number;
    isAvailable: boolean;
    image?: string;
  }>;
};

type MenuPreview = {
  menuId: number;
  groups: PreviewGroup[];
};

type PriceCalculation = {
  menuId: number;
  basePrice?: number;
  finalPrice?: number;
  [key: string]: unknown;
};

interface MenuPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onCalculate: () => void;
  selectedMenu: CompanyProduct | null;
  preview: MenuPreview | null;
  calcSelections: Record<string, number[]>;
  onCalcSelectionChange: (group: string, itemId: number) => void;
  calcResult: PriceCalculation | null;
}

const MenuPreviewDialog: React.FC<MenuPreviewDialogProps> = ({
  open,
  onClose,
  onCalculate,
  selectedMenu,
  preview,
  calcSelections,
  onCalcSelectionChange,
  calcResult
}) => {
  const { t } = useTranslation();

  const handleCalculate = () => {
    onCalculate();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('menu.preview')}</DialogTitle>
      <DialogContent>
        {preview ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedMenu && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={`${t('menu.base.price')}: ${selectedMenu.basePrice}`}
                />
                {calcResult?.finalPrice !== undefined && (
                  <Chip
                    color="primary"
                    label={`${t('menu.final.price')}: ${calcResult.finalPrice}`}
                  />
                )}
              </Stack>
            )}
            {preview.groups.map((menuGroup) => (
              <Paper key={menuGroup.groupName} sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle1">
                    {menuGroup.groupName}
                  </Typography>
                  <Chip
                    size="small"
                    label={t(
                      prepareSelectionTypeLabel(menuGroup.selectionType)
                    )}
                    color={getSelectionTypeColor(menuGroup.selectionType)}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${t('menu.min.selection')}: ${menuGroup.minSelection}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${t('menu.max.selection')}: ${menuGroup.maxSelection}`}
                  />
                  {menuGroup.selectionType === 'SELECTABLE' && (
                    <Chip
                      size="small"
                      variant="filled"
                      color="info"
                      label={`${t('menu.selected')}: ${
                        calcSelections[menuGroup.groupName]?.length || 0
                      }/${menuGroup.maxSelection}`}
                    />
                  )}
                </Stack>
                <Grid container spacing={1}>
                  {/* Add "İstemiyorum" option for OPTIONAL groups */}
                  {menuGroup.selectionType === 'OPTIONAL' && (
                    <Grid item xs={12} md={6}>
                      <Paper
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          border: (theme) =>
                            `1px solid ${
                              calcSelections[menuGroup.groupName]?.includes(-1)
                                ? theme.palette.primary.main
                                : 'transparent'
                            }`
                        }}
                        onClick={() =>
                          onCalcSelectionChange(menuGroup.groupName, -1)
                        }
                      >
                        <Avatar sx={{ bgcolor: 'grey.300' }}>
                          <CancelTwoTone color="error" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {t('menu.i.dont.want')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('price')}: {t('free')}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={t('menu.default')}
                          sx={{ ml: 'auto' }}
                        />
                      </Paper>
                    </Grid>
                  )}
                  {menuGroup.items.map((groupItem) => (
                    <Grid item xs={12} md={6} key={groupItem.id}>
                      <Paper
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          border: (theme) =>
                            `1px solid ${
                              calcSelections[menuGroup.groupName]?.includes(
                                groupItem.id
                              )
                                ? theme.palette.primary.main
                                : 'transparent'
                            }`
                        }}
                        onClick={() =>
                          onCalcSelectionChange(
                            menuGroup.groupName,
                            groupItem.id
                          )
                        }
                      >
                        <Avatar src={groupItem.image}>
                          {groupItem.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {groupItem.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(() => {
                              if (groupItem.extraPrice > 0) {
                                return `${t('price')}: +${groupItem.extraPrice} TL`;
                              } else if (groupItem.extraPrice < 0) {
                                return `${t('price')}: ${groupItem.extraPrice} TL`;
                              }
                              return `${t('price')}: ${t('free')}`;
                            })()}
                          </Typography>
                        </Box>
                        {groupItem.isDefault && (
                          <Chip
                            size="small"
                            label={t('menu.default')}
                            sx={{ ml: 'auto' }}
                          />
                        )}
                        {menuGroup.selectionType === 'SELECTABLE' &&
                          calcSelections[menuGroup.groupName]?.includes(
                            groupItem.id
                          ) && (
                            <CheckCircle
                              color="primary"
                              sx={{ ml: 'auto' }}
                              fontSize="small"
                            />
                          )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2">{t('chart.loading')}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('close')}</Button>
        <Button
          onClick={handleCalculate}
          variant="contained"
          disabled={!preview}
        >
          {t('menu.calculate.price')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MenuPreviewDialog;
