import { styled, alpha, Paper } from '@mui/material';
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';

const SelectorsWrapper = styled(Paper)(
  ({ theme }) => `
    position: absolute;
    top: ${theme.spacing(2)};
    right: ${theme.spacing(2)};
    display: flex;
    gap: ${theme.spacing(1)};
    z-index: 10;
    padding: ${theme.spacing(1)};
    background: ${alpha(theme.palette.background.paper, 0.9)};
    backdrop-filter: blur(5px);
    box-shadow: ${theme.shadows[2]};
    border-radius: ${theme.shape.borderRadius}px;
  `
);

const AuthPageSelectors = () => {
  return (
    <SelectorsWrapper elevation={0}>
      <LanguageSelector />
      <ThemeSelector />
    </SelectorsWrapper>
  );
};

export default AuthPageSelectors;
