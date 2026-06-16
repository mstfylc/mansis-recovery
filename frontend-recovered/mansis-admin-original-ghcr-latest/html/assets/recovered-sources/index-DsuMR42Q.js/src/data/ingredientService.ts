import { apiClient } from './apiService';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import { COMPANY_PRODUCTS } from './endpoints';

export interface IngredientsResponse {
  items: CompanyProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface IngredientFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
  companyId?: number;
  startDate?: string;
  endDate?: string;
  getAll?: boolean;
}

export const ingredientService = {
  async getAll(filters: IngredientFilters = {}): Promise<IngredientsResponse> {
    const params = {
      ...filters,
      isIngredient: true
    };
    const response = await apiClient.get<IngredientsResponse>(
      COMPANY_PRODUCTS,
      params
    );
    return response.data;
  },

  async getById(id: number): Promise<CompanyProduct> {
    const response = await apiClient.get<CompanyProduct>(
      `${COMPANY_PRODUCTS}/${id}`
    );
    return response.data;
  },

  async create(formData: FormData): Promise<CompanyProduct> {
    formData.set('isIngredient', 'true');
    formData.set('isMenu', 'false');
    if (!formData.has('isForSale')) {
      formData.set('isForSale', 'false');
    }
    const response = await apiClient.post<CompanyProduct>(
      COMPANY_PRODUCTS,
      formData
    );
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<CompanyProduct> {
    formData.set('isIngredient', 'true');
    formData.set('isMenu', 'false');
    if (!formData.has('isForSale')) {
      formData.set('isForSale', 'false');
    }
    const response = await apiClient.patch<CompanyProduct>(
      `${COMPANY_PRODUCTS}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${COMPANY_PRODUCTS}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${COMPANY_PRODUCTS}/delete`, { ids });
  },

  async bulkUpdateStatus(ids: number[], status: string): Promise<void> {
    await apiClient.put(`${COMPANY_PRODUCTS}/update-status`, { ids, status });
  }
};
