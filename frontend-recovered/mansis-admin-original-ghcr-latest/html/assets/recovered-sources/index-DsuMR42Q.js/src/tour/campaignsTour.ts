import { StepType } from '@reactour/tour';

export const campaignsTourStepsWithData: StepType[] = [
  {
    selector: '.campaign-filters',
    content: 'tours.campaigns.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.campaigns.select.campaigns',
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
    selector: '.campaign-bulk-actions',
    content: 'tours.campaigns.bulk.actions',
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
    selector: '.campaign-pagination',
    content: 'tours.campaigns.pagination',
    position: 'top'
  },
  {
    selector: '.campaign-refresh',
    content: 'tours.campaigns.refresh',
    position: 'left'
  },
  {
    selector: '.campaign-image',
    content: 'tours.campaigns.image',
    position: 'right'
  },
  {
    selector: '.campaign-actions',
    content: 'tours.campaigns.actions',
    position: 'left'
  },
  {
    selector: '.campaign-add-button',
    content: 'tours.campaigns.add.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.campaign-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.campaign-dialog',
    content: 'tours.campaigns.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.campaign-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

export const campaignsTourStepsWithoutData: StepType[] = [
  {
    selector: '.campaign-filters',
    content: 'tours.campaigns.filters',
    position: 'right'
  },

  {
    selector: '.campaign-refresh',
    content: 'tours.campaigns.refresh',
    position: 'left'
  },
  {
    selector: '.campaign-pagination',
    content: 'tours.campaigns.pagination',
    position: 'top'
  },
  {
    selector: '.campaign-add-button',
    content: 'tours.campaigns.add.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.campaign-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.campaign-dialog',
    content: 'tours.campaigns.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.campaign-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

// Campaign details tour
export const campaignDetailsTourSteps: StepType[] = [
  {
    selector: '.campaign-back-button',
    content: 'tours.campaigns.details.back.button',
    position: 'bottom'
  },
  {
    selector: '.campaign-info-section',
    content: 'tours.campaigns.details.info.section',
    position: 'bottom'
  },
  {
    selector: '.campaign-image-preview',
    content: 'tours.campaigns.details.image.preview',
    position: 'right'
  },
  {
    selector: '.campaign-stats',
    content: 'tours.campaigns.details.stats',
    position: 'bottom'
  },
  {
    selector: '.campaign-items-list',
    content: 'tours.campaigns.details.items.list',
    position: 'top'
  },
  {
    selector: '.campaign-add-items-button',
    content: 'tours.campaigns.details.add.items',
    position: 'left'
  },
  {
    selector: '.campaign-usages-button',
    content: 'tours.campaigns.details.usages.button',
    position: 'left'
  }
];
