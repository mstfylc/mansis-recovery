import { StepType } from '@reactour/tour';

export const ordersTourStepsWithData: StepType[] = [
  {
    selector: '.order-filters',
    content: 'tours.orders.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.orders.select.orders',
    position: 'bottom',
    action: () => {
      const checkboxes = document.querySelectorAll(
        'tbody input[type="checkbox"]'
      );
      if (checkboxes.length > 0) {
        (checkboxes[0] as HTMLElement).click();
      }
    }
  },
  {
    selector: '.order-bulk-actions',
    content: 'tours.orders.bulk.actions',
    position: 'bottom',
    actionAfter: () => {
      const checkboxes = document.querySelectorAll(
        'tbody input[type="checkbox"]'
      );
      if (checkboxes.length > 0) {
        (checkboxes[0] as HTMLElement).click();
      }
    }
  },
  {
    selector: '.order-search',
    content: 'tours.orders.search',
    position: 'bottom'
  },
  {
    selector: '.order-refresh',
    content: 'tours.orders.refresh',
    position: 'left'
  },
  {
    selector: 'tbody tr',
    content: 'tours.orders.row.click',
    position: 'bottom'
  },
  {
    selector: '.order-pagination',
    content: 'tours.orders.pagination',
    position: 'top'
  }
];

export const ordersTourStepsWithoutData: StepType[] = [
  {
    selector: '.order-filters',
    content: 'tours.orders.filters',
    position: 'right'
  },
  {
    selector: '.order-refresh',
    content: 'tours.orders.refresh',
    position: 'left'
  },
  {
    selector: 'tbody tr',
    content: 'tours.orders.row.click',
    position: 'bottom'
  },
  {
    selector: '.order-pagination',
    content: 'tours.orders.pagination',
    position: 'top'
  }
];
