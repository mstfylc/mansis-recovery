import { Box, Container, Link, Typography, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

const FooterWrapper = styled(Container)(
  ({ theme }) => `
        margin-top: ${theme.spacing(4)};
`
);

function Footer() {
  const { t } = useTranslation();
  return (
    <FooterWrapper
      disableGutters
      maxWidth={false}
      sx={{ maxWidth: '90%' }}
      className="footer-wrapper"
    >
      <Box
        pb={4}
        display={{ xs: 'block', md: 'flex' }}
        alignItems="center"
        textAlign={{ xs: 'center', md: 'left' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="subtitle1">
            &copy;
            {new Date().getFullYear()} - {t('all.rights.reserved')}
          </Typography>
        </Box>
        <Typography
          sx={{
            pt: { xs: 2, md: 0 }
          }}
          variant="subtitle1"
        >
          {' '}
          <Link target="_blank" rel="noopener noreferrer">
            {t('company.legalName')}
          </Link>
        </Typography>
      </Box>
    </FooterWrapper>
  );
}

export default Footer;
