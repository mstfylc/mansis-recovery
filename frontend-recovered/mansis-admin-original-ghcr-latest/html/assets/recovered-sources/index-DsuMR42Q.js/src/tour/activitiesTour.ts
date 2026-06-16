import { StepType } from '@reactour/tour';

// Activities table tour steps when there is data
export const activitiesTourStepsWithData: StepType[] = [
  {
    selector: '.activity-filters',
    content: 'tours.activities.filters',
    position: 'bottom'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.activities.select.activities',
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
    selector: '.activity-bulk-actions',
    content: 'tours.activities.bulk.actions',
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
    selector: '.activity-refresh',
    content: 'tours.activities.refresh',
    position: 'left'
  },
  {
    selector: '.activity-row',
    content: 'tours.activities.row',
    position: 'bottom'
  },
  {
    selector: '.activity-image',
    content: 'tours.activities.image',
    position: 'right'
  },
  {
    selector: '.activity-actions',
    content: 'tours.activities.actions',
    position: 'left'
  },
  {
    selector: '.activity-pagination',
    content: 'tours.activities.pagination',
    position: 'top'
  },
  {
    selector: '.activity-add-button',
    content: 'tours.activities.add.button',
    position: 'bottom',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.activity-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.MuiDialog-container .MuiDialog-paper',
    content: 'tours.activities.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.activity-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

// Activities table tour steps when there is no data
export const activitiesTourStepsWithoutData: StepType[] = [
  {
    selector: '.activity-filters',
    content: 'tours.activities.filters',
    position: 'bottom'
  },
  {
    selector: '.activity-refresh',
    content: 'tours.activities.refresh',
    position: 'left'
  },
  {
    selector: '.activity-pagination',
    content: 'tours.activities.pagination',
    position: 'top'
  },
  {
    selector: '.activity-add-button',
    content: 'tours.activities.add.button',
    position: 'bottom',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.activity-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.MuiDialog-container .MuiDialog-paper',
    content: 'tours.activities.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.activity-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

// Activity details tour steps
export const activityDetailsTourSteps: StepType[] = [
  {
    selector: '.activity-back-button',
    content: 'tours.activities.details.back.button',
    position: 'bottom'
  },
  {
    selector: '.activity-info-section',
    content: 'tours.activities.details.info.section',
    position: 'bottom'
  },
  {
    selector: '.activity-child-activities-section',
    content: 'tours.activities.details.child.activities.section',
    position: 'top'
  },
  {
    selector: '.activity-add-child-button',
    content: 'tours.activities.details.add.child.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.activity-add-child-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    },
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.activity-add-child-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

export const activityDetailsTourStepsWithChildActivities: StepType[] = [
  ...activityDetailsTourSteps,
  {
    selector: '.child-activity-card',
    content: 'tours.activities.details.child.card',
    position: 'bottom'
  },
  {
    selector: '.activity-child-edit-button',
    content: 'tours.activities.details.child.edit.button',
    position: 'left'
  },
  {
    selector: '.activity-child-delete-button',
    content: 'tours.activities.details.child.delete.button',
    position: 'left'
  }
];
