import { FC, ReactNode, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { validateToken } from '../../utils/auth';
import { UserContext } from '@/contexts/UserContext';
import { CircularProgress, Box } from '@mui/material';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard: FC<AuthGuardProps> = (props) => {
  const { children } = props;
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { isLoading, fetchUserData } = useContext(UserContext);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (!accessToken && !refreshToken) {
          setIsAuthenticated(false);
          setAuthCheckComplete(true);
          return;
        }

        if (validateToken(accessToken)) {
          setIsAuthenticated(true);
          await fetchUserData();
        } else if (refreshToken) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthCheckComplete(true);
      }
    };

    checkAuth();
  }, [location.pathname, fetchUserData]);

  if (!authCheckComplete || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    // Save the location they were trying to access for redirecting after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If authenticated, show the protected content
  return <>{children}</>;
};
