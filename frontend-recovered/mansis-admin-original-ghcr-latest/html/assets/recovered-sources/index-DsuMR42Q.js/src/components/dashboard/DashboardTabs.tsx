import { SyntheticEvent } from 'react';
import { Box, Tab, Tabs, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';
import InsightsIcon from '@mui/icons-material/Insights';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupWorkIcon from '@mui/icons-material/GroupWork';

interface DashboardTabsProps {
  activeTab: number;
  isBranchAdmin: boolean;
  onTabChange: (event: SyntheticEvent, newValue: number) => void;
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`
  };
}

const TabsContainerWrapper = styled(Box)(
  ({ theme }) => `
      padding: 0 ${theme.spacing(2)};
      position: relative;
      margin-bottom: ${theme.spacing(2)};

      .MuiTabs-scrollableX {
        overflow-x: auto !important;
      }
  `
);

const DashboardTabs = ({
  activeTab,
  isBranchAdmin,
  onTabChange
}: DashboardTabsProps) => {
  const { t } = useTranslation();

  return (
    <TabsContainerWrapper className="dashboard-tabs">
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
        aria-label="dashboard tabs"
      >
        <Tab
          icon={<DashboardIcon />}
          iconPosition="start"
          label={t('dashboard.overview')}
          {...a11yProps(0)}
        />
        <Tab
          icon={<InsightsIcon />}
          iconPosition="start"
          label={t('dashboard.sales.trends')}
          {...a11yProps(1)}
        />
        <Tab
          icon={<BarChartIcon />}
          iconPosition="start"
          label={t('dashboard.top.selling.products')}
          {...a11yProps(2)}
        />
        {!isBranchAdmin && (
          <Tab
            icon={<StorefrontIcon />}
            iconPosition="start"
            label={t('dashboard.branch.performance')}
            {...a11yProps(3)}
          />
        )}
        <Tab
          icon={<PeopleAltIcon />}
          iconPosition="start"
          label={t('dashboard.customer.demographics')}
          {...a11yProps(!isBranchAdmin ? 4 : 3)}
        />
        <Tab
          icon={<GroupWorkIcon />}
          iconPosition="start"
          label={t('dashboard.customer.segmentation')}
          {...a11yProps(!isBranchAdmin ? 5 : 4)}
        />
      </Tabs>
    </TabsContainerWrapper>
  );
};

export default DashboardTabs;
