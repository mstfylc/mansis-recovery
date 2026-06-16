import { Grid, Box, Tabs, Tab } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useState, SyntheticEvent, ReactNode } from 'react';
import { orderService } from '@/data/orderService';
import { campaignService } from '@/data/campaignService';
import { ticketService } from '@/data/ticketService';
import OrdersTable from '@/content/Dashboards/Orders/OrdersTable';
import BundleCampaignsTable from '@/content/Dashboards/Orders/BundleCampaignsTable';
import DailyLoginsTable from '@/content/Dashboards/Orders/DailyLoginsTable';
import TicketsTable from '@/content/Management/Tickets/TicketsTable';
import { Order } from '@/types/Order.interface';
import { BundleCampaignPurchase } from '@/types/BundleCampaignPurchase.interface';
import { DailyLogin } from '@/types/DailyLogin.interface';
import { Ticket } from '@/types/Ticket.interface';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import PageHeader from './PageHeader';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  if (value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`orders-tabpanel-${index}`}
      aria-labelledby={`orders-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `orders-tab-${index}`,
    'aria-controls': `orders-tabpanel-${index}`
  };
}

const OrderManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [bundleCampaigns, setBundleCampaigns] = useState<
    BundleCampaignPurchase[]
  >([]);
  const [bundleCampaignsTotalCount, setBundleCampaignsTotalCount] = useState(0);
  const [dailyLogins, setDailyLogins] = useState<DailyLogin[]>([]);
  const [dailyLoginsTotalCount, setDailyLoginsTotalCount] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsTotalCount, setTicketsTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { currentBranch } = useUserViewMode();

  const fetchOrders = async (params?: Filters) => {
    try {
      setLoading(true);
      const apiParams = transformFiltersToApiParams(params);
      const branchId = currentBranch?.id;
      const result = await orderService.getAll({
        ...apiParams,
        ...(branchId && { branchId })
      });
      setOrders(result.items);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBundleCampaigns = async (params?: Filters) => {
    try {
      setLoading(true);
      const apiParams = transformFiltersToApiParams(params);
      const branchId = currentBranch?.id;
      const result = await campaignService.getBundles({
        ...apiParams,
        ...(branchId && { branchId })
      });
      setBundleCampaigns(result?.items || result || []);
      setBundleCampaignsTotalCount(result?.total || 0);
    } catch (error) {
      console.error('Error fetching bundle campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyLogins = async (params?: Filters) => {
    try {
      setLoading(true);
      const apiParams = transformFiltersToApiParams(params);
      const branchId = currentBranch?.id;
      const result = await orderService.getDailyLogins({
        ...apiParams,
        ...(branchId && { branchId })
      });
      setDailyLogins(result?.items || result || []);
      setDailyLoginsTotalCount(result?.total || 0);
    } catch (error) {
      console.error('Error fetching daily logins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (params?: Filters) => {
    try {
      setLoading(true);
      const apiParams = transformFiltersToApiParams(params);
      const branchId = currentBranch?.id;
      const result = await ticketService.getAll({
        ...apiParams,
        ...(branchId && { branchId })
      });
      setTickets(result?.items || result || []);
      setTicketsTotalCount(result?.total || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: Filters) => {
    if (currentTab === 0) {
      fetchOrders(filters);
    } else if (currentTab === 1) {
      fetchBundleCampaigns(filters);
    } else if (currentTab === 2) {
      fetchDailyLogins(filters);
    } else if (currentTab === 3) {
      fetchTickets(filters);
    }
  };

  const handleBundleCampaignFilterChange = (filters: Filters) => {
    fetchBundleCampaigns(filters);
  };

  const handleDailyLoginFilterChange = (filters: Filters) => {
    fetchDailyLogins(filters);
  };

  const handleTicketFilterChange = (filters: Filters) => {
    fetchTickets(filters);
  };

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <Helmet>
        <title>{t('orders')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Box sx={{ px: 10, pb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          aria-label="orders tabs"
        >
          <Tab label={t('product.orders')} {...a11yProps(0)} />
          <Tab label={t('bundle.campaigns')} {...a11yProps(1)} />
          <Tab label={t('daily.logins')} {...a11yProps(2)} />
          <Tab label={t('tickets')} {...a11yProps(3)} />
        </Tabs>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TabPanel value={currentTab} index={0}>
            <OrdersTable
              orders={orders}
              loading={loading}
              totalCount={totalCount}
              onFilterChange={handleFilterChange}
              pageKey="orders"
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <BundleCampaignsTable
              bundleCampaigns={bundleCampaigns}
              loading={loading}
              totalCount={bundleCampaignsTotalCount}
              onFilterChange={handleBundleCampaignFilterChange}
              pageKey="bundle-campaigns"
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <DailyLoginsTable
              dailyLogins={dailyLogins}
              loading={loading}
              totalCount={dailyLoginsTotalCount}
              onFilterChange={handleDailyLoginFilterChange}
              pageKey="daily-logins"
            />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <TicketsTable
              tickets={tickets}
              loading={loading}
              totalCount={ticketsTotalCount}
              onFilterChange={handleTicketFilterChange}
              pageKey="tickets"
            />
          </TabPanel>
        </Grid>
      </Grid>
    </>
  );
};

export default OrderManagement;
