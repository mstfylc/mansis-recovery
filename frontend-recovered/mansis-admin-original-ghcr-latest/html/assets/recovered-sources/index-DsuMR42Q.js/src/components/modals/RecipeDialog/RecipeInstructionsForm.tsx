import { TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface RecipeInstructionsFormProps {
  instructions: string;
  loading: boolean;
  onInstructionsChange: (value: string) => void;
}

const RecipeInstructionsForm = ({
  instructions,
  loading,
  onInstructionsChange
}: RecipeInstructionsFormProps) => {
  const { t } = useTranslation();

  return (
    <TextField
      margin="dense"
      label={t('recipes.form.instructions')}
      type="text"
      fullWidth
      multiline
      rows={4}
      value={instructions}
      onChange={(e) => onInstructionsChange(e.target.value)}
      disabled={loading}
    />
  );
};

export default RecipeInstructionsForm;
