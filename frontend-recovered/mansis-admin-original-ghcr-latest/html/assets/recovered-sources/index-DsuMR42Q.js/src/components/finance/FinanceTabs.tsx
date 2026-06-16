import { SyntheticEvent, ReactNode } from 'react';
import { Box, Tab, Tabs, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SummarizeIcon from '@mui/icons-material/Summarize';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

interface FinanceTabsProps {
  activeTab: number;
  onTabChange: (event: SyntheticEvent, newValue: number) => void;
  rightControls?: ReactNode;
}

function a11yProps(index: number) {
  return {
    id: `finance-tab-${index}`,
    'aria-controls': `finance-tabpanel-${index}`
  };
}

const TabsContainerWrapper = styled(Box)(
  ({ theme }) => `
      padding: 0 ${theme.spacing(2)};
      position: relative;
      margin-bottom: ${theme.spacing(2)};
      display: flex;
      align-items: center;
      justify-content: space-between;

      .MuiTabs-scrollableX {
        overflow-x: auto !important;
      }
  `
);

const FinanceTabs = ({
  activeTab,
  onTabChange,
  rightControls
}: FinanceTabsProps) => {
  const { t } = useTranslation();

  return (
    <TabsContainerWrapper>
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
        aria-label="finance tabs"
        className="finance-tabs"
      >
        <Tab
          icon={<SummarizeIcon />}
          iconPosition="start"
          label={t('finance.summary')}
          {...a11yProps(0)}
        />
        {/* DISABLED: DailyPayments deprecated - using AccountingLedger instead */}
        {/* <Tab
          icon={<TrendingUpIcon />}
          iconPosition="start"
          label={t('finance.daily.earnings')}
          {...a11yProps(1)}
        /> */}
        <Tab
          icon={<RequestQuoteIcon />}
          iconPosition="start"
          label={t('finance.withdrawal.requests')}
          {...a11yProps(1)}
        />
        <Tab
          icon={<AccountBalanceIcon />}
          iconPosition="start"
          label={t('finance.accounting.ledger')}
          {...a11yProps(2)}
        />
      </Tabs>

      {rightControls && (
        <Box display="flex" alignItems="center" gap={2}>
          {rightControls}
        </Box>
      )}
    </TabsContainerWrapper>
  );
};

export default FinanceTabs;
