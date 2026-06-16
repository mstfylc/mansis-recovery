import { useEffect, useState, SyntheticEvent } from 'react';
import { format } from 'date-fns';
import { user$ } from '@/store/userStore';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Container } from '@mui/material';

import SalesTrendsChart from '../../../components/Chart/SalesTrendsChart';
import TopSellingProductsChart from '../../../components/Chart/TopSellingProductsChart';
import BranchPerformanceChart from '../../../components/Chart/BranchPerformanceChart';
import CustomerDemographicsChart from '../../../components/Chart/CustomerDemographicsChart';
import CustomerSegmentationChart from '../../../components/Chart/CustomerSegmentationChart';
import TabPanel from '../../../components/TabPanel';
import PageTitleWrapper from '../../../components/PageTitleWrapper';
import PageTitle from '../../../components/PageTitle';
import useDateFilter from '../../../hooks/useDateFilter';
import { dashboardService } from '@/data/dashboardService';
import { companyService } from '@/data/companyService';
import { branchService } from '@/data/branchService';
import { Company } from '@/types/Company.interface';
import { Branch } from '@/types/Branch.interface';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { DashboardStats } from '@/types/DashboardStats.interface';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import OverviewTabContent from '@/components/dashboard/OverviewTabContent';

function DashboardMain() {
  const { t } = useTranslation();
  const {
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    isAdminView,
    company,
    currentBranch
  } = useUserViewMode();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSales: 0,
    orderSales: 0,
    cashSales: 0,
    walletSales: 0,
    campaignSales: 0,
    cardSales: 0,
    directSales: 0,
    membershipPurchaseSales: 0,
    physicalCardSales: 0,
    dailyLoginSales: 0,
    dailyLoginCount: 0,
    membershipSales: 0,
    membershipCount: 0,
    ticketSales: 0,
    ticketCount: 0,
    packageSales: 0,
    packageCount: 0,
    pendingOrders: 0,
    readyOrders: 0,
    canceledOrders: 0,
    totalCustomers: 0,
    loyaltyPointsSales: 0,
    loyaltyHybridSales: 0,
    mixedSales: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const { dateRange, getDateRangeParams } = useDateFilter({
    defaultPreset: 'last.30days'
  });

  const { dateRange: overviewDateRange, setDateRange: setOverviewDateRange } =
    useDateFilter({
      defaultPreset: 'last.30days'
    });

  const getAnalyticsScopeLabel = () => {
    if (selectedBranchId) {
      const branchName = branches.find((b) => b.id === selectedBranchId)?.name;
      return t('dashboard.branch.analytics', { branch: branchName });
    } else if (selectedCompanyId) {
      const companyName = companies.find(
        (c) => c.id === selectedCompanyId
      )?.name;
      return t('dashboard.company.analytics', { company: companyName });
    } else {
      return t('dashboard.overall.analytics');
    }
  };

  const fetchCompanies = async () => {
    if (!isSuperAdmin) return;

    try {
      const result = await companyService.getAllFlat({ getAll: true });
      setCompanies(result || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchBranches = async () => {
    if (isBranchAdmin) return;

    try {
      const result = await branchService.getAllFlat({
        getAll: true,
        ...(selectedCompanyId || (!isSuperAdmin && company?.id)
          ? { companyId: selectedCompanyId || company?.id }
          : {})
      });
      setBranches(result || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate, timezone } = getDateRangeParams();

      const result = await dashboardService.getStats({
        ...(selectedBranchId && { branchId: selectedBranchId }),
        ...(selectedCompanyId &&
          !selectedBranchId && { companyId: selectedCompanyId }),
        startDate,
        endDate,
        timezone
      });
      if (result) {
        setStats(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOverviewStats = async () => {
    setIsLoading(true);
    try {
      const startDate = format(overviewDateRange.startDate, 'yyyy-MM-dd');
      const endDate = format(overviewDateRange.endDate, 'yyyy-MM-dd');
      const timezone =
        user$.currentBranch.get()?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const result = await dashboardService.getStats({
        ...(selectedBranchId && { branchId: selectedBranchId }),
        ...(selectedCompanyId &&
          !selectedBranchId && { companyId: selectedCompanyId }),
        startDate,
        endDate,
        timezone
      });
      if (result) {
        setStats(result);
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setSelectedBranchId(null);
  };

  const handleBranchChange = (branchId: number) => {
    setSelectedBranchId(branchId);
  };

  const handleResetFilters = () => {
    setSelectedCompanyId(null);
    setSelectedBranchId(null);
  };

  const handleOverviewRefresh = () => {
    fetchOverviewStats();
  };

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (isCompanyAdmin && company) {
      setSelectedCompanyId(company.id);
    }

    if (isBranchAdmin && currentBranch) {
      setSelectedBranchId(currentBranch.id);
    }

    if (isSuperAdmin) {
      fetchCompanies();
    }

    // Initialize with overview tab data
    fetchOverviewStats();
  }, [isSuperAdmin, isCompanyAdmin, isBranchAdmin, company, currentBranch]);

  useEffect(() => {
    if ((isSuperAdmin && selectedCompanyId) || isCompanyAdmin) {
      fetchBranches();
    }
  }, [selectedCompanyId, isCompanyAdmin, isSuperAdmin]);

  useEffect(() => {
    if (activeTab !== 0) {
      fetchDashboardStats();
    }
  }, [activeTab, dateRange, selectedCompanyId, selectedBranchId]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchOverviewStats();
    }
  }, [activeTab, overviewDateRange, selectedCompanyId, selectedBranchId]);

  return (
    <>
      <Helmet>
        <title>{t('dashboard.main.title')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageTitle
          heading={t('dashboard.welcome')}
          subHeading={t('dashboard.overview')}
        />
      </PageTitleWrapper>
      <Container
        disableGutters
        maxWidth={false}
        sx={{ maxWidth: '90%' }}
        className="dashboard-overview"
      >
        {(isSuperAdmin || (isCompanyAdmin && isAdminView)) && (
          <DashboardFilters
            isSuperAdmin={isSuperAdmin}
            isCompanyAdmin={isCompanyAdmin}
            companies={companies}
            branches={branches}
            selectedCompanyId={selectedCompanyId}
            selectedBranchId={selectedBranchId}
            onCompanyChange={handleCompanyChange}
            onBranchChange={handleBranchChange}
            onResetFilters={handleResetFilters}
          />
        )}

        <Box
          mb={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4" color="text.secondary">
            {getAnalyticsScopeLabel()}
          </Typography>
        </Box>

        <DashboardTabs
          activeTab={activeTab}
          isBranchAdmin={isBranchAdmin}
          onTabChange={handleTabChange}
        />

        <TabPanel value={activeTab} index={0} sx={{ px: 2 }}>
          <OverviewTabContent
            stats={stats}
            isLoading={isLoading}
            dateRange={overviewDateRange}
            onDateRangeChange={setOverviewDateRange}
            onRefresh={handleOverviewRefresh}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <SalesTrendsChart
            companyId={selectedCompanyId}
            branchId={selectedBranchId}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TopSellingProductsChart
            companyId={selectedCompanyId}
            branchId={selectedBranchId}
          />
        </TabPanel>

        {!isBranchAdmin && (
          <TabPanel value={activeTab} index={3}>
            <BranchPerformanceChart companyId={selectedCompanyId} />
          </TabPanel>
        )}

        <TabPanel value={activeTab} index={!isBranchAdmin ? 4 : 3}>
          <CustomerDemographicsChart
            companyId={selectedCompanyId}
            branchId={selectedBranchId}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={!isBranchAdmin ? 5 : 4}>
          <CustomerSegmentationChart
            companyId={selectedCompanyId}
            branchId={selectedBranchId}
          />
        </TabPanel>
      </Container>
    </>
  );
}

export default DashboardMain;
