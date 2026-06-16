import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Paper,
  Stack,
  Divider,
  Typography,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { debounce } from '@/utils/helpers';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/CompanyProducts/Menus/PageHeader';
import MenuList from '@/components/menu/MenuList';
import MenuDetails from '@/components/menu/MenuDetails';
import { useTranslation } from 'react-i18next';
import { menuService } from '@/data/menuService';
import { companyProductService } from '@/data/companyProductService';
import { user$ } from '@/store/userStore';
import {
  CompanyProduct,
  CompanyMenuItem,
  SelectionType
} from '@/types/CompanyProduct.interface';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import GroupManagementDialog from '@/components/dialogs/GroupManagementDialog';
import ItemFormDialog from '@/components/dialogs/ItemFormDialog';
import BulkAddMenuItemsDialog from '@/components/dialogs/BulkAddMenuItemsDialog';
import MenuPreviewDialog from '@/components/dialogs/MenuPreviewDialog';
import CompanyProductDialog from '@/components/modals/CompanyProductDialog';

type PreviewGroup = {
  groupName: string;
  selectionType: 'REQUIRED' | 'OPTIONAL' | 'SELECTABLE';
  minSelection: number;
  maxSelection: number;
  items: Array<{
    id: number;
    name: string;
    basePrice: number;
    extraPrice: number;
    isDefault: boolean;
    sortOrder: number;
    isAvailable: boolean;
    image?: string;
  }>;
};

type MenuPreview = {
  menuId: number;
  groups: PreviewGroup[];
};

type PriceCalculation = {
  menuId: number;
  basePrice?: number;
  finalPrice?: number;
  [key: string]: unknown;
};
type StrategyConstraints = {
  strategy: 'CENTRALIZED' | 'PRICE_FLEXIBLE' | 'MIXED' | 'DECENTRALIZED';
  allowBranchOverrides: boolean;
  allowCustomProducts: boolean;
  requireApproval: boolean;
};

const CompanyMenuManagement: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = user$.get();
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<CompanyProduct[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<CompanyProduct | null>(null);
  const [groupedItems, setGroupedItems] = useState<
    {
      attributeId: number;
      groupName: string;
      selectionType: SelectionType;
      minSelection: number;
      maxSelection: number;
      sortOrder: number;
      items: CompanyMenuItem[];
    }[]
  >([]);
  const [constraints, setConstraints] = useState<StrategyConstraints | null>(
    null
  );
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSearch, setBulkSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState<CompanyProduct[]>(
    []
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<CompanyMenuItem | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkForm, setBulkForm] = useState({
    groupName: '',
    extraPrice: '0'
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<MenuPreview | null>(null);
  const [calcSelections, setCalcSelections] = useState<
    Record<string, number[]>
  >({});
  const [calcResult, setCalcResult] = useState<PriceCalculation | null>(null);
  const [menuPage, setMenuPage] = useState(0);
  const [menuHasMore, setMenuHasMore] = useState(true);
  const MENU_PAGE_SIZE = 20;
  const [menuSearch, setMenuSearch] = useState('');
  const [menuSearchInput, setMenuSearchInput] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    groupName: string;
    selectionType: SelectionType;
    minSelection: number;
    maxSelection: number;
  } | null>(null);
  const [groupForm, setGroupForm] = useState({
    groupName: '',
    selectionType: 'SELECTABLE' as SelectionType,
    minSelection: 1,
    maxSelection: 1,
    sortOrder: 0
  });
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItemInGroup, setEditingItemInGroup] =
    useState<CompanyMenuItem | null>(null);
  const [currentGroupName, setCurrentGroupName] = useState('');
  const [itemForm, setItemForm] = useState({
    selectedItem: null as CompanyProduct | null,
    extraPrice: '0',
    isDefault: false,
    sortOrder: 1
  });
  const [groupConfirmOpen, setGroupConfirmOpen] = useState(false);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<string | null>(
    null
  );
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };
  const showErrorNotification = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };
  const openCreateGroupDialog = () => {
    setEditingGroup(null);
    const maxSortOrder = Math.max(0, ...groupedItems.map((g) => g.sortOrder));
    setGroupForm({
      groupName: '',
      selectionType: 'SELECTABLE',
      minSelection: 1,
      maxSelection: 1,
      sortOrder: maxSortOrder + 1
    });
    setGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: {
    groupName: string;
    selectionType: SelectionType;
    minSelection: number;
    maxSelection: number;
    sortOrder: number;
  }) => {
    setEditingGroup(group);
    setGroupForm({
      groupName: group.groupName,
      selectionType: group.selectionType,
      minSelection: group.minSelection,
      maxSelection: group.maxSelection,
      sortOrder: group.sortOrder
    });
    setGroupDialogOpen(true);
  };

  const closeGroupDialog = () => {
    setGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const onChangeGroupForm = (key: string, value: any) => {
    setGroupForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitGroupDialog = async () => {
    if (!selectedMenu) return;

    try {
      if (editingGroup) {
        await menuService.updateGroup(selectedMenu.id, editingGroup.groupName, {
          newGroupName: groupForm.groupName,
          selectionType: groupForm.selectionType,
          minSelection: groupForm.minSelection,
          maxSelection: groupForm.maxSelection,
          sortOrder: groupForm.sortOrder
        });
        showSuccessNotification(
          t('group.updated.successfully', { groupName: groupForm.groupName })
        );
      } else {
        await menuService.createGroup(selectedMenu.id, groupForm);
        showSuccessNotification(
          t('group.created.successfully', { groupName: groupForm.groupName })
        );
      }
      setGroupDialogOpen(false);
      await fetchItems(selectedMenu.id);
    } catch {
      showErrorNotification(
        editingGroup ? t('group.update.failed') : t('group.create.failed')
      );
    }
  };

  const requestDeleteGroup = (groupName: string) => {
    setPendingDeleteGroup(groupName);
    setGroupConfirmOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!selectedMenu || !pendingDeleteGroup) {
      setGroupConfirmOpen(false);
      setPendingDeleteGroup(null);
      return;
    }

    try {
      await menuService.deleteGroup(selectedMenu.id, pendingDeleteGroup);
      await fetchItems(selectedMenu.id);
      showSuccessNotification(
        t('group.deleted.successfully', { groupName: pendingDeleteGroup })
      );
    } catch {
      showErrorNotification(t('group.delete.failed'));
    } finally {
      setGroupConfirmOpen(false);
      setPendingDeleteGroup(null);
    }
  };
  const getNextAvailableSortOrder = useCallback(
    (groupName: string): number => {
      const currentGroup = groupedItems.find(
        (group) => group.groupName === groupName
      );
      if (!currentGroup || currentGroup.items.length === 0) {
        return 1;
      }

      const existingSortOrders = currentGroup.items.map(
        (item) => item.sortOrder ?? 0
      );
      const maxSortOrder = Math.max(...existingSortOrders);
      return maxSortOrder + 1;
    },
    [groupedItems]
  );

  const getUsedSortOrders = useCallback(
    (groupName: string, excludeItemId?: number): number[] => {
      const currentGroup = groupedItems.find(
        (group) => group.groupName === groupName
      );
      if (!currentGroup) {
        return [];
      }

      return currentGroup.items
        .filter((item) => (excludeItemId ? item.id !== excludeItemId : true))
        .map((item) => item.sortOrder ?? 0)
        .filter((sortOrder) => sortOrder > 0)
        .sort((a, b) => a - b);
    },
    [groupedItems]
  );

  const isSortOrderValid = useCallback(
    (sortOrder: number, groupName: string, excludeItemId?: number): boolean => {
      const usedSortOrders = getUsedSortOrders(groupName, excludeItemId);
      return !usedSortOrders.includes(sortOrder);
    },
    [getUsedSortOrders]
  );
  const openAddItemToGroupDialog = (groupName: string) => {
    setCurrentGroupName(groupName);
    setEditingItemInGroup(null);
    const nextSortOrder = getNextAvailableSortOrder(groupName);
    setItemForm({
      selectedItem: null,
      extraPrice: '0',
      isDefault: false,
      sortOrder: nextSortOrder
    });
    setItemDialogOpen(true);
  };

  const openEditItemDialog = (menuItem: CompanyMenuItem) => {
    setCurrentGroupName(menuItem.groupName);
    setEditingItemInGroup(menuItem);
    setItemForm({
      selectedItem: menuItem.item
        ? ({
            id: menuItem.item.id,
            name: menuItem.item.name,
            basePrice: menuItem.item.basePrice
          } as CompanyProduct)
        : null,
      extraPrice: String(menuItem.extraPrice ?? 0),
      isDefault: !!menuItem.isDefault,
      sortOrder: menuItem.sortOrder ?? 1
    });
    setItemDialogOpen(true);
  };

  const closeItemDialog = () => {
    setItemDialogOpen(false);
    setEditingItemInGroup(null);
    setCurrentGroupName('');
  };

  const onChangeItemForm = (key: string, value: any) => {
    setItemForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitItemDialog = async () => {
    if (!selectedMenu) return;
    const isValid = isSortOrderValid(
      itemForm.sortOrder,
      currentGroupName,
      editingItemInGroup?.id
    );

    if (!isValid) {
      const usedSortOrders = getUsedSortOrders(
        currentGroupName,
        editingItemInGroup?.id
      );
      const nextAvailable = getNextAvailableSortOrder(currentGroupName);
      showErrorNotification(
        t('menu.item.sort.order.duplicate', {
          sortOrder: itemForm.sortOrder,
          usedOrders: usedSortOrders.join(', '),
          nextAvailable
        })
      );
      return;
    }
    const currentGroup = groupedItems.find(
      (g) => g.groupName === currentGroupName
    );
    if (!currentGroup) {
      showErrorNotification(t('group.not.found'));
      return;
    }

    const payloadBase = {
      groupName: currentGroupName,
      extraPrice: parseFloat(itemForm.extraPrice || '0') || 0,
      isDefault: !!itemForm.isDefault,
      sortOrder: itemForm.sortOrder
    };

    try {
      if (editingItemInGroup) {
        await menuService.updateItem(editingItemInGroup.id, payloadBase);
        showSuccessNotification(
          t('menu.item.updated.successfully', {
            itemName: editingItemInGroup.item?.name || t('menu.item')
          })
        );
      } else {
        const payload = {
          attributeId: currentGroup.attributeId,
          productId: itemForm.selectedItem?.id,
          extraPrice: parseFloat(itemForm.extraPrice || '0') || 0,
          isDefault: !!itemForm.isDefault
        };
        await menuService.createItem(selectedMenu.id, payload);
        showSuccessNotification(
          t('menu.item.created.successfully', {
            itemName: itemForm.selectedItem?.name || t('menu.item')
          })
        );
      }
      setItemDialogOpen(false);
      await fetchItems(selectedMenu.id);
    } catch {
      showErrorNotification(
        editingItemInGroup
          ? t('menu.item.update.failed')
          : t('menu.item.create.failed')
      );
    }
  };
  const canManageMenus = useCallback(() => {
    if (!constraints) return true; // Default to true if constraints not loaded
    const userRole = user?.role;
    if (userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN') return true;
    if (userRole === 'BRANCH_ADMIN') {
      return (
        constraints.strategy === 'DECENTRALIZED' ||
        constraints.strategy === 'MIXED' ||
        constraints.allowCustomProducts
      );
    }
    return false;
  }, [constraints, user?.role]);

  const fetchMenus = useCallback(async () => {
    if (menuPage === 0) setLoading(true);
    try {
      const result = await companyProductService.getAll({
        isMenu: true,
        limit: MENU_PAGE_SIZE,
        page: menuPage,
        search: menuSearch
      });
      const list = result.items ?? [];
      setMenus((prev) => (menuPage === 0 ? list : [...prev, ...list]));
      setMenuHasMore(list.length === MENU_PAGE_SIZE);
      if (menuPage === 0) {
        setSelectedMenu((prev) => prev ?? (list.length ? list[0] : null));
      }
    } finally {
      if (menuPage === 0) setLoading(false);
    }
  }, [menuPage, menuSearch]);

  const fetchItems = useCallback(async (menuId: number) => {
    setLoading(true);
    try {
      const result = await menuService.getGroupedItems(menuId);
      setGroupedItems(result?.groups ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreMenus = () => {
    if (!loading && menuHasMore) {
      setMenuPage((prev) => prev + 1);
    }
  };
  const fetchConstraints = useCallback(async () => {
    if (!user?.company?.id) return;
    try {
      const result = await companyProductService.getStrategyConstraints(
        user.company.id
      );
      setConstraints(result);
    } catch (error) {
      console.error('Failed to fetch constraints:', error);
      setConstraints({
        strategy: 'DECENTRALIZED',
        allowBranchOverrides: true,
        allowCustomProducts: true,
        requireApproval: false
      });
    }
  }, [user?.company?.id]);
  const handleChangeBulkForm = (updates: Partial<typeof bulkForm>) => {
    setBulkForm((prev) => ({ ...prev, ...updates }));
  };

  const handleChangeBulkSearch = (value: string) => {
    setBulkSearch(value);
  };
  const performSearch = useCallback((searchTerm: string) => {
    setMenuSearch(searchTerm);
    setMenuPage(0); // Reset pagination when searching
    setMenus([]); // Clear current menus
  }, []);
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  );

  const handleMenuSearchChange = (value: string) => {
    setMenuSearchInput(value);
    debouncedSearch(value);
  };
  const openCreateMenuDialog = () => {
    setCreateMenuOpen(true);
  };

  const closeCreateMenuDialog = () => {
    setCreateMenuOpen(false);
  };

  const handleCreateMenu = async (formData: {
    name: string;
    description: string;
    basePrice: string;
    costPrice?: string;
    pointValue?: number;
    categoryId: number;
    isMenu: boolean;
    isForSale?: boolean;
    status: 'ACTIVE' | 'PASSIVE' | 'PENDING' | 'DELETED';
    companyId: number;
    allowNegativeStock: boolean;
    isStockTracked: boolean;
    trackExpiry: boolean;
    stockUnit: string;
    imageFile?: File;
  }) => {
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('basePrice', formData.basePrice);
      if (formData.costPrice) {
        payload.append('costPrice', formData.costPrice);
      }
      if (formData.pointValue && formData.pointValue > 0) {
        payload.append('pointValue', String(formData.pointValue));
      }
      payload.append('isMenu', 'true'); // Mark as menu
      if (formData.isForSale !== undefined) {
        payload.append('isForSale', String(formData.isForSale));
      }
      payload.append('status', formData.status);
      payload.append('companyId', String(formData.companyId));
      payload.append('categoryId', String(formData.categoryId));
      payload.append('allowNegativeStock', String(formData.allowNegativeStock));
      payload.append('isStockTracked', String(formData.isStockTracked));
      payload.append('trackExpiry', String(formData.trackExpiry));
      payload.append('stockUnit', formData.stockUnit);

      if (formData.imageFile) {
        payload.append('image', formData.imageFile);
      }

      await companyProductService.create(payload);
      setMenuPage(0);
      setMenus([]);
      await fetchMenus();

      setCreateMenuOpen(false);
      setSuccessMessage(t('menu.create.success.message'));
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Failed to create menu:', error);
      if (error.response?.status === 409) {
        setErrorMessage(t('menu.create.error.duplicate'));
      } else {
        setErrorMessage(t('menu.create.error.message'));
      }
      setShowError(true);
    }
  };

  const requestDeleteItem = (menuItem: CompanyMenuItem) => {
    setPendingDeleteItem(menuItem);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMenu || !pendingDeleteItem) {
      setConfirmOpen(false);
      setPendingDeleteItem(null);
      return;
    }
    try {
      await menuService.deleteItem(pendingDeleteItem.id);
      await fetchItems(selectedMenu.id);
      showSuccessNotification(
        t('menu.item.deleted.successfully', {
          itemName: pendingDeleteItem.item?.name || t('menu.item')
        })
      );
    } catch {
      showErrorNotification(t('menu.item.delete.failed'));
    } finally {
      setConfirmOpen(false);
      setPendingDeleteItem(null);
    }
  };
  const openBulkDialog = async () => {
    const firstGroup = groupedItems.length > 0 ? groupedItems[0] : null;
    if (firstGroup) {
      setBulkForm((prev) => ({
        ...prev,
        groupName: firstGroup.groupName
      }));
    }
    setBulkOpen(true);
    setSelectedProductIds([]);
    await fetchAvailableProducts('');
  };

  const fetchAvailableProducts = useCallback(async (term: string) => {
    try {
      const result = await companyProductService.getAll({
        isMenu: false,
        limit: 50,
        search: term
      });
      setAvailableProducts(result.items ?? []);
    } catch (error) {
      console.error('Failed to fetch available products:', error);
      setAvailableProducts([]);
    }
  }, []);

  const toggleSelectProduct = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const submitBulkAdd = async () => {
    if (!selectedMenu || selectedProductIds.length === 0 || !bulkForm.groupName)
      return;

    try {
      const selectedGroup = groupedItems.find(
        (group) => group.groupName === bulkForm.groupName
      );
      if (!selectedGroup) {
        showErrorNotification(t('menu.group.not.found'));
        return;
      }

      const payload = {
        attributeId: selectedGroup.attributeId,
        items: selectedProductIds.map((productId) => ({
          productId: productId,
          extraPrice: parseFloat(bulkForm.extraPrice || '0') || 0,
          isDefault: false
        }))
      };

      await menuService.bulkAddItems(selectedMenu.id, payload);
      setBulkOpen(false);
      setSelectedProductIds([]); // Clear selections
      setBulkForm((prev) => ({ ...prev, extraPrice: '0' })); // Reset extra price
      await fetchItems(selectedMenu.id);
      showSuccessNotification(
        t('menu.items.bulk.added.successfully', {
          count: selectedProductIds.length
        })
      );
    } catch (error) {
      console.error('Bulk add error:', error);
      showErrorNotification(t('menu.items.bulk.add.failed'));
    }
  };
  const openPreviewDialog = async () => {
    if (!selectedMenu) return;
    const result = await menuService.getPreview(selectedMenu.id);
    setPreview(result);
    const defaults: Record<string, number[]> = {};
    result.groups.forEach((menuGroup) => {
      if (menuGroup.selectionType === 'OPTIONAL') {
        defaults[menuGroup.groupName] = [-1];
      } else {
        const defaultItem =
          menuGroup.items.find((item) => item.isDefault) || menuGroup.items[0];
        if (defaultItem) defaults[menuGroup.groupName] = [defaultItem.id];
      }
    });
    setCalcSelections(defaults);
    setCalcResult(null);
    setPreviewOpen(true);
  };

  const handleCalcSelectionChange = (group: string, itemId: number) => {
    if (!preview) return;

    const menuGroup = preview.groups.find((g) => g.groupName === group);
    if (!menuGroup) return;

    setCalcSelections((prev) => {
      const currentSelections = prev[group] || [];

      if (
        menuGroup.selectionType === 'REQUIRED' ||
        menuGroup.selectionType === 'OPTIONAL'
      ) {
        return { ...prev, [group]: [itemId] };
      } else if (menuGroup.selectionType === 'SELECTABLE') {
        const isSelected = currentSelections.includes(itemId);

        if (isSelected) {
          const newSelections = currentSelections.filter((id) => id !== itemId);
          if (newSelections.length >= menuGroup.minSelection) {
            return { ...prev, [group]: newSelections };
          }
          return prev; // Don't allow removal if it would go below minimum
        } else {
          if (currentSelections.length < menuGroup.maxSelection) {
            return { ...prev, [group]: [...currentSelections, itemId] };
          }
          return prev; // Don't allow addition if at maximum
        }
      }

      return prev;
    });
  };

  const submitCalculate = async () => {
    if (!selectedMenu || !preview) return;
    const selections = Object.entries(calcSelections).flatMap(
      ([groupName, itemIds]) => itemIds.map((itemId) => ({ groupName, itemId }))
    );
    const branchId =
      (window as any).globalUserState?.currentBranch?.id?.get?.() ?? undefined;
    const result = await menuService.calculatePrice(
      selectedMenu.id,
      selections,
      branchId
    );
    setCalcResult(result);
  };

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);
  useEffect(() => {
    if (menuPage === 0) {
      fetchMenus();
    }
  }, [menuSearch, fetchMenus, menuPage]);

  useEffect(() => {
    fetchConstraints();
  }, [fetchConstraints]);

  useEffect(() => {
    if (selectedMenu) {
      fetchItems(selectedMenu.id);
    } else {
      setGroupedItems([]);
    }
  }, [selectedMenu]);
  return (
    <>
      <Helmet>
        <title>{t('menu.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Container maxWidth={false} disableGutters sx={{ maxWidth: '95%' }}>
        <Stack spacing={2}>
          <Paper sx={{ p: { xs: 1, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('menu.management')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
              <MenuList
                menus={menus}
                selectedMenu={selectedMenu}
                onSelectMenu={setSelectedMenu}
                onNavigateToDetail={(menu) =>
                  navigate(`/management/company-products/${menu.id}`)
                }
                loading={loading}
                searchInput={menuSearchInput}
                onSearchChange={handleMenuSearchChange}
                onLoadMore={loadMoreMenus}
                onCreateMenu={openCreateMenuDialog}
                canManageMenus={canManageMenus()}
              />

              <MenuDetails
                groupedItems={groupedItems}
                loading={loading}
                canManageMenus={canManageMenus()}
                onCreateGroup={openCreateGroupDialog}
                onBulkAdd={openBulkDialog}
                onPreview={openPreviewDialog}
                onEditGroup={openEditGroupDialog}
                onDeleteGroup={requestDeleteGroup}
                onAddItemToGroup={openAddItemToGroupDialog}
                onEditItem={openEditItemDialog}
                onDeleteItem={requestDeleteItem}
              />
            </Stack>
          </Paper>

          <ConfirmDialog
            open={confirmOpen}
            onClose={() => {
              setConfirmOpen(false);
              setPendingDeleteItem(null);
            }}
            onConfirm={confirmDelete}
            title={t('delete')}
            message={t('menu.delete.item.confirm')}
            confirmButtonText={t('delete')}
            confirmButtonColor="error"
          />

          {/* Group Management Dialog */}
          <GroupManagementDialog
            open={groupDialogOpen}
            onClose={closeGroupDialog}
            onSubmit={submitGroupDialog}
            isEditing={editingGroup !== null}
            form={groupForm}
            onChangeForm={onChangeGroupForm}
          />

          {/* Item Management Dialog */}
          <ItemFormDialog
            open={itemDialogOpen}
            onClose={closeItemDialog}
            onSubmit={submitItemDialog}
            editingItem={editingItemInGroup}
            groupName={currentGroupName}
            form={itemForm}
            onChangeForm={onChangeItemForm}
            availableProducts={availableProducts}
            onFetchAvailableProducts={fetchAvailableProducts}
            usedSortOrders={getUsedSortOrders(
              currentGroupName,
              editingItemInGroup?.id
            )}
            suggestedSortOrder={getNextAvailableSortOrder(currentGroupName)}
          />

          {/* Group Deletion Confirmation */}
          <ConfirmDialog
            open={groupConfirmOpen}
            onClose={() => {
              setGroupConfirmOpen(false);
              setPendingDeleteGroup(null);
            }}
            onConfirm={confirmDeleteGroup}
            title={t('group.delete')}
            message={t('group.delete.confirm', {
              groupName: pendingDeleteGroup
            })}
            confirmButtonText={t('delete')}
            confirmButtonColor="error"
          />

          <BulkAddMenuItemsDialog
            open={bulkOpen}
            onClose={() => setBulkOpen(false)}
            onSubmit={submitBulkAdd}
            bulkForm={bulkForm}
            onChangeBulkForm={handleChangeBulkForm}
            bulkSearch={bulkSearch}
            onChangeBulkSearch={handleChangeBulkSearch}
            availableProducts={availableProducts}
            selectedProductIds={selectedProductIds}
            onToggleSelectProduct={toggleSelectProduct}
            onFetchAvailableProducts={fetchAvailableProducts}
            availableGroups={groupedItems}
          />

          <MenuPreviewDialog
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            onCalculate={submitCalculate}
            selectedMenu={selectedMenu}
            preview={preview}
            calcSelections={calcSelections}
            onCalcSelectionChange={handleCalcSelectionChange}
            calcResult={calcResult}
          />

          {/* Create New Menu Dialog */}
          <CompanyProductDialog
            open={createMenuOpen}
            onClose={closeCreateMenuDialog}
            onSave={handleCreateMenu}
            menuMode={true}
          />

          {/* Success Snackbar */}
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={showSuccess}
            autoHideDuration={6000}
            onClose={() => setShowSuccess(false)}
          >
            <MuiAlert
              variant="filled"
              severity="success"
              onClose={() => setShowSuccess(false)}
            >
              <Typography>{successMessage}</Typography>
            </MuiAlert>
          </Snackbar>

          {/* Error Snackbar */}
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={showError}
            autoHideDuration={6000}
            onClose={() => setShowError(false)}
          >
            <MuiAlert
              variant="filled"
              severity="error"
              onClose={() => setShowError(false)}
            >
              <Typography>{errorMessage}</Typography>
            </MuiAlert>
          </Snackbar>
        </Stack>
      </Container>
    </>
  );
};

export default CompanyMenuManagement;
