import { StepType } from '@reactour/tour';

export const companiesTourStepsWithData: StepType[] = [
  {
    selector: '.company-filters',
    content: 'tours.companies.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.companies.select.companies',
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
    selector: '.company-bulk-actions',
    content: 'tours.companies.bulk.actions',
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
    selector: '.company-pagination',
    content: 'tours.companies.pagination',
    position: 'top'
  },
  {
    selector: '.company-refresh',
    content: 'tours.companies.refresh',
    position: 'left'
  },
  {
    selector: '.company-image',
    content: 'tours.companies.image',
    position: 'right'
  },
  {
    selector: '.company-actions',
    content: 'tours.companies.actions',
    position: 'left'
  },
  {
    selector: '.company-add-button',
    content: 'tours.companies.add.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.company-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.company-dialog',
    content: 'tours.companies.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.company-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

export const companiesTourStepsWithoutData: StepType[] = [
  {
    selector: '.company-filters',
    content: 'tours.companies.filters',
    position: 'right'
  },
  {
    selector: '.company-pagination',
    content: 'tours.companies.pagination',
    position: 'top'
  },
  {
    selector: '.company-refresh',
    content: 'tours.companies.refresh',
    position: 'left'
  },
  {
    selector: '.company-add-button',
    content: 'tours.companies.add.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.company-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.company-dialog',
    content: 'tours.companies.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.company-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];
