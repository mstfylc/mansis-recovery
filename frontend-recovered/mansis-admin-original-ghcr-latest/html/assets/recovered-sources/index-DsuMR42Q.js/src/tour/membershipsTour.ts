import { StepType } from '@reactour/tour';

export const membershipsTourStepsWithData: StepType[] = [
  {
    selector: '.membership-filters',
    content: 'tours.memberships.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.memberships.select.memberships',
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
    selector: '.membership-bulk-actions',
    content: 'tours.memberships.bulk.actions',
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
    selector: '.membership-pagination',
    content: 'tours.memberships.pagination',
    position: 'top'
  },
  {
    selector: '.membership-refresh',
    content: 'tours.memberships.refresh',
    position: 'left'
  },
  {
    selector: '.membership-actions',
    content: 'tours.memberships.actions',
    position: 'left'
  }
];

export const membershipsTourStepsWithoutData: StepType[] = [
  {
    selector: '.membership-filters',
    content: 'tours.memberships.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.memberships.select.memberships',
    position: 'bottom',
    action: () => {
      const checkboxes = document.querySelectorAll(
        'tbody input[type="checkbox"]'
      );
      if (checkboxes.length > 0) {
        (checkboxes[0] as HTMLElement).click();
      }
    },
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
    selector: '.membership-pagination',
    content: 'tours.memberships.pagination',
    position: 'top'
  },
  {
    selector: '.membership-refresh',
    content: 'tours.memberships.refresh',
    position: 'left'
  }
];
