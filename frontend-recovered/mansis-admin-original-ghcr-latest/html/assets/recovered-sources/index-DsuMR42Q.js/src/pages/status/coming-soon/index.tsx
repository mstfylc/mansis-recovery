/* eslint-disable react/no-unescaped-entities */
import { JSX, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  IconButton,
  Tooltip,
  styled
} from '@mui/material';

import { Helmet } from 'react-helmet-async';
import Logo from '@/components/LogoSign';

import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useTranslation } from 'react-i18next';

const MainContent = styled(Box)(
  () => `
    height: 100%;
    display: flex;
    flex: 1;
    flex-direction: column;
`
);

const TopWrapper = styled(Box)(
  ({ theme }) => `
  display: flex;
  width: 100%;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing(6)};
`
);

const TypographyH1 = styled(Typography)(
  ({ theme }) => `
  font-size: ${theme.typography.pxToRem(75)};
`
);

const TypographyH3 = styled(Typography)(
  ({ theme }) => `
  color: ${theme.colors.alpha.black[50]};
`
);

interface TimeLeft {
  [key: string]: number;
}

function StatusComingSoon() {
  const calculateTimeLeft = () => {
    const difference = +new Date(`2023`) - +new Date();
    let timeLeft: TimeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: JSX.Element[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <Box key={interval} textAlign="center" px={3}>
        <TypographyH1 variant="h1">{timeLeft[interval]}</TypographyH1>
        <TypographyH3 variant="h3">{interval}</TypographyH3>
      </Box>
    );
  });
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('coming.soon')}</title>
      </Helmet>
      <MainContent>
        <TopWrapper>
          <Container maxWidth="md">
            <Logo />
            <Box textAlign="center" mb={3}>
              <Container maxWidth="xs">
                <Typography variant="h1" sx={{ mt: 4, mb: 2 }}>
                  {t('coming.soon')}
                </Typography>
                <Typography
                  variant="h3"
                  color="text.secondary"
                  fontWeight="normal"
                  sx={{ mb: 4 }}
                >
                  {t('coming.soon.description')}
                </Typography>
              </Container>
              <img
                alt="Coming Soon"
                height={200}
                src="/static/images/status/coming-soon.svg"
              />
            </Box>

            <Box display="flex" justifyContent="center">
              {timerComponents.length ? timerComponents : <>Time's up!</>}
            </Box>

            <Container maxWidth="sm">
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Tooltip arrow placement="top" title="Facebook">
                    <IconButton color="primary">
                      <FacebookIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip arrow placement="top" title="Twitter">
                    <IconButton color="primary">
                      <TwitterIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip arrow placement="top" title="Instagram">
                    <IconButton color="primary">
                      <InstagramIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Container>
          </Container>
        </TopWrapper>
      </MainContent>
    </>
  );
}

export default StatusComingSoon;
