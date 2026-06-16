import { FC, useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext';
import {
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
  Box,
  styled,
  useTheme,
  InputAdornment
} from '@mui/material';
import ColorLensOutlinedIcon from '@mui/icons-material/ColorLensOutlined';

const ThemeSelectWrapper = styled(Select<string>)(
  ({ theme }) => `
    background: ${theme.palette.background.paper};
    border-radius: ${theme.shape.borderRadius}px;
    
    .MuiSelect-select {
      padding: 8px;
      padding-right: 28px;
      display: flex;
      align-items: center;
    }
  `
);

const ThemeSelector: FC = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const muiTheme = useTheme();

  const availableThemes = [
    'NebulaFighterTheme',
    'GreenFieldsTheme',
    'DarkSpacesTheme',
    'SunlightTheme'
  ];

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    setTheme(event.target.value);
  };

  // Format theme name by inserting spaces before capital letters and removing "Theme"
  const formatThemeName = (themeName: string): string => {
    return themeName
      .replace(/Theme$/, '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  };

  return (
    <Box pl={2}>
      <ThemeSelectWrapper
        value={theme}
        onChange={handleThemeChange}
        size="small"
        variant="outlined"
        sx={{ minWidth: 150 }}
        startAdornment={
          <InputAdornment position="start" sx={{ margin: 0 }}>
            <ColorLensOutlinedIcon
              sx={{
                color: muiTheme.palette.primary.main,
                fontSize: '1.125rem'
              }}
            />
          </InputAdornment>
        }
      >
        {availableThemes.map((themeName) => (
          <MenuItem key={themeName} value={themeName}>
            <Typography variant="body2">
              {formatThemeName(themeName)}
            </Typography>
          </MenuItem>
        ))}
      </ThemeSelectWrapper>
    </Box>
  );
};

export default ThemeSelector;
