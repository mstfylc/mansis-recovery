import { StepType } from '@reactour/tour';

export const branchesTourStepsWithData: StepType[] = [
  {
    selector: '.branch-filters',
    content: 'tours.branches.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.branches.select.branches',
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
    selector: '.branch-bulk-actions',
    content: 'tours.branches.bulk.actions',
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
    selector: '.branch-pagination',
    content: 'tours.branches.pagination',
    position: 'top'
  },
  {
    selector: '.branch-refresh',
    content: 'tours.branches.refresh',
    position: 'left'
  },
  {
    selector: '.branch-image',
    content: 'tours.branches.image',
    position: 'right'
  },
  {
    selector: '.branch-actions',
    content: 'tours.branches.actions',
    position: 'left'
  },
  {
    selector: '.branch-add-button',
    content: 'tours.branches.add.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.branch-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.branch-dialog',
    content: 'tours.branches.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.branch-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

export const branchesTourStepsWithoutData: StepType[] = [
  {
    selector: '.branch-filters',
    content: 'tours.branches.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.branches.select.branches',
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
    selector: '.branch-pagination',
    content: 'tours.branches.pagination',
    position: 'top'
  },
  {
    selector: '.branch-refresh',
    content: 'tours.branches.refresh',
    position: 'left'
  },
  {
    selector: '.branch-add-button',
    content: 'tours.branches.add.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.branch-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.branch-dialog',
    content: 'tours.branches.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.branch-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];
