import React, { useState, useEffect, useCallback } from 'react';
import { Campaign } from '@/types/Campaign.interface';
import { CampaignType } from '@/enums/campaign-type';
import ProductsTable from '@/content/Dashboards/Products/ProductsTable';
import CategoriesTable from '@/content/Management/Categories/CategoriesTable';
import { useCampaignItemsList } from '@/hooks/useCampaignItemsList';
import { campaignService } from '@/data/campaignService';
import {
  BUNDLES,
  CAMPAIGNS,
  CATEGORIES,
  CHILD_ACTIVITIES,
  PRODUCTS
} from '@/data/endpoints';
import { Filters } from '@/types/Filters';
import { useTranslation } from 'react-i18next';
import DeleteTwoTone from '@mui/icons-material/DeleteTwoTone';
import { BulkActionButtonConfig } from '@/components/BulkActions';
import ChildActivitiesTable from '@/content/Management/Activities/ChildActivitiesTable';

interface CampaignItemsListProps {
  campaign: Campaign | null;
  onAddItems?: () => void;
  onItemAction?: (item: any, action: 'add' | 'remove') => void;
  onItemsRemoved?: () => Promise<void>;
}

export const CampaignItemsList: React.FC<CampaignItemsListProps> = ({
  campaign,
  onAddItems,
  onItemAction,
  onItemsRemoved
}) => {
  const { t } = useTranslation();
  const tableConfig = useCampaignItemsList({
    campaign,
    onItemAction
  });

  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [key, setKey] = useState<number>(0);

  const forceRemount = useCallback(() => {
    setKey((prevKey) => prevKey + 1);
  }, []);

  const handleRemoveSelectedItems = async () => {
    if (!campaign || !campaign.id || selectedItems.length === 0) return;

    try {
      setIsRemoving(true);

      const removePayload = {
        itemIds: selectedItems.map((item) => item.id)
      };

      // Determine endpoint based on campaign type
      let endpoint = '';
      switch (campaign.type) {
        case CampaignType.PRODUCT:
          endpoint = `${CAMPAIGNS}/${campaign.id}${PRODUCTS}/delete`;
          break;
        case CampaignType.CATEGORY:
          endpoint = `${CAMPAIGNS}/${campaign.id}${CATEGORIES}/delete`;
          break;
        case CampaignType.ACTIVITY:
          endpoint = `${CAMPAIGNS}/${campaign.id}${CHILD_ACTIVITIES}/delete`;
          break;
        case CampaignType.BUNDLE_ACTIVITY:
          endpoint = `${CAMPAIGNS}/${campaign.id}${BUNDLES}/delete`;
          break;
        case CampaignType.BUNDLE_PRODUCT:
          endpoint = `${CAMPAIGNS}/${campaign.id}${BUNDLES}/delete`;
          break;
        default:
          throw new Error('Unsupported campaign type');
      }

      await campaignService.addItemsToEndpoint(endpoint, removePayload);

      setSelectedItems([]);

      await fetchDisplayItems();

      forceRemount();

      if (onItemsRemoved) {
        await onItemsRemoved();
      }
    } catch (err) {
      console.error('Error removing campaign items:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const removeSelectedItemsButton: BulkActionButtonConfig = {
    label: 'delete',
    icon: <DeleteTwoTone />,
    color: 'error',
    onClick: handleRemoveSelectedItems,
    showCondition: selectedItems.length > 0,
    loadingState: isRemoving,
    disabled: selectedItems.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.remove.items'),
    confirmMessage: t('confirm.remove.items.question', {
      count: selectedItems.length
    }),
    variant: 'contained'
  };

  const fetchDisplayItems = async (filters?: Filters) => {
    try {
      setDataLoading(true);

      let entityType: string;
      if (!campaign) {
        return;
      }

      switch (campaign.type) {
        case CampaignType.PRODUCT:
          entityType = 'products';
          break;
        case CampaignType.CATEGORY:
          entityType = 'categories';
          break;
        case CampaignType.ACTIVITY:
          entityType = 'child-activities';
          break;
        case CampaignType.BUNDLE_PRODUCT:
          entityType = 'bundles';
          break;
        case CampaignType.BUNDLE_ACTIVITY:
          entityType = 'bundles';
          break;
        default:
          throw new Error('Unsupported campaign type');
      }

      const queryParams = new URLSearchParams();

      if (filters?.page !== undefined)
        queryParams.append('page', filters.page.toString());
      if (filters?.limit !== undefined)
        queryParams.append('limit', filters.limit.toString());

      if (filters?.search) queryParams.append('search', filters.search);

      // Add filters based on entity type
      const commonFilters = {
        status: filters?.status
      };

      const entityFilters = {
        products: {
          ...commonFilters,
          categoryId: filters?.categoryId?.toString()
        },
        activities: {
          ...commonFilters,
          type: filters?.type
        },
        bundles: {
          ...commonFilters
        },
        categories: commonFilters,
        branches: commonFilters
      };

      const currentFilters =
        entityFilters[entityType as keyof typeof entityFilters] || {};
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `${CAMPAIGNS}/${campaign.id}/${entityType}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const result = await campaignService.getFromEndpoint(endpoint);
      setDisplayItems(result?.items || []);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error fetching campaign items:', error);
      setDisplayItems([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleFilterChange = (filters: Filters) => {
    fetchDisplayItems(filters);
  };

  useEffect(() => {
    setSelectedItems([]);
    fetchDisplayItems();
  }, [campaign]);

  const getDisplayTotalCount = () => {
    return tableConfig.getTotalCount();
  };

  const columnsToHideOnProductTable = [
    'actions',
    'createdAt',
    'updatedAt',
    'status'
  ];

  const columnsToHideOnCategoryTable = [
    'actions',
    'createdAt',
    'updatedAt',
    'numberOfProductsUnderThisCategory',
    'status'
  ];
  const columnsToHideOnChildActivityTable = [
    'actions',
    'createdAt',
    'updatedAt',
    'status'
  ];

  // Render the appropriate table based on campaign type
  if (!campaign) {
    return null;
  }

  switch (campaign.type) {
    case CampaignType.PRODUCT:
    case CampaignType.BUNDLE_PRODUCT:
      return (
        <ProductsTable
          key={`product-table-${key}`}
          products={displayItems}
          loading={dataLoading || isRemoving}
          totalCount={getDisplayTotalCount()}
          onFilterChange={handleFilterChange}
          setShowNewProductDialog={onAddItems || (() => {})}
          customActions={tableConfig.customActions}
          tableTitle={tableConfig.tableTitle}
          hideAddButton={tableConfig.hideAddButton}
          addButtonText={tableConfig.addButtonText || undefined}
          customButtons={[removeSelectedItemsButton]}
          hideDeleteButton={true}
          notApplyPadding={true}
          hideColumns={columnsToHideOnProductTable}
          onSelectedProductsChange={setSelectedItems}
        />
      );

    case CampaignType.CATEGORY:
      return (
        <CategoriesTable
          key={`category-table-${key}`}
          categories={displayItems}
          loading={dataLoading || isRemoving}
          totalCount={getDisplayTotalCount()}
          onFilterChange={handleFilterChange}
          setShowNewCategoryDialog={onAddItems || (() => {})}
          customActions={tableConfig.customActions}
          tableTitle={tableConfig.tableTitle}
          hideAddButton={tableConfig.hideAddButton}
          addButtonText={tableConfig.addButtonText || undefined}
          customButtons={[removeSelectedItemsButton]}
          hideDeleteButton={true}
          notApplyPadding={true}
          hideColumns={columnsToHideOnCategoryTable}
          onSelectedCategoriesChange={setSelectedItems}
        />
      );

    case CampaignType.ACTIVITY:
    case CampaignType.BUNDLE_ACTIVITY:
      return (
        <ChildActivitiesTable
          key={`child-activity-table-${key}`}
          childActivities={displayItems}
          loading={dataLoading || isRemoving}
          totalCount={getDisplayTotalCount()}
          onFilterChange={handleFilterChange}
          setShowNewChildActivityDialog={onAddItems || (() => {})}
          tableTitle={tableConfig.tableTitle}
          hideAddButton={tableConfig.hideAddButton}
          addButtonText={tableConfig.addButtonText || undefined}
          customButtons={[removeSelectedItemsButton]}
          hideDeleteButton={true}
          notApplyPadding={true}
          hideColumns={columnsToHideOnChildActivityTable}
          onSelectedChildActivitiesChange={setSelectedItems}
        />
      );

    default:
      return null;
  }
};
