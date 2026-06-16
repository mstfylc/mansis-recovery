import { StepType } from '@reactour/tour';

export const categoryManagementTourStepsWithData: StepType[] = [
  {
    selector: '.category-filters',
    content: 'tours.categories.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.categories.select.categories',
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
    selector: '.category-bulk-actions',
    content: 'tours.categories.bulk.actions',
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
    selector: '.category-actions',
    content: 'tours.categories.actions',
    position: 'left'
  },
  {
    selector: '.category-add-button',
    content: 'tours.categories.add.button',
    position: 'bottom',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.category-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.category-dialog',
    content: 'tours.categories.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.category-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

export const categoryManagementTourStepsWithoutData: StepType[] = [
  {
    selector: '.category-filters',
    content: 'tours.categories.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.categories.select.categories',
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
    selector: 'th:last-child',
    content: 'tours.categories.actions.column',
    position: 'left'
  },
  {
    selector: '.category-add-button',
    content: 'tours.categories.add.button',
    position: 'bottom',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.category-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.category-dialog',
    content: 'tours.categories.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.category-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];
