import { StepType } from '@reactour/tour';

export const userManagementTourStepsWithData: StepType[] = [
  {
    selector: '.user-filters',
    content: 'tours.user.management.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.user.management.select.users',
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
    selector: '.user-bulk-actions',
    content: 'tours.user.management.bulk.actions',
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
    selector: '.user-actions',
    content: 'tours.user.management.actions',
    position: 'left'
  },
  {
    selector: '.user-add-button',
    content: 'tours.user.management.add.button',
    position: 'bottom',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.user-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.user-add-dialog',
    content: 'tours.user.management.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector('.user-dialog-cancel-button');
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

export const userManagementTourStepsWithoutData: StepType[] = [
  {
    selector: '.user-filters',
    content: 'tours.user.management.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.user.management.select.users',
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
    content: 'tours.user.management.actions.column',
    position: 'left'
  },
  {
    selector: '.user-add-button',
    content: 'tours.user.management.add.button',
    position: 'bottom',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.user-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.user-add-dialog',
    content: 'tours.user.management.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector('.user-dialog-cancel-button');
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];
