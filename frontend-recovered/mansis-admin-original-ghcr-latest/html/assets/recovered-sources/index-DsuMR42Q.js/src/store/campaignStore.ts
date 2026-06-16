import { Campaign } from '@/types/Campaign.interface';
import { observable } from '@legendapp/state';

interface CampaignState {
  campaigns: Campaign[];
  totalCount: number;
  selectedCampaign: Campaign | null;
}

export const campaignState$ = observable<CampaignState>({
  campaigns: [],
  totalCount: 0,
  selectedCampaign: null
});

export const setCampaigns = (campaigns: Campaign[], totalCount: number) => {
  campaignState$.set({
    ...campaignState$.get(),
    campaigns,
    totalCount
  });
};

export const setSelectedCampaign = (campaign: Campaign | null) => {
  campaignState$.selectedCampaign.set(campaign);
};

export const clear = () => {
  campaignState$.set({
    campaigns: [],
    totalCount: 0,
    selectedCampaign: null
  });
};
