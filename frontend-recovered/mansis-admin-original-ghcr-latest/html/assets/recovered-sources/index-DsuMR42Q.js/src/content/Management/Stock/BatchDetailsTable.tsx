import React, { useContext } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Collapse,
  Chip,
  useTheme
} from '@mui/material';
import { Can } from '@casl/react';
import AbilityContext from '@/contexts/AbilityContext';
import { Action } from '@/types/permissions';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  SwapHoriz as TransferIcon,
  Edit as EditIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { BranchStock, StockUnit } from '@/types/stock';
import { prepareStockUnitLabel, getBatchExpiryColor } from '@/utils/helpers';
import {
  formatDateToDayMonthYearTime,
  formatDateToDayMonthYear
} from '@/utils/dateFormatters';

interface BatchDetailsTableProps {
  batches: BranchStock[];
  isExpanded: boolean;
  unit: StockUnit;
  parentColSpan: number;
  onAddStock: (stock: BranchStock) => void;
  onDeductStock: (stock: BranchStock) => void;
  onAdjustStock: (stock: BranchStock) => void;
  onTransferStock: (stock: BranchStock) => void;
  onBatchStatus: (stock: BranchStock) => void;
}

const BatchDetailsTable: React.FC<BatchDetailsTableProps> = ({
  batches,
  isExpanded,
  unit,
  parentColSpan,
  onAddStock,
  onDeductStock,
  onAdjustStock,
  onTransferStock,
  onBatchStatus
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const ability = useContext(AbilityContext);

  const formatStockUnit = (stockUnit: StockUnit): string => {
    return t(prepareStockUnitLabel(stockUnit));
  };

  const getStockStatusColor = (
    quantity: number,
    minThreshold?: number
  ): string => {
    if (quantity <= 0) return theme.palette.error.main;
    if (minThreshold && quantity <= minThreshold) {
      return theme.palette.warning.main;
    }
    return theme.palette.success.main;
  };

  const getBatchStatusChip = (status: string) => {
    const statusConfig: Record<
      string,
      {
        color: 'success' | 'warning' | 'error' | 'default' | 'info';
        label: string;
      }
    > = {
      ACTIVE: { color: 'success', label: t('batch.status.ACTIVE') },
      NEAR_EXPIRY: { color: 'warning', label: t('batch.status.NEAR_EXPIRY') },
      EXPIRED: { color: 'error', label: t('batch.status.EXPIRED') },
      QUARANTINED: { color: 'error', label: t('batch.status.QUARANTINED') },
      RECALLED: { color: 'error', label: t('batch.status.RECALLED') },
      DISPOSED: { color: 'default', label: t('batch.status.DISPOSED') }
    };

    const config = statusConfig[status] || {
      color: 'default' as const,
      label: status
    };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Check if user can perform stock actions
  const canPerformStockActions = ability.can(Action.Update, 'Stock');

  const batchHeaders = [
    { id: 'batchNumber', label: t('batch.number'), align: 'left' as const },
    { id: 'status', label: t('status'), align: 'center' as const },
    { id: 'quantity', label: t('stock.table.stock'), align: 'center' as const },
    {
      id: 'expiryDate',
      label: t('expiry.date'),
      align: 'center' as const
    },
    {
      id: 'lastRestock',
      label: t('stock.table.last.restock'),
      align: 'center' as const
    },
    ...(canPerformStockActions
      ? [{ id: 'actions', label: t('actions'), align: 'center' as const }]
      : [])
  ];

  const getBatchCountText = () => {
    if (batches.length === 1) {
      return `1 ${t('stock.table.batch')}`;
    }
    return `${batches.length} ${t('stock.table.batches')}`;
  };

  return (
    <TableRow>
      <TableCell
        colSpan={parentColSpan}
        sx={{
          py: 0,
          borderBottom: isExpanded ? undefined : 'none'
        }}
      >
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              margin: 2,
              backgroundColor: theme.palette.background.default,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                backgroundColor: theme.palette.primary.dark,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" color="white">
                {t('batch.details')} ({getBatchCountText()})
              </Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {batchHeaders.map((header) => (
                    <TableCell
                      key={header.id}
                      align={header.align}
                      sx={{
                        fontWeight: 600,
                        backgroundColor: `${theme.palette.primary.main}15`,
                        borderBottom: `2px solid ${theme.palette.primary.main}`,
                        color: theme.palette.text.primary
                      }}
                    >
                      {header.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.map((batch, index) => {
                  const isActive =
                    batch.batch?.status === 'ACTIVE' ||
                    batch.batch?.status === 'NEAR_EXPIRY';
                  const canChangeStatus =
                    batch.batch && batch.batch.status !== 'DISPOSED';

                  return (
                    <TableRow
                      key={`batch-detail-${batch.id}-${index}`}
                      hover
                      sx={{
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      {/* Batch Number */}
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {batch.batch?.batchNumber || '-'}
                        </Typography>
                        {batch.batch?.supplierBatchNo && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {t('supplier.batch.no')}:{' '}
                            {batch.batch.supplierBatchNo}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        {batch.batch ? (
                          getBatchStatusChip(batch.batch.status)
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell align="center">
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          gap={0.5}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: getStockStatusColor(
                                batch.quantity,
                                batch.minThreshold
                              )
                            }}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {batch.quantity}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatStockUnit(unit)}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Expiry Date */}
                      <TableCell align="center">
                        {batch.batch?.expiryDate ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: getBatchExpiryColor(batch.batch.expiryDate)
                            }}
                          >
                            {formatDateToDayMonthYear(
                              new Date(batch.batch.expiryDate)
                            )}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Last Restock */}
                      <TableCell align="center">
                        <Typography variant="body2">
                          {batch.lastRestockDate
                            ? formatDateToDayMonthYearTime(
                                new Date(batch.lastRestockDate)
                              )
                            : '-'}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      {canPerformStockActions && (
                        <TableCell align="center">
                          <Box display="flex" gap={0.5} justifyContent="center">
                            {isActive && (
                              <>
                                <Tooltip arrow title={t('stock.action.add')}>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => onAddStock(batch)}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip arrow title={t('stock.action.deduct')}>
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => onDeductStock(batch)}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip
                                  arrow
                                  title={t('stock.action.transfer')}
                                >
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => onTransferStock(batch)}
                                  >
                                    <TransferIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip arrow title={t('stock.action.adjust')}>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => onAdjustStock(batch)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {canChangeStatus && (
                              <Can I="update" a="Batch" ability={ability}>
                                <Tooltip arrow title={t('batch.status.change')}>
                                  <IconButton
                                    size="small"
                                    color={
                                      batch.batch?.status === 'QUARANTINED' ||
                                      batch.batch?.status === 'EXPIRED'
                                        ? 'error'
                                        : 'secondary'
                                    }
                                    onClick={() => onBatchStatus(batch)}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Can>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
};

export default BatchDetailsTable;
