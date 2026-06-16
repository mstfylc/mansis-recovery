import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Footer from '@/components/Footer';
import AuthPageSelectors from '@/components/AuthPageSelectors';

const BaseLayout: FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100vh',
        width: '100%'
      }}
    >
      <AuthPageSelectors />
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default BaseLayout;
