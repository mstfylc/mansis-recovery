import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import NumericInput from '../../NumericInput';

interface RecipeTimingFormProps {
  prepTime: number;
  cookTime: number;
  loading: boolean;
  onPrepTimeChange: (value: number) => void;
  onCookTimeChange: (value: number) => void;
}

const RecipeTimingForm = ({
  prepTime,
  cookTime,
  loading,
  onPrepTimeChange,
  onCookTimeChange
}: RecipeTimingFormProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
      <NumericInput
        margin="dense"
        label={t('recipes.form.prepTime')}
        fullWidth
        value={prepTime}
        onChange={onPrepTimeChange}
        disabled={loading}
        min={0}
        helperText={t('recipes.form.timeInMinutes')}
      />

      <NumericInput
        margin="dense"
        label={t('recipes.form.cookTime')}
        fullWidth
        value={cookTime}
        onChange={onCookTimeChange}
        disabled={loading}
        min={0}
        helperText={t('recipes.form.timeInMinutes')}
      />
    </Box>
  );
};

export default RecipeTimingForm;
