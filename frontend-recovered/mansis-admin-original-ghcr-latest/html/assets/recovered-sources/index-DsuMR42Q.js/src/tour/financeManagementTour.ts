import { StepType } from '@reactour/tour';

export const financeManagementTourStepsWithData: StepType[] = [
  {
    selector: '.finance-tabs',
    content: 'tours.finance.tabs',
    position: 'bottom'
  },
  {
    selector: '.finance-summary-cards',
    content: 'tours.finance.summary.cards',
    position: 'bottom'
  },
  {
    selector: '.finance-payment-chart',
    content: 'tours.finance.payment.chart',
    position: 'left'
  },
  {
    selector: '.finance-earnings-chart',
    content: 'tours.finance.earnings.chart',
    position: 'right'
  },
  {
    selector: '.finance-withdrawal-cards',
    content: 'tours.finance.withdrawal.cards',
    position: 'left'
  },
  {
    selector: '.finance-refresh-button',
    content: 'tours.finance.refresh.button',
    position: 'left',
    action: () => {
      // Navigate to Daily Earnings tab for the next steps
      const dailyEarningsTab = document.querySelector(
        '[aria-controls="finance-tabpanel-1"]'
      );
      if (dailyEarningsTab) {
        (dailyEarningsTab as HTMLElement).click();
      }
    }
  },
  {
    selector: '.daily-payments-table',
    content: 'tours.finance.daily.payments.table',
    position: 'center'
  },
  {
    selector: '.daily-payments-filters',
    content: 'tours.finance.daily.payments.filters',
    position: 'bottom'
  },
  {
    selector: '.withdrawal-requests-table',
    content: 'tours.finance.withdrawal.requests.table',
    position: 'center'
  },
  {
    selector: '.withdrawal-balance',
    content: 'tours.finance.withdrawal.balance',
    position: 'bottom'
  },
  {
    selector: '.withdrawal-request-button',
    content: 'tours.finance.withdrawal.request.button',
    position: 'bottom'
  },
  {
    selector: '.withdrawal-status-filter',
    content: 'tours.finance.withdrawal.status.filter',
    position: 'bottom'
  }
];

export const financeManagementTourStepsWithoutData: StepType[] = [
  {
    selector: '.finance-tabs',
    content: 'tours.finance.tabs',
    position: 'bottom'
  },
  {
    selector: '.finance-refresh-button',
    content: 'tours.finance.refresh.button',
    position: 'left',
    actionAfter: () => {
      // Navigate to Daily Earnings tab
      const dailyEarningsTab = document.querySelector(
        '[aria-controls="finance-tabpanel-1"]'
      );
      if (dailyEarningsTab) {
        (dailyEarningsTab as HTMLElement).click();
      }
    }
  },
  {
    selector: '.finance-daily-earnings-tab',
    content: 'tours.finance.daily.earnings.tab',
    position: 'center'
  },
  {
    selector: '.daily-payments-filters',
    content: 'tours.finance.daily.payments.filters',
    position: 'bottom',
    actionAfter: () => {
      // Navigate to Withdrawal Requests tab
      const withdrawalRequestsTab = document.querySelector(
        '[aria-controls="finance-tabpanel-2"]'
      );
      if (withdrawalRequestsTab) {
        (withdrawalRequestsTab as HTMLElement).click();
      }
    }
  },
  {
    selector: '.finance-withdrawal-requests-tab',
    content: 'tours.finance.withdrawal.requests.tab',
    position: 'center'
  }
];
