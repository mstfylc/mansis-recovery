import React, { useContext } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Stack
} from '@mui/material';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as OverrideIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  CompanyProduct,
  BranchOverride
} from '@/types/CompanyProduct.interface';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Action } from '@/types/permissions';

interface BranchOverridesTableProps {
  product: CompanyProduct;
  overrides: BranchOverride[];
  onEditOverride: (override: BranchOverride) => void;
  onDeleteOverride: (overrideId: number) => void;
}

const BranchOverridesTable: React.FC<BranchOverridesTableProps> = ({
  product,
  overrides,
  onEditOverride,
  onDeleteOverride
}) => {
  const { t } = useTranslation();
  const { isSuperAdmin, isCompanyAdmin } = useUserViewMode();
  const ability = useContext(AbilityContext);
  const showBranchColumn = isSuperAdmin || isCompanyAdmin;
  const showActionsColumn =
    ability.can(Action.Update, 'BranchProductOverride') ||
    ability.can(Action.Delete, 'BranchProductOverride');

  const getEffectiveValue = (originalValue: any, overrideValue: any) => {
    return overrideValue !== null && overrideValue !== undefined
      ? overrideValue
      : originalValue;
  };

  const isOverridden = (overrideValue: any) => {
    return overrideValue !== null && overrideValue !== undefined;
  };

  const OverrideIndicator: React.FC<{ isOverridden: boolean }> = ({
    isOverridden
  }) =>
    isOverridden ? (
      <Tooltip title={t('field.overridden')}>
        <OverrideIcon
          sx={{
            fontSize: 14,
            color: 'warning.main',
            ml: 0.5,
            verticalAlign: 'middle'
          }}
        />
      </Tooltip>
    ) : null;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {showBranchColumn && <TableCell>{t('branch')}</TableCell>}
            <TableCell>{t('image')}</TableCell>
            <TableCell>{t('name')}</TableCell>
            <TableCell>{t('price')}</TableCell>
            <TableCell>{t('status')}</TableCell>
            <TableCell>{t('stock.tracking')}</TableCell>
            <TableCell>{t('batch.tracking')}</TableCell>
            <TableCell>{t('stock.allow.negative')}</TableCell>
            <TableCell>{t('last.updated')}</TableCell>
            {showActionsColumn && (
              <TableCell align="right">{t('actions')}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {overrides.map((override) => (
            <TableRow key={override.id} hover>
              {showBranchColumn && (
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {override.branch.name}
                    </Typography>
                    {override.branch.mapcode && (
                      <Typography variant="caption" color="text.secondary">
                        {override.branch.mapcode}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              )}

              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ position: 'relative' }}>
                    {getEffectiveValue(
                      product.file?.url,
                      override.file?.url
                    ) ? (
                      <Avatar
                        src={getEffectiveValue(
                          product.file?.url,
                          override.file?.url
                        )}
                        alt={getEffectiveValue(product.name, override.name)}
                        sx={{
                          width: 40,
                          height: 40,
                          border: isOverridden(override.file?.url)
                            ? '2px solid'
                            : 'none',
                          borderColor: 'warning.main',
                          boxShadow: isOverridden(override.file?.url)
                            ? '0 0 0 1px rgba(237, 108, 2, 0.2)'
                            : 'none'
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: isOverridden(override.file?.url)
                            ? 'warning.light'
                            : 'grey.300',
                          border: isOverridden(override.file?.url)
                            ? '2px solid'
                            : 'none',
                          borderColor: 'warning.main'
                        }}
                      >
                        <ImageIcon
                          sx={{
                            color: isOverridden(override.file?.url)
                              ? 'warning.main'
                              : 'grey.600'
                          }}
                        />
                      </Avatar>
                    )}

                    {/* Override badge for images */}
                    {isOverridden(override.file?.url) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: 'warning.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 'bold',
                          boxShadow: 1
                        }}
                      >
                        !
                      </Box>
                    )}
                  </Box>

                  <OverrideIndicator
                    isOverridden={isOverridden(override.file?.url)}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction="row" alignItems="center">
                  <Typography variant="body2">
                    {getEffectiveValue(product.name, override.name)}
                  </Typography>
                  <OverrideIndicator
                    isOverridden={isOverridden(override.name)}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction="row" alignItems="center">
                  <Typography variant="body2" fontWeight="medium">
                    ₺
                    {getEffectiveValue(
                      product.basePrice,
                      override.price
                    ).toFixed(2)}
                  </Typography>
                  <OverrideIndicator
                    isOverridden={isOverridden(override.price)}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction="row" alignItems="center">
                  <Chip
                    size="small"
                    label={t(
                      `product.status.${getEffectiveValue(product.status, override.status).toLowerCase()}`
                    )}
                    color={
                      getEffectiveValue(product.status, override.status) ===
                      'ACTIVE'
                        ? 'success'
                        : 'default'
                    }
                  />
                  <OverrideIndicator
                    isOverridden={isOverridden(override.status)}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction="row" alignItems="center">
                  <Chip
                    size="small"
                    label={
                      getEffectiveValue(
                        product.isStockTracked ?? false,
                        override.isStockTracked
                      )
                        ? t('enabled')
                        : t('disabled')
                    }
                    color={
                      getEffectiveValue(
                        product.isStockTracked ?? false,
                        override.isStockTracked
                      )
                        ? 'primary'
                        : 'default'
                    }
                    variant={
                      getEffectiveValue(
                        product.isStockTracked ?? false,
                        override.isStockTracked
                      )
                        ? 'filled'
                        : 'outlined'
                    }
                  />
                  <OverrideIndicator
                    isOverridden={isOverridden(override.isStockTracked)}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction="row" alignItems="center">
                  <Chip
                    size="small"
                    label={
                      getEffectiveValue(
                        product.trackExpiry ?? false,
                        override.trackExpiry
                      )
                        ? t('enabled')
                        : t('disabled')
                    }
                    color={
                      getEffectiveValue(
                        product.trackExpiry ?? false,
                        override.trackExpiry
                      )
                        ? 'success'
                        : 'default'
                    }
                    variant={
                      getEffectiveValue(
                        product.trackExpiry ?? false,
                        override.trackExpiry
                      )
                        ? 'filled'
                        : 'outlined'
                    }
                  />
                  <OverrideIndicator
                    isOverridden={isOverridden(override.trackExpiry)}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction="row" alignItems="center">
                  <Chip
                    size="small"
                    label={
                      getEffectiveValue(
                        product.allowNegativeStock ?? false,
                        override.allowNegativeStock
                      )
                        ? t('enabled')
                        : t('disabled')
                    }
                    color={
                      getEffectiveValue(
                        product.allowNegativeStock ?? false,
                        override.allowNegativeStock
                      )
                        ? 'primary'
                        : 'default'
                    }
                    variant={
                      getEffectiveValue(
                        product.allowNegativeStock ?? false,
                        override.allowNegativeStock
                      )
                        ? 'filled'
                        : 'outlined'
                    }
                  />
                  <OverrideIndicator
                    isOverridden={isOverridden(override.allowNegativeStock)}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Typography>
                  {formatDateToDayMonthYearTime(override.updatedAt)}
                </Typography>
              </TableCell>

              {showActionsColumn && (
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    justifyContent="flex-end"
                  >
                    <Can I="update" a="BranchProductOverride" ability={ability}>
                      <Tooltip title={t('edit')}>
                        <IconButton
                          size="small"
                          onClick={() => onEditOverride(override)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Can>
                    <Can I="delete" a="BranchProductOverride" ability={ability}>
                      <Tooltip title={t('delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteOverride(override.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Can>
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BranchOverridesTable;
