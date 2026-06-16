import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react';
import { FeatureKey } from '@/types/Licensing.interface';
import { licensingService } from '@/data/licensingService';
import { user$ } from '@/store/userStore';

interface FeatureContextType {
  features: FeatureKey[];
  hasFeature: (feature: FeatureKey) => boolean;
  isLoading: boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

interface FeatureProviderProps {
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({
  children
}) => {
  const [features, setFeatures] = useState<FeatureKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeatures = useCallback(
    async (branchId: number | null | undefined) => {
      try {
        setIsLoading(true);

        if (!branchId) {
          setFeatures([]);
          setIsLoading(false);
          return;
        }

        const result = await licensingService.getFeatures(branchId);

        setFeatures(result?.features || []);
      } catch (error: any) {
        console.error('Failed to fetch branch features:', error);
        setFeatures([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const currentBranch = user$.currentBranch.get();
    const branchId = currentBranch?.id;
    fetchFeatures(branchId);

    const dispose = user$.currentBranch.onChange((change) => {
      fetchFeatures(change.value?.id);
    });

    return dispose;
  }, [fetchFeatures]);

  const hasFeature = (feature: FeatureKey): boolean => {
    return features.includes(feature);
  };

  const refreshFeatures = async () => {
    const currentBranch = user$.currentBranch.get();
    const branchId = currentBranch?.id;
    await fetchFeatures(branchId);
  };

  return (
    <FeatureContext.Provider
      value={{ features, hasFeature, isLoading, refreshFeatures }}
    >
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeature = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider');
  }
  return context;
};
