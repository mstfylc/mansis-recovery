import { StepType } from '@reactour/tour';

export const productsTourStepsWithData: StepType[] = [
  {
    selector: '.product-filters',
    content: 'tours.products.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.products.select.products',
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
    selector: '.product-bulk-actions',
    content: 'tours.products.bulk.actions',
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
    selector: '.product-pagination',
    content: 'tours.products.pagination',
    position: 'top'
  },
  {
    selector: '.product-image',
    content: 'tours.products.image',
    position: 'right'
  },
  {
    selector: '.product-actions',
    content: 'tours.products.actions',
    position: 'left'
  },
  {
    selector: '.product-refresh',
    content: 'tours.products.refresh',
    position: 'left'
  },
  {
    selector: '.product-add-button',
    content: 'tours.products.add.button',
    position: 'left',
    action: () => {
      setTimeout(() => {
        const addButton = document.querySelector('.product-add-button');
        if (addButton) {
          (addButton as HTMLElement).click();
        }
      }, 1000);
    }
  },
  {
    selector: '.product-add-dialog',
    content: 'tours.products.add.dialog',
    position: 'right',
    actionAfter: () => {
      const cancelButton = document.querySelector(
        '.product-add-dialog-cancel-button'
      );
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
    }
  }
];

export const productsTourStepsWithoutData: StepType[] = [
  {
    selector: '.product-filters',
    content: 'tours.products.filters',
    position: 'right'
  },
  {
    selector: 'input[type="checkbox"]',
    content: 'tours.products.select.products',
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
    selector: '.product-add-button',
    content: 'tours.products.add.button',
    position: 'left'
  },
  {
    selector: '.product-refresh',
    content: 'tours.products.refresh',
    position: 'left'
  },
  {
    selector: '.product-pagination',
    content: 'tours.products.pagination',
    position: 'top'
  }
];
