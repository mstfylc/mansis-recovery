import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import { Campaign } from '@/types/Campaign.interface';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { campaignService } from '@/data/campaignService';
import { CampaignType } from '@/enums/campaign-type';
import { BulkActionButtonConfig } from '@/components/BulkActions';
import {
  PRODUCTS,
  CATEGORIES,
  CHILD_ACTIVITIES,
  BRANCHES
} from '@/data/endpoints';
import { Filters } from '@/types/Filters';
import ProductsTable from '@/content/Dashboards/Products/ProductsTable';
import CategoriesTable from '@/content/Management/Categories/CategoriesTable';
import ChildActivitiesTable from '@/content/Management/Activities/ChildActivitiesTable';

interface AddCampaignItemsModalProps {
  open: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onSave: (selectedItems: any[]) => void;
}

const AddCampaignItemsModal: React.FC<AddCampaignItemsModalProps> = ({
  open,
  onClose,
  campaign,
  onSave
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(5);
  const [totalItemsCount, setTotalItemsCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const [addingItems, setAddingItems] = useState<boolean>(false);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedItems([]);
      setPage(0);
      setLimit(5);
      fetchItems({ page, limit });
    }
  }, [open, campaign]);

  const fetchItems = async (filters: Filters = {}) => {
    if (!campaign) return;

    setItemsLoading(true);
    try {
      const queryParams = {
        page: filters.page !== undefined ? filters.page : page,
        limit: filters.limit !== undefined ? filters.limit : limit,
        ...(filters.search && { search: filters.search }),
        status: 'ACTIVE',
        ...(filters.type && { type: filters.type })
      };

      let endpoint = '';
      let response: {
        items: any[];
        total: number;
        page: number;
        limit: number;
      } = {
        items: [],
        total: 0,
        page: 0,
        limit: 0
      };

      let activityParams = { ...queryParams };

      if (!campaign.branch) {
        throw new Error('Campaign branch is undefined');
      }

      // Determine the appropriate endpoint based on campaign type
      switch (campaign.type) {
        case CampaignType.PRODUCT:
        case CampaignType.BUNDLE_PRODUCT:
          endpoint = `${BRANCHES}/${campaign.branch.id}${PRODUCTS}`;
          response = await fetchFromApi(endpoint, queryParams);
          break;
        case CampaignType.CATEGORY:
          endpoint = `${BRANCHES}/${campaign.branch.id}${CATEGORIES}`;
          response = await fetchFromApi(endpoint, queryParams);
          break;
        case CampaignType.ACTIVITY:
        case CampaignType.BUNDLE_ACTIVITY:
          endpoint = `${BRANCHES}/${campaign.branch.id}${CHILD_ACTIVITIES}`;
          response = await fetchFromApi(endpoint, activityParams);
          break;
        default:
          throw new Error('Unsupported campaign type');
      }

      setTotalItemsCount(response.total || 0);
      setItems(response.items || []);
    } catch (err) {
      console.error(
        `Error fetching items for campaign type ${campaign.type}:`,
        err
      );
      setErrorMessage(t('error.loading.items'));
      setOpenNotification(true);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchFromApi = async <T,>(
    endpoint: string,
    params: any
  ): Promise<{ items: T[]; total: number; page: number; limit: number }> => {
    try {
      const responseData = await campaignService.getFromEndpoint(endpoint, {
        page: params?.page || 0,
        limit: params?.limit || 5,
        ...(params?.search && { search: params.search }),
        ...(params?.status && { status: params.status }),
        ...(params?.type && { type: params.type })
      });

      const items = responseData?.items || responseData?.data || [];

      return {
        items,
        total: responseData?.total || 0,
        page: responseData?.page || 0,
        limit: responseData?.limit || params.limit
      };
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  };

  const handleFilterChange = (filters: Filters) => {
    setPage(filters.page || 0);
    setLimit(filters.limit || 5);

    const cleanedFilters = {
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
      type: filters.type
    };

    fetchItems(cleanedFilters);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    setAddingItems(true);
    try {
      onSave(selectedItems);
      onClose();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error adding items to campaign:', error);
      setErrorMessage(t('error.adding.items'));
      setOpenNotification(true);
    } finally {
      setAddingItems(false);
    }
  };

  const handleCloseNotification = () => {
    setOpenNotification(false);
  };

  const getItemTypeName = () => {
    if (!campaign) return t('items');

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
        return t('product.bundles');
      default:
        return t('items');
    }
  };

  const addSelectedItemsButton: BulkActionButtonConfig = {
    label: 'add.selected.items',
    icon: <AddIcon />,
    color: 'primary',
    onClick: handleSubmit,
    showCondition: true,
    loadingState: addingItems,
    disabled: selectedItems.length === 0,
    position: 'left',
    showConfirmDialog: true,
    confirmTitle: t('confirm.add.items.to.campaign'),
    confirmMessage: t('confirm.add.items.to.campaign.question', {
      count: selectedItems.length
    })
  };

  // Render appropriate table based on campaign type
  const renderTable = () => {
    if (!campaign) return null;

    const columnsToHide = ['actions', 'createdAt', 'updatedAt', 'status'];

    switch (campaign.type) {
      case CampaignType.PRODUCT:
      case CampaignType.BUNDLE_PRODUCT:
        return (
          <ProductsTable
            products={items}
            loading={itemsLoading}
            totalCount={totalItemsCount}
            onFilterChange={handleFilterChange}
            tableTitle={t('add.products')}
            hideAddButton={true}
            customButtons={[addSelectedItemsButton]}
            hideDeleteButton={true}
            notApplyPadding={true}
            rowsPerPageOptions={[5, 10]}
            limit={5}
            hideColumns={columnsToHide}
            onSelectedProductsChange={setSelectedItems}
          />
        );

      case CampaignType.CATEGORY:
        return (
          <CategoriesTable
            categories={items}
            loading={itemsLoading}
            totalCount={totalItemsCount}
            onFilterChange={handleFilterChange}
            tableTitle={t('add.categories')}
            hideAddButton={true}
            customButtons={[addSelectedItemsButton]}
            hideDeleteButton={true}
            notApplyPadding={true}
            rowsPerPageOptions={[5, 10]}
            limit={5}
            hideColumns={columnsToHide}
            onSelectedCategoriesChange={setSelectedItems}
            hideStatusFilter={true}
          />
        );

      case CampaignType.ACTIVITY:
      case CampaignType.BUNDLE_ACTIVITY:
        return (
          <ChildActivitiesTable
            childActivities={items}
            loading={itemsLoading}
            totalCount={totalItemsCount}
            onFilterChange={handleFilterChange}
            tableTitle={t('add.child.activity')}
            hideAddButton={true}
            customButtons={[addSelectedItemsButton]}
            hideDeleteButton={true}
            notApplyPadding={true}
            rowsPerPageOptions={[5, 10]}
            limit={5}
            hideColumns={columnsToHide}
            onSelectedChildActivitiesChange={setSelectedItems}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            backgroundImage: 'none',
            boxShadow: theme.shadows[20],
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h4" color="text.primary">
              {t('add.to.campaign', { type: getItemTypeName() })}
            </Typography>
            <IconButton
              edge="end"
              onClick={onClose}
              aria-label="close"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('note.only.active.items')}
          </Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            bgcolor: theme.palette.background.default,
            backgroundImage: 'none',
            overflowX: 'hidden'
          }}
        >
          {renderTable()}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={openNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity="error"
          variant="filled"
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddCampaignItemsModal;
