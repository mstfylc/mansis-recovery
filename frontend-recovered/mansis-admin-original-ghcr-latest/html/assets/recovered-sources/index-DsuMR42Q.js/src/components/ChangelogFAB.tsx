import { Fab, Tooltip, Zoom, useTheme, Box, Badge } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useTranslation } from 'react-i18next';
import { useChangelog } from '@/contexts/ChangelogContext';

export default function ChangelogFAB() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { openDrawer, hasUnread } = useChangelog();

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: theme.spacing(2), sm: theme.spacing(3) },
        bottom: { xs: theme.spacing(3), sm: theme.spacing(2) },
        zIndex: 1050
      }}
    >
      <Zoom in>
        <Tooltip title={t('changelog.whatsNew')} placement="left" arrow>
          <Badge color="error" variant="dot" invisible={!hasUnread}>
            <Fab
              color="primary"
              size="medium"
              onClick={openDrawer}
              sx={{
                boxShadow: 3,
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }}
            >
              <RocketLaunchIcon />
            </Fab>
          </Badge>
        </Tooltip>
      </Zoom>
    </Box>
  );
}
