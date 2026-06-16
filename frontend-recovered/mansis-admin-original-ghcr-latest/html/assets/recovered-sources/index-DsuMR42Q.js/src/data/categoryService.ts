import { apiClient } from './apiService';
import { Category } from '@/types/Category.interface';
import { CATEGORIES, UPDATE_STATUS } from './endpoints';

export interface CategoriesResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: number;
  getAll?: boolean;
}

export const categoryService = {
  async getAll(filters: CategoryFilters = {}): Promise<CategoriesResponse> {
    const response = await apiClient.get<CategoriesResponse>(
      CATEGORIES,
      filters
    );
    return response.data;
  },

  async getAllFlat(filters: CategoryFilters = {}): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(CATEGORIES, filters);
    return response.data;
  },

  async create(formData: FormData): Promise<Category> {
    const response = await apiClient.post<Category>(CATEGORIES, formData);
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<Category> {
    const response = await apiClient.patch<Category>(
      `${CATEGORIES}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${CATEGORIES}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${CATEGORIES}/delete`, { categoryIds: ids });
  },

  async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `${CATEGORIES}${UPDATE_STATUS}`,
      { categoryIds: ids, status }
    );
    return response.data;
  }
};
