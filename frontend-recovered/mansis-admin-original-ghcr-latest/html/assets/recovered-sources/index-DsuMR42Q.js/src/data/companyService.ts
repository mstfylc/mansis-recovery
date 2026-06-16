import { apiClient } from './apiService';
import { Company } from '@/types/Company.interface';
import { COMPANIES, COMPANY_SETTINGS, UPDATE_STATUS } from './endpoints';

export interface CompaniesResponse {
  items: Company[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  getAll?: boolean;
}

export const companyService = {
  async getAll(filters: CompanyFilters = {}): Promise<CompaniesResponse> {
    const response = await apiClient.get<CompaniesResponse>(COMPANIES, filters);
    return response.data;
  },

  async getAllFlat(filters: CompanyFilters = {}): Promise<Company[]> {
    const response = await apiClient.get<Company[]>(COMPANIES, filters);
    return response.data;
  },

  async getById(id: number): Promise<Company> {
    const response = await apiClient.get<Company>(`${COMPANIES}/${id}`);
    return response.data;
  },

  async create(formData: FormData): Promise<Company> {
    const response = await apiClient.post<Company>(COMPANIES, formData);
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<Company> {
    const response = await apiClient.patch<Company>(
      `${COMPANIES}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${COMPANIES}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${COMPANIES}/delete`, { companyIds: ids });
  },

  async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `${COMPANIES}${UPDATE_STATUS}`,
      { companyIds: ids, status }
    );
    return response.data;
  },

  async getSettings(companyId: number): Promise<any> {
    const url = COMPANY_SETTINGS.replace(':id', String(companyId));
    const response = await apiClient.get(url);
    return response.data;
  },

  async updateSettings(
    companyId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = COMPANY_SETTINGS.replace(':id', String(companyId));
    const response = await apiClient.patch(url, data);
    return response.data;
  },

  async putSettings(
    companyId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = COMPANY_SETTINGS.replace(':id', String(companyId));
    const response = await apiClient.put(url, data);
    return response.data;
  }
};
