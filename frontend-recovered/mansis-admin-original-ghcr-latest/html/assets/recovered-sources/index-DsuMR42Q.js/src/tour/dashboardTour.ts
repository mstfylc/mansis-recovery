import { StepType } from '@reactour/tour';
import { user$ } from '@/store/userStore';
import { Role } from '@/enums/role';

export const getDashboardTourSteps = (): StepType[] => {
  const userRole = user$.role.get();
  const isSuperAdmin = userRole === Role.SUPER_ADMIN;
  const isCompanyAdmin = userRole === Role.COMPANY_ADMIN;

  const steps: StepType[] = [
    {
      selector: '.dashboard-overview',
      content: 'tours.dashboard.welcome'
    },
    {
      selector: '.dashboard-tabs',
      content: 'tours.dashboard.tabs'
    },
    ...(isSuperAdmin
      ? [
          {
            selector: '.dashboard-filters',
            content: 'tours.dashboard.company.branch.filters'
          }
        ]
      : []),
    ...(isCompanyAdmin
      ? [
          {
            selector: '.dashboard-filters',
            content: 'tours.dashboard.branch.filters'
          }
        ]
      : []),
    {
      selector: '.date-filter-bar',
      content: 'tours.dashboard.date.filters'
    }
  ];

  return steps;
};

export const dashboardTourSteps = getDashboardTourSteps();
