import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { Campaign } from '@/types/Campaign.interface';
import { CampaignType } from '@/enums/campaign-type';
import { IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ReactNode } from 'react';
import i18next from 'i18next';

interface UseCampaignItemsListProps {
  campaign: Campaign | null;
  onItemAction?: (item: any, action: 'add' | 'remove') => void;
}

interface CampaignItemsListConfig {
  tableTitle: string;
  addButtonText: string | null;
  hideAddButton: boolean;
  customActions: (item: any) => ReactNode;
  getTotalCount: () => number;
}

export const useCampaignItemsList = ({
  campaign,
  onItemAction
}: UseCampaignItemsListProps): CampaignItemsListConfig => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!campaign) {
    return {
      tableTitle: '',
      addButtonText: null,
      hideAddButton: true,
      customActions: () => null,
      getTotalCount: () => 0
    };
  }

  const getTypeName = (): string => {
    switch (campaign.type) {
      case CampaignType.PRODUCT:
        return t('products');
      case CampaignType.CATEGORY:
        return t('categories');
      case CampaignType.ACTIVITY:
        return t('child.activities');
      case CampaignType.BUNDLE_ACTIVITY:
        return t('bundle.activities');
      case CampaignType.BUNDLE_PRODUCT:
        return t('bundle.products');
      default:
        return t('items');
    }
  };

  const getTableTitle = (): string => {
    const currentLanguage = i18next.language || 'en';

    if (campaign.title) {
      if (currentLanguage === 'tr') {
        return `${campaign.title} ${t('campaign.items').toLowerCase()}`;
      }
      return `${getTypeName()} ${t('under')} ${campaign.title}`;
    }

    return getTypeName();
  };

  const getAddButtonText = (): string => {
    switch (campaign.type) {
      case CampaignType.PRODUCT:
        return t('new.product');
      case CampaignType.CATEGORY:
        return t('new.category');
      case CampaignType.ACTIVITY:
        return t('new.child.activity');
      case CampaignType.BUNDLE_ACTIVITY:
        return t('new.bundle.activity');
      case CampaignType.BUNDLE_PRODUCT:
        return t('new.bundle.product');
      default:
        return t('new.item');
    }
  };

  const getTotalCount = (): number => {
    if (!campaign) return 0;

    switch (campaign.type) {
      case CampaignType.PRODUCT:
      case CampaignType.BUNDLE_PRODUCT:
        return campaign.campaignProducts?.length || 0;
      case CampaignType.CATEGORY:
        return campaign.campaignCategories?.length || 0;
      case CampaignType.ACTIVITY:
      case CampaignType.BUNDLE_ACTIVITY:
        return campaign.campaignChildActivities?.length || 0;
      default:
        return 0;
    }
  };

  const customActions = (item: any): ReactNode => {
    return (
      <Tooltip title={t('remove.from.campaign')} arrow>
        <IconButton
          color="error"
          onClick={() => onItemAction?.(item, 'remove')}
          sx={{
            '&:hover': {
              background: theme.colors.error.lighter
            }
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return {
    tableTitle: getTableTitle(),
    addButtonText: getAddButtonText(),
    hideAddButton: false,
    customActions,
    getTotalCount
  };
};
