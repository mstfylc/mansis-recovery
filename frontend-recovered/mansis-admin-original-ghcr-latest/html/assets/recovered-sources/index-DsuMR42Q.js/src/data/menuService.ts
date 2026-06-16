import { apiClient } from './apiService';
import {
  MENUS,
  MENU_ITEMS_BY_MENU,
  MENU_GROUPED_ITEMS,
  MENU_PREVIEW,
  MENU_CALCULATE_PRICE,
  MENU_BULK_ADD_ITEMS,
  MENU_BRANCH_OVERRIDES,
  BRANCHES
} from './endpoints';

export const menuService = {
  // --- Menu Groups ---

  async getGroupedItems(menuId: number): Promise<any> {
    const url = MENU_GROUPED_ITEMS.replace(':menuId', String(menuId));
    const response = await apiClient.get(url);
    return response.data;
  },

  async createGroup(menuId: number, data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(`${MENUS}/${menuId}/groups`, data);
    return response.data;
  },

  async updateGroup(
    menuId: number,
    groupName: string,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.put(
      `${MENUS}/${menuId}/groups/${encodeURIComponent(groupName)}`,
      data
    );
    return response.data;
  },

  async deleteGroup(menuId: number, groupName: string): Promise<void> {
    await apiClient.delete(
      `${MENUS}/${menuId}/groups/${encodeURIComponent(groupName)}`
    );
  },

  // --- Menu Items ---

  async getItems(menuId: number, params?: Record<string, any>): Promise<any> {
    const url = MENU_ITEMS_BY_MENU.replace(':menuId', String(menuId));
    const response = await apiClient.get(url, params);
    return response.data;
  },

  async createItem(menuId: number, data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(`${MENUS}/${menuId}/items`, data);
    return response.data;
  },

  async updateItem(itemId: number, data: Record<string, any>): Promise<any> {
    const response = await apiClient.put(`${MENUS}/items/${itemId}`, data);
    return response.data;
  },

  async deleteItem(itemId: number): Promise<void> {
    await apiClient.delete(`${MENUS}/items/${itemId}`);
  },

  async bulkAddItems(menuId: number, data: Record<string, any>): Promise<any> {
    const url = MENU_BULK_ADD_ITEMS.replace(':menuId', String(menuId));
    const response = await apiClient.post(url, data);
    return response.data;
  },

  // --- Preview & Price ---

  async getPreview(menuId: number): Promise<any> {
    const url = MENU_PREVIEW.replace(':menuId', String(menuId));
    const response = await apiClient.get(url);
    return response.data;
  },

  async calculatePrice(
    menuId: number,
    selections: any[],
    branchId?: number
  ): Promise<any> {
    const url = MENU_CALCULATE_PRICE.replace(':menuId', String(menuId));
    const fullUrl = branchId ? `${url}?branchId=${branchId}` : url;
    const response = await apiClient.post(fullUrl, selections);
    return response.data;
  },

  // --- Branch Overrides ---

  async getBranchOverrides(params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get(MENU_BRANCH_OVERRIDES, params);
    return response.data;
  },

  async getBranchMenuCategories(
    branchId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(
      `${BRANCHES}/${branchId}/menu-categories`,
      params
    );
    return response.data;
  },

  async getBranchMenuCategoryProducts(
    branchId: number,
    categoryId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(
      `${BRANCHES}/${branchId}/menu-categories/${categoryId}/products`,
      params
    );
    return response.data;
  }
};
