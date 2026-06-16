import { FC, useState, useEffect } from 'react';
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
  Switch
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '@/components/NumericInput';
import type { FloorPlan, CreateFloorPlanData } from '@/types/Table.interface';

interface FloorPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateFloorPlanData & { isActive?: boolean }) => Promise<void>;
  floorPlan?: FloorPlan | null;
  error?: string;
  nextSortOrder?: number;
}

const FloorPlanDialog: FC<FloorPlanDialogProps> = ({
  open,
  onClose,
  onSave,
  floorPlan,
  error,
  nextSortOrder = 0
}) => {
  const { t } = useTranslation();
  const isEdit = !!floorPlan;

  const [name, setName] = useState('');
  const [gridRows, setGridRows] = useState<number>(8);
  const [gridCols, setGridCols] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (floorPlan) {
      setName(floorPlan.name);
      setGridRows(floorPlan.gridRows);
      setGridCols(floorPlan.gridCols);
      setSortOrder(floorPlan.sortOrder);
      setIsActive(floorPlan.isActive);
    } else {
      setName('');
      setGridRows(8);
      setGridCols(10);
      setSortOrder(nextSortOrder);
      setIsActive(true);
    }
    setLoading(false);
  }, [floorPlan, open]);

  const isValid = name.trim().length > 0 && gridRows >= 1 && gridCols >= 1;

  const handleSubmit = async () => {
    if (loading || !isValid) return;
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        gridRows,
        gridCols,
        sortOrder,
        isActive
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t('table.edit.floor.plan') : t('table.create.floor.plan')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label={t('table.floor.plan.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            variant="outlined"
            inputProps={{ maxLength: 100 }}
          />

          <NumericInput
            label={t('table.floor.plan.grid.rows')}
            value={gridRows}
            onChange={(val) => setGridRows(val)}
            min={1}
            max={30}
            allowDecimals={false}
          />

          <NumericInput
            label={t('table.floor.plan.grid.cols')}
            value={gridCols}
            onChange={(val) => setGridCols(val)}
            min={1}
            max={30}
            allowDecimals={false}
          />

          <NumericInput
            label={t('table.floor.plan.sort.order')}
            value={sortOrder}
            onChange={(val) => setSortOrder(val)}
            min={0}
            max={9999}
            allowDecimals={false}
          />

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

export default FloorPlanDialog;
