import { FC, useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import {
  TableShape,
  type Table,
  type FloorPlan
} from '@/types/Table.interface';
import type { CreateTableData, UpdateTableData } from '@/types/Table.interface';

interface TableDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateTableData | UpdateTableData) => Promise<void>;
  table?: Table | null;
  floorPlans: FloorPlan[];
  defaultFloorPlanId?: number;
  existingTables?: Table[];
  error?: string;
}

const TableDialog: FC<TableDialogProps> = ({
  open,
  onClose,
  onSave,
  table,
  floorPlans,
  defaultFloorPlanId,
  existingTables = [],
  error
}) => {
  const { t } = useTranslation();
  const isEdit = !!table;

  const [floorPlanId, setFloorPlanId] = useState<number>(
    defaultFloorPlanId ?? 0
  );
  const [label, setLabel] = useState('');
  const [shape, setShape] = useState<TableShape>(TableShape.RECTANGLE);
  const [capacity, setCapacity] = useState<number>(4);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [gridRow, setGridRow] = useState<number>(-1);
  const [gridCol, setGridCol] = useState<number>(-1);

  const selectedFloorPlan = useMemo(
    () => floorPlans.find((fp) => fp.id === floorPlanId) ?? null,
    [floorPlans, floorPlanId]
  );

  // Build a set of occupied cells for quick lookup
  const occupiedCells = useMemo(() => {
    const cells = new Set<string>();
    for (const tbl of existingTables) {
      // Skip the table being edited so it doesn't block its own cell
      if (isEdit && table && tbl.id === table.id) continue;
      for (let r = tbl.gridRow; r < tbl.gridRow + tbl.gridRowSpan; r++) {
        for (let c = tbl.gridCol; c < tbl.gridCol + tbl.gridColSpan; c++) {
          cells.add(`${r},${c}`);
        }
      }
    }
    return cells;
  }, [existingTables, isEdit, table]);

  // Map occupied cell -> table label initial for display
  const cellLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const tbl of existingTables) {
      if (isEdit && table && tbl.id === table.id) continue;
      for (let r = tbl.gridRow; r < tbl.gridRow + tbl.gridRowSpan; r++) {
        for (let c = tbl.gridCol; c < tbl.gridCol + tbl.gridColSpan; c++) {
          map.set(`${r},${c}`, tbl.label);
        }
      }
    }
    return map;
  }, [existingTables, isEdit, table]);

  useEffect(() => {
    if (table) {
      setFloorPlanId(table.floorPlanId);
      setLabel(table.label);
      setShape(table.shape);
      setCapacity(table.capacity);
      setIsActive(table.isActive);
      setGridRow(table.gridRow);
      setGridCol(table.gridCol);
    } else {
      setFloorPlanId(defaultFloorPlanId ?? floorPlans[0]?.id ?? 0);
      setLabel('');
      setShape(TableShape.RECTANGLE);
      setCapacity(4);
      setIsActive(true);
      setGridRow(-1);
      setGridCol(-1);
    }
    setLoading(false);
  }, [table, open, defaultFloorPlanId, floorPlans]);

  // Reset grid position when floor plan changes
  useEffect(() => {
    if (!isEdit) {
      setGridRow(-1);
      setGridCol(-1);
    }
  }, [floorPlanId, isEdit]);

  const isValid =
    label.trim().length > 0 &&
    capacity >= 1 &&
    (isEdit || (floorPlanId > 0 && gridRow >= 0 && gridCol >= 0));

  const handleSubmit = async () => {
    if (loading || !isValid) return;
    setLoading(true);
    try {
      if (isEdit) {
        const updateData: UpdateTableData = {
          label: label.trim(),
          shape,
          capacity,
          isActive
        };
        await onSave(updateData);
      } else {
        const createData: CreateTableData = {
          floorPlanId,
          label: label.trim(),
          shape,
          capacity,
          isActive,
          gridRow,
          gridCol
        };
        await onSave(createData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const CELL_SIZE = 36;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? t('table.edit.table') : t('table.create.table')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {!isEdit && (
            <FormControl fullWidth required>
              <InputLabel>{t('table.floor.plan')}</InputLabel>
              <Select
                value={floorPlanId}
                onChange={(e) => setFloorPlanId(Number(e.target.value))}
                label={t('table.floor.plan')}
              >
                {floorPlans.map((fp) => (
                  <MenuItem key={fp.id} value={fp.id}>
                    {fp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {isEdit && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('table.floor.plan')}:{' '}
                <strong>
                  {floorPlans.find((fp) => fp.id === floorPlanId)?.name ??
                    String(floorPlanId)}
                </strong>
              </Typography>
            </Box>
          )}

          <TextField
            label={t('table.label')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            required
            variant="outlined"
            inputProps={{ maxLength: 50 }}
          />

          <FormControl fullWidth>
            <InputLabel>{t('table.shape')}</InputLabel>
            <Select
              value={shape}
              onChange={(e) => setShape(e.target.value as TableShape)}
              label={t('table.shape')}
            >
              {Object.values(TableShape).map((s) => (
                <MenuItem key={s} value={s}>
                  {t(`table.shape.${s}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <NumericInput
            label={t('table.capacity')}
            value={capacity}
            onChange={(val) => setCapacity(val)}
            min={1}
            max={50}
            allowDecimals={false}
          />

          {/* Grid position picker */}
          {selectedFloorPlan && (
            <Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('table.grid.position')}
                  {!isEdit && ' *'}
                </Typography>
                {gridRow >= 0 && gridCol >= 0 && (
                  <Chip
                    size="small"
                    label={`${t('table.grid.row')} ${gridRow + 1}, ${t('table.grid.col')} ${gridCol + 1}`}
                    color="success"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Legend */}
              <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: 0.5,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t('table.grid.empty')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: 0.5,
                      bgcolor: 'success.main'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {isEdit
                      ? t('table.grid.current')
                      : t('table.grid.selected')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: 0.5,
                      bgcolor: 'error.dark'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t('table.grid.occupied')}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${selectedFloorPlan.gridCols}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(${selectedFloorPlan.gridRows}, ${CELL_SIZE}px)`,
                  gap: '3px',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  maxHeight: 320,
                  overflowY: 'auto',
                  width: 'fit-content',
                  maxWidth: '100%',
                  overflowX: 'auto'
                }}
              >
                {Array.from(
                  {
                    length:
                      selectedFloorPlan.gridRows * selectedFloorPlan.gridCols
                  },
                  (_, idx) => {
                    const row = Math.floor(idx / selectedFloorPlan.gridCols);
                    const col = idx % selectedFloorPlan.gridCols;
                    const key = `${row},${col}`;
                    const isOccupied = occupiedCells.has(key);
                    const isSelected = row === gridRow && col === gridCol;
                    const occupiedLabel = cellLabel.get(key);

                    return (
                      <Tooltip
                        key={key}
                        title={
                          isOccupied
                            ? `${occupiedLabel ?? ''} (${t('table.grid.occupied')})`
                            : isSelected
                              ? `${t('table.grid.selected')}: R${row + 1}, C${col + 1}`
                              : `R${row + 1}, C${col + 1}`
                        }
                        placement="top"
                        arrow
                      >
                        <Box
                          onClick={() => {
                            if (!isOccupied && !isEdit) {
                              setGridRow(row);
                              setGridCol(col);
                            }
                          }}
                          sx={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            borderRadius: '4px',
                            cursor: isEdit
                              ? 'default'
                              : isOccupied
                                ? 'not-allowed'
                                : 'pointer',
                            bgcolor: isOccupied
                              ? 'error.dark'
                              : isSelected
                                ? 'success.main'
                                : 'action.hover',
                            border: '2px solid',
                            borderColor: isSelected
                              ? 'success.light'
                              : isOccupied
                                ? 'error.main'
                                : 'divider',
                            '&:hover': {
                              bgcolor:
                                isEdit || isOccupied
                                  ? undefined
                                  : isSelected
                                    ? 'success.dark'
                                    : 'action.selected'
                            },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                        >
                          {isOccupied && occupiedLabel && (
                            <Typography
                              sx={{
                                fontSize: '0.6rem',
                                color: 'white',
                                fontWeight: 'bold',
                                lineHeight: 1,
                                textAlign: 'center',
                                px: 0.25,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%'
                              }}
                            >
                              {occupiedLabel}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    );
                  }
                )}
              </Box>

              {!isEdit && gridRow === -1 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {t('table.grid.position.helper')}
                </Typography>
              )}
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label={t('table.is.active')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !isValid}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TableDialog;
