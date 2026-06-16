import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
// import DailyPayments from './DailyPayments'; // DISABLED: Deprecated - using AccountingLedger instead
import WithdrawalRequests from './WithdrawalRequests';
import FinanceSummary from './FinanceSummary';
import AccountingLedger from './AccountingLedger';
import FinanceTabs from '@/components/finance/FinanceTabs';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageTitle from '@/components/PageTitle';
import useDateFilter from '@/hooks/useDateFilter';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: Readonly<TabPanelProps>) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`finance-tabpanel-${index}`}
      aria-labelledby={`finance-tab-${index}`}
      {...other}
      style={{ paddingTop: '16px' }}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
}

function FinancePage() {
  const { t } = useTranslation();
  const [tabIndex, setTabIndex] = useState(0);

  const { dateRange } = useDateFilter({
    defaultPreset: 'last.30days'
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <Helmet>
        <title>{t('finance.title')} - Posanto Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <PageTitle
          heading={t('finance.title')}
          subHeading={t('finance.subtitle')}
        />
      </PageTitleWrapper>

      <Container
        disableGutters
        sx={{ maxWidth: '90%', pt: 2 }}
        maxWidth={false}
      >
        <FinanceTabs activeTab={tabIndex} onTabChange={handleTabChange} />

        <TabPanel value={tabIndex} index={0}>
          <FinanceSummary dateRange={dateRange} />
        </TabPanel>
        {/* DISABLED: DailyPayments deprecated - using AccountingLedger instead */}
        {/* <TabPanel value={tabIndex} index={1}>
          <DailyPayments dateRange={dateRange} />
        </TabPanel> */}
        <TabPanel value={tabIndex} index={1}>
          <WithdrawalRequests dateRange={dateRange} />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <AccountingLedger />
        </TabPanel>
      </Container>
    </>
  );
}

export default FinancePage;
