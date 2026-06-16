import { Box, Typography, Chip, Avatar } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import { useTranslation } from 'react-i18next';
import { NotificationCategory } from '@/types/Notification.interface';

const VARIABLE_REGEX = /({{[^}]+}})/g;

interface NotificationPreviewProps {
  title: string;
  body: string;
  imageUrl?: string;
  category?: NotificationCategory;
}

function NotificationPreview({
  title,
  body,
  imageUrl,
  category
}: NotificationPreviewProps) {
  const { t } = useTranslation();

  const variableLabels: Record<string, string> = {
    '{{userName}}': t('notification.variables.userName'),
    '{{companyName}}': t('notification.variables.companyName'),
    '{{branchName}}': t('notification.variables.branchName')
  };

  const renderWithVariables = (text: string) => {
    const parts = text.split(VARIABLE_REGEX);
    return parts.map((part, i) => {
      const label = variableLabels[part];
      if (label) {
        return (
          <Box
            key={i}
            component="span"
            sx={{
              bgcolor: 'rgba(139, 92, 246, 0.28)',
              color: '#c4b5fd',
              borderRadius: '3px',
              px: '3px',
              fontSize: 'inherit',
              fontWeight: 700,
              border: '1px solid rgba(139, 92, 246, 0.45)',
              lineHeight: 'inherit'
            }}
          >
            {label}
          </Box>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
      <Typography
        variant="caption"
        color="text.secondary"
        textTransform="uppercase"
        letterSpacing={1}
        fontWeight={600}
      >
        {t('notification.preview.title')}
      </Typography>

      {/* Phone shell */}
      <Box
        sx={{
          width: 280,
          borderRadius: '32px',
          bgcolor: '#0f0f1a',
          border: '6px solid #2a2a3d',
          boxShadow: '0 0 0 2px #1a1a2e, 0 24px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Status bar */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2}
          pt={1.5}
          pb={0.5}
          sx={{ position: 'relative' }}
        >
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 11,
              fontWeight: 600
            }}
          >
            9:41
          </Typography>
          {/* Notch */}
          <Box
            sx={{
              width: 56,
              height: 14,
              borderRadius: '0 0 10px 10px',
              bgcolor: '#0f0f1a',
              border: '2px solid #2a2a3d',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: 0
            }}
          />
          <Box display="flex" gap={0.5} alignItems="center">
            <SignalCellularAltIcon
              sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}
            />
            <WifiIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }} />
            <BatteryFullIcon
              sx={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}
            />
          </Box>
        </Box>

        {/* Screen */}
        <Box
          sx={{
            minHeight: 200,
            background:
              'linear-gradient(160deg, #1b1e3a 0%, #12142a 60%, #0d0f1e 100%)',
            px: 1.5,
            pt: 1,
            pb: 2.5
          }}
        >
          {/* Notification card — glass morphism */}
          <Box
            sx={{
              backdropFilter: 'blur(16px)',
              bgcolor: 'rgba(30, 32, 54, 0.92)',
              borderRadius: 2.5,
              p: 1.5,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}
          >
            {/* App row */}
            <Box display="flex" alignItems="center" gap={0.75} mb={0.75}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 18,
                  height: 18,
                  '& svg': { fontSize: 11 }
                }}
              >
                <NotificationsIcon />
              </Avatar>
              <Typography
                sx={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                Posanto
              </Typography>
              {category && (
                <Chip
                  label={t(`notification.category.${category.toLowerCase()}`)}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 9,
                    ml: 'auto',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    '& .MuiChip-label': { px: 0.75 }
                  }}
                />
              )}
            </Box>

            {/* Title */}
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.3,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title
                ? renderWithVariables(title)
                : t('notification.preview.defaultTitle')}
            </Typography>

            {/* Body */}
            <Typography
              sx={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {body
                ? renderWithVariables(body)
                : t('notification.preview.defaultBody')}
            </Typography>

            {imageUrl && (
              <Box
                component="img"
                src={imageUrl}
                alt="notification"
                sx={{
                  mt: 1,
                  width: '100%',
                  borderRadius: 1.5,
                  maxHeight: 100,
                  objectFit: 'cover'
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default NotificationPreview;
