import {
  TextField,
  Autocomplete,
  Box,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { StockUnit } from '@/types/stock';
import NumericInput from '../../NumericInput';

interface RecipeBasicInfoFormProps {
  description: string;
  finishedProduct: Partial<CompanyProduct> | null;
  yieldQuantity: number;
  yieldUnit: StockUnit;
  products: CompanyProduct[];
  loading: boolean;
  fetchingData: boolean;
  isActive: boolean;
  onDescriptionChange: (value: string) => void;
  onFinishedProductChange: (value: Partial<CompanyProduct> | null) => void;
  onYieldQuantityChange: (value: number) => void;
  onYieldUnitChange: (value: StockUnit) => void;
  onIsActiveChange: (value: boolean) => void;
}

const RecipeBasicInfoForm = ({
  description,
  finishedProduct,
  yieldQuantity,
  yieldUnit,
  products,
  loading,
  fetchingData,
  isActive,
  onDescriptionChange,
  onFinishedProductChange,
  onYieldQuantityChange,
  onYieldUnitChange,
  onIsActiveChange
}: RecipeBasicInfoFormProps) => {
  const { t } = useTranslation();

  return (
    <>
      <TextField
        margin="dense"
        label={t('recipes.form.description')}
        type="text"
        fullWidth
        multiline
        rows={2}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        disabled={loading}
      />

      <Autocomplete
        options={products}
        getOptionLabel={(option) => option.name || ''}
        value={finishedProduct}
        onChange={(_, newValue) => onFinishedProductChange(newValue)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            required
            margin="dense"
            label={t('recipes.form.finishedProduct')}
            disabled={fetchingData || loading}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {fetchingData ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }}
          />
        )}
        disabled={loading}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <NumericInput
          required
          margin="dense"
          label={t('recipes.form.yieldQuantity')}
          fullWidth
          value={yieldQuantity}
          onChange={onYieldQuantityChange}
          disabled={loading}
          allowDecimals
          decimalPlaces={2}
          min={0}
        />

        <TextField
          required
          select
          margin="dense"
          label={t('recipes.form.yieldUnit')}
          fullWidth
          value={yieldUnit}
          onChange={(e) => onYieldUnitChange(e.target.value as StockUnit)}
          disabled={loading}
        >
          <MenuItem value={StockUnit.PIECE}>{t('stock.unit.piece')}</MenuItem>
          <MenuItem value={StockUnit.KG}>{t('stock.unit.kg')}</MenuItem>
          <MenuItem value={StockUnit.GRAM}>{t('stock.unit.gram')}</MenuItem>
          <MenuItem value={StockUnit.LITER}>{t('stock.unit.liter')}</MenuItem>
          <MenuItem value={StockUnit.ML}>{t('stock.unit.ml')}</MenuItem>
          <MenuItem value={StockUnit.PORTION}>
            {t('stock.unit.portion')}
          </MenuItem>
        </TextField>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={isActive}
            onChange={(e) => onIsActiveChange(e.target.checked)}
            disabled={loading}
          />
        }
        label={t('recipes.form.active')}
        sx={{ mt: 2 }}
      />
    </>
  );
};

export default RecipeBasicInfoForm;
