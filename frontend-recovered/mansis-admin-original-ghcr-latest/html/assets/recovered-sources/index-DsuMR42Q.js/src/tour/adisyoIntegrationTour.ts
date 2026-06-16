import { StepType } from '@reactour/tour';

export const getAdisyoIntegrationTourSteps = (): StepType[] => {
  const steps: StepType[] = [
    {
      selector: '.adisyo-tabs',
      content: 'tours.adisyo.navigate.tabs',
      position: 'bottom'
    },
    {
      selector: '.adisyo-overview-card',
      content: 'tours.adisyo.overview.cards',
      position: 'bottom'
    },
    {
      selector: '.adisyo-branch-integration-button',
      content: 'tours.adisyo.branch.integration.button',
      position: 'bottom',
      action: () => {
        // Navigate to Branch Integrations tab
        const branchIntegrationsTab = document.querySelector(
          '[aria-controls="adisyo-tabpanel-1"]'
        );
        if (branchIntegrationsTab) {
          (branchIntegrationsTab as HTMLElement).click();
        }
      }
    },
    {
      selector: '.adisyo-branches-table',
      content: 'tours.adisyo.branches.table',
      position: 'center'
    },
    {
      selector: '.adisyo-status-column',
      content: 'tours.adisyo.status.column',
      position: 'center'
    },
    {
      selector: '.adisyo-setup-button',
      content: 'tours.adisyo.setup.button',
      position: 'center'
    },
    {
      selector: '.adisyo-setup-form',
      content: 'tours.adisyo.setup.form',
      position: 'center'
    }
  ];

  return steps;
};
