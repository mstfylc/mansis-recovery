import { useContext, useEffect, useState } from 'react';

import {
  Box,
  alpha,
  Stack,
  lighten,
  Divider,
  IconButton,
  Tooltip,
  styled,
  useTheme
} from '@mui/material';
import MenuTwoToneIcon from '@mui/icons-material/MenuTwoTone';
import { SidebarContext } from '@/contexts/SidebarContext';
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';

import HeaderUserbox from './Userbox';
import HeaderMenu from './Menu';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeSelector from '@/components/ThemeSelector';
import QrScannerButton from '@/components/QrScanner/QrScannerButton';
import BranchSelector from '@/components/BranchSelector';
import POSToggleButton from '@/components/POS/POSToggleButton';
import { useObservable } from '@legendapp/state/react';
import { user$ } from '@/store/userStore';
import { Role } from '@/enums/role';
import HeaderNotifications from './Buttons/Notifications';

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
        height: ${theme.header.height};
        color: ${theme.header.textColor};
        padding: ${theme.spacing(0, 2)};
        right: 0;
        z-index: 6;
        background-color: ${alpha(theme.header.background || '#000000', 0.95)};
        backdrop-filter: blur(3px);
        position: fixed;
        justify-content: space-between;
        width: 100%;
        @media (min-width: ${theme.breakpoints.values.lg}px) {
            left: ${theme.sidebar.width};
            width: auto;
        }
`
);

function Header() {
  const { sidebarToggle, toggleSidebar } = useContext(SidebarContext);
  const theme = useTheme();
  const user = useObservable(user$);
  const [showBranchSelector, setShowBranchSelector] = useState(false);

  useEffect(() => {
    const userRole = user.get().role;
    setShowBranchSelector(
      userRole === Role.BRANCH_ADMIN || userRole === Role.COMPANY_ADMIN
    );
  }, [user]);

  return (
    <HeaderWrapper
      display="flex"
      alignItems="center"
      sx={{
        boxShadow:
          theme.palette.mode === 'dark'
            ? `0 1px 0 ${alpha(
                lighten(theme.colors.primary.main, 0.7),
                0.15
              )}, 0px 2px 8px -3px rgba(0, 0, 0, 0.2), 0px 5px 22px -4px rgba(0, 0, 0, .1)`
            : `0px 2px 8px -3px ${alpha(
                theme.colors.alpha.black[100],
                0.2
              )}, 0px 5px 22px -4px ${alpha(
                theme.colors.alpha.black[100],
                0.1
              )}`
      }}
    >
      <Box
        component="span"
        sx={{
          ml: 2,
          display: { lg: 'none', xs: 'inline-block' }
        }}
      >
        <Tooltip arrow title="Toggle Menu">
          <IconButton color="primary" onClick={toggleSidebar}>
            {!sidebarToggle ? (
              <MenuTwoToneIcon fontSize="small" />
            ) : (
              <CloseTwoToneIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        alignItems="center"
        spacing={2}
      >
        <HeaderMenu />
      </Stack>
      <Box display="flex" alignItems="center">
        {showBranchSelector && <BranchSelector />}
        <POSToggleButton />
        <QrScannerButton />
        <LanguageSelector />
        <ThemeSelector />
        <HeaderNotifications />
        <HeaderUserbox />
      </Box>
    </HeaderWrapper>
  );
}

export default Header;
