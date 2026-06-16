import { Box, Badge, Typography, styled, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LogoWrapper = styled(Link)(
  ({ theme }) => `
        color: ${theme.palette.text.primary};
        display: inline-flex;
        align-items: center;
        gap: ${theme.spacing(1.5)};
        text-decoration: none;
        width: 100%;
        min-width: 0;
        font-weight: ${theme.typography.fontWeightBold};
	`
);

const LogoSignWrapper = styled(Box)(
  () => `
        width: 52px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
`
);

const LogoImage = styled('img')(
  () => `
        width: 38px;
        height: 38px;
        display: block;
        object-fit: contain;
	`
);

const LogoTitle = styled(Typography)(
  ({ theme }) => `
        color: ${theme.colors.alpha.trueWhite[100]};
        font-size: ${theme.typography.pxToRem(16)};
        font-weight: ${theme.typography.fontWeightBold};
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0;
  `
);

interface LogoProps {
  showTitle?: boolean;
}

function Logo({ showTitle = false }: LogoProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <LogoWrapper to="/" aria-label={t('app.title')}>
      <Badge
        sx={{
          flex: '0 0 auto',
          '.MuiBadge-badge': {
            fontSize: theme.typography.pxToRem(11),
            right: -2,
            top: 8
          }
        }}
        overlap="circular"
        color="success"
        badgeContent="1.0"
      >
        <LogoSignWrapper>
          <LogoImage src="/static/images/logo/posanto-icon.png" alt="Posanto" />
        </LogoSignWrapper>
      </Badge>
      {showTitle && <LogoTitle variant="h6">{t('app.title')}</LogoTitle>}
    </LogoWrapper>
  );
}

export default Logo;
