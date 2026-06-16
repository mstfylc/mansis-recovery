import { apiClient } from './apiService';

export const desktopReleaseService = {
  async getRelease(): Promise<any> {
    const response = await apiClient.get('/desktop-release');
    return response.data;
  }
};
