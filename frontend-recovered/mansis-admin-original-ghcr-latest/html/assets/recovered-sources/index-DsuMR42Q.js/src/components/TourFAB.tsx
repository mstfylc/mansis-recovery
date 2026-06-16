import { useState, useEffect } from 'react';
import {
  Fab,
  Tooltip,
  Zoom,
  useTheme,
  Box,
  Badge,
  keyframes
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { TourType, useTourManager } from '../tour/TourManager';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

// Define pulse animation
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

/**
 * A floating action button that provides access to page tours
 * The component automatically determines which tour to show based on the current route
 */
const TourFAB = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const location = useLocation();
  const { startTour } = useTourManager();
  const [hover, setHover] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Check if this is the first visit to this route
  useEffect(() => {
    const visitedRoutes = localStorage.getItem('visitedRoutes');
    const routes = visitedRoutes ? JSON.parse(visitedRoutes) : [];

    if (!routes.includes(location.pathname)) {
      setIsFirstVisit(true);
      routes.push(location.pathname);
      localStorage.setItem('visitedRoutes', JSON.stringify(routes));
    } else {
      setIsFirstVisit(false);
    }
  }, [location.pathname]);

  // Determine which tour to show based on the current route
  const getTourTypeForCurrentRoute = (): TourType => {
    const path = location.pathname;

    // Check for campaign details page first (more specific)
    if (path.match(/\/management\/campaigns\/\d+$/)) {
      return 'campaignDetails';
    } else if (path.match(/\/management\/activities\/\d+$/)) {
      return 'activityDetails';
    } else if (path.includes('/management/campaigns')) {
      return 'campaigns';
    } else if (path.includes('/management/activities')) {
      return 'activities';
    } else if (path.includes('/management/categories')) {
      return 'categories';
    } else if (path.includes('/management/finance')) {
      return 'finance';
    } else if (path.includes('/integrations/adisyo')) {
      return 'adisyo';
    } else if (path.includes('/dashboards/orders')) {
      return 'orders';
    } else if (path.includes('/dashboards/products')) {
      return 'products';
    } else if (path.includes('/dashboards/memberships')) {
      return 'memberships';
    } else if (path.includes('/management/companies')) {
      return 'companies';
    } else if (path.includes('/management/branches')) {
      return 'branches';
    } else if (path.includes('/dashboards')) {
      return 'dashboard';
    } else if (path.includes('/management/users')) {
      return 'userManagement';
    }

    // Default to dashboard tour if no specific tour is found
    return 'dashboard';
  };

  const handleTourStart = () => {
    const tourType = getTourTypeForCurrentRoute();

    // For tours that need to check if there's data in the table
    if (
      tourType === 'userManagement' ||
      tourType === 'orders' ||
      tourType === 'products' ||
      tourType === 'memberships' ||
      tourType === 'companies' ||
      tourType === 'branches' ||
      tourType === 'campaigns' ||
      tourType === 'activities' ||
      tourType === 'categories' ||
      tourType === 'finance'
    ) {
      const tableRows = document.querySelectorAll('tbody tr');
      const noDataRow = document.querySelector('.no-data-row');

      const hasData = tableRows.length > 0 && !noDataRow;
      startTour(tourType, undefined, hasData);
    } else {
      startTour(tourType);
    }

    setIsFirstVisit(false);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: theme.spacing(3),
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1050
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Zoom in={true}>
        <Tooltip title={t('Take a tour')} placement="left" arrow>
          <Badge color="error" variant="dot" invisible={!isFirstVisit}>
            <Fab
              color="primary"
              size="medium"
              onClick={handleTourStart}
              sx={{
                boxShadow: hover ? 8 : 3,
                transition: 'box-shadow 0.3s ease-in-out',
                animation: isFirstVisit ? `${pulse} 1.5s infinite` : 'none',
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }}
            >
              <HelpOutlineIcon />
            </Fab>
          </Badge>
        </Tooltip>
      </Zoom>
    </Box>
  );
};

export default TourFAB;
