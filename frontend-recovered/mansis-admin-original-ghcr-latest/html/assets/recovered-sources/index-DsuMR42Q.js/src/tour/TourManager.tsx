import { useState, createContext, useContext, ReactNode } from 'react';
import { StepType, useTour } from '@reactour/tour';
import {
  dashboardTourSteps,
  userManagementTourStepsWithData,
  userManagementTourStepsWithoutData,
  ordersTourStepsWithData,
  ordersTourStepsWithoutData,
  productsTourStepsWithData,
  productsTourStepsWithoutData,
  membershipsTourStepsWithData,
  membershipsTourStepsWithoutData,
  companiesTourStepsWithData,
  companiesTourStepsWithoutData,
  branchesTourStepsWithData,
  branchesTourStepsWithoutData,
  campaignsTourStepsWithData,
  campaignsTourStepsWithoutData,
  campaignDetailsTourSteps,
  activitiesTourStepsWithData,
  activitiesTourStepsWithoutData,
  activityDetailsTourSteps,
  activityDetailsTourStepsWithChildActivities,
  categoryManagementTourStepsWithData,
  categoryManagementTourStepsWithoutData,
  financeManagementTourStepsWithData,
  financeManagementTourStepsWithoutData,
  getAdisyoIntegrationTourSteps
} from './index';
import { useTranslation } from 'react-i18next';

// Define the available tour types
export type TourType =
  | 'dashboard'
  | 'userManagement'
  | 'custom'
  | 'orders'
  | 'products'
  | 'memberships'
  | 'companies'
  | 'branches'
  | 'campaigns'
  | 'campaignDetails'
  | 'activities'
  | 'activityDetails'
  | 'categories'
  | 'finance'
  | 'adisyo';

// Define the context type
interface TourManagerContextType {
  startTour: (
    tourType: TourType,
    customSteps?: StepType[],
    hasData?: boolean
  ) => void;
  endTour: () => void;
  currentTour: TourType | null;
}

// Create the context
const TourManagerContext = createContext<TourManagerContextType | undefined>(
  undefined
);

// Custom hook to use the tour manager
export const useTourManager = () => {
  const context = useContext(TourManagerContext);
  if (!context) {
    throw new Error('useTourManager must be used within a TourManagerProvider');
  }
  return context;
};

interface TourManagerProviderProps {
  children: ReactNode;
}

export const TourManagerProvider = ({ children }: TourManagerProviderProps) => {
  const [currentTour, setCurrentTour] = useState<TourType | null>(null);
  const { setIsOpen, setSteps, setCurrentStep } = useTour();
  const { t, ready } = useTranslation();

  const ensureTranslationsInSteps = (steps: StepType[]): StepType[] => {
    return steps.map((step) => {
      return {
        ...step,
        content:
          typeof step.content === 'string' ? t(step.content) : step.content
      };
    });
  };

  const startTour = (
    tourType: TourType,
    customSteps?: StepType[],
    hasData?: boolean
  ) => {
    let steps: StepType[] = [];

    const childActivityCards = document.querySelectorAll(
      '.child-activity-card'
    );
    const hasChildActivities = childActivityCards.length > 0;

    switch (tourType) {
      case 'dashboard':
        steps = dashboardTourSteps;
        break;
      case 'userManagement':
        steps = hasData
          ? userManagementTourStepsWithData
          : userManagementTourStepsWithoutData;
        break;
      case 'orders':
        steps = hasData ? ordersTourStepsWithData : ordersTourStepsWithoutData;
        break;
      case 'products':
        steps = hasData
          ? productsTourStepsWithData
          : productsTourStepsWithoutData;
        break;
      case 'memberships':
        steps = hasData
          ? membershipsTourStepsWithData
          : membershipsTourStepsWithoutData;
        break;
      case 'companies':
        steps = hasData
          ? companiesTourStepsWithData
          : companiesTourStepsWithoutData;
        break;
      case 'branches':
        steps = hasData
          ? branchesTourStepsWithData
          : branchesTourStepsWithoutData;
        break;
      case 'campaigns':
        steps = hasData
          ? campaignsTourStepsWithData
          : campaignsTourStepsWithoutData;
        break;
      case 'campaignDetails':
        steps = campaignDetailsTourSteps;
        break;
      case 'activities':
        steps = hasData
          ? activitiesTourStepsWithData
          : activitiesTourStepsWithoutData;
        break;
      case 'activityDetails':
        steps = hasChildActivities
          ? activityDetailsTourStepsWithChildActivities
          : activityDetailsTourSteps;
        break;
      case 'categories':
        steps = hasData
          ? categoryManagementTourStepsWithData
          : categoryManagementTourStepsWithoutData;
        break;
      case 'finance':
        steps = hasData
          ? financeManagementTourStepsWithData
          : financeManagementTourStepsWithoutData;
        break;
      case 'adisyo':
        steps = getAdisyoIntegrationTourSteps();
        break;
      default:
        if (customSteps) {
          steps = customSteps;
        }
        break;
    }

    // Ensure translations are properly loaded
    if (ready) {
      steps = ensureTranslationsInSteps(steps);
    }

    if (setSteps && steps.length > 0) {
      setSteps(steps);
      setCurrentStep?.(0);
      setIsOpen?.(true);
      setCurrentTour(tourType);
    }
  };

  const endTour = () => {
    setIsOpen?.(false);
    setCurrentTour(null);
  };

  return (
    <TourManagerContext.Provider value={{ startTour, endTour, currentTour }}>
      {children}
    </TourManagerContext.Provider>
  );
};
