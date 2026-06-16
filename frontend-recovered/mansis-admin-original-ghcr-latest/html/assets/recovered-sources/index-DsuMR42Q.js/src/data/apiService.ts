import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig as OriginalInternalAxiosRequestConfig
} from 'axios';
import { environments } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';
import { REFRESH_TOKEN } from './endpoints';
import { t } from 'i18next';

interface InternalAxiosRequestConfig
  extends OriginalInternalAxiosRequestConfig {
  _retry?: boolean;
}

export const API_ERROR_EVENT = 'api_error';

interface ApiErrorDetail {
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

export function showApiError(
  message: string,
  severity: ApiErrorDetail['severity'] = 'error'
) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(API_ERROR_EVENT, {
      detail: { message, severity }
    });
    window.dispatchEvent(event);
  }
}

class CustomApiClient {
  private readonly instance: AxiosInstance;
  private navigate: ReturnType<typeof useNavigate> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: environments.backendBaseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  public setAuthHeader(token: string) {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public setNavigate(navigate: ReturnType<typeof useNavigate>) {
    this.navigate = navigate;
  }

  private setupInterceptors() {
    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (token: string) => void;
      reject: (error: Error) => void;
    }> = [];

    const processQueue = (
      error: Error | null | unknown,
      token: string | null
    ) => {
      failedQueue.forEach((promise) => {
        if (token) {
          promise.resolve(token);
        } else {
          promise.reject(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      });
      failedQueue = [];
    };

    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        if (axios.isCancel(error)) {
          showApiError(t('request.canceled'), 'warning');
          return Promise.reject(error);
        }

        const originalRequest = error.config as InternalAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');

            const response = await axios.get(REFRESH_TOKEN, {
              baseURL: environments.backendBaseUrl,
              headers: {
                Authorization: `Bearer ${refreshToken}`
              }
            });

            const newAccessToken = response.data.accessToken;
            localStorage.setItem('access_token', newAccessToken);
            const newRefreshToken = response.data.refreshToken;
            localStorage.setItem('refresh_token', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);

            return this.instance(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);

            if (
              refreshError.response &&
              (refreshError.response.status === 401 ||
                refreshError.response.status === 403)
            ) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');

              if (this.navigate) {
                this.navigate('/auth/login');
              } else {
                window.location.href = '/auth/login';
              }
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        if (error.response?.status === 403) {
          showApiError(t('no.permission.warning'), 'warning');
        } else if (error.response?.status === 404) {
          const errorMessage =
            error.response.data && (error.response.data as any).message
              ? (error.response.data as any).message
              : t('not.found.error');
          showApiError(errorMessage, 'warning');
        } else if (error.response?.status === 500) {
          showApiError(t('server.error'), 'error');
        } else if (error.response?.status === 409) {
          const errorMessage =
            error.response.data && (error.response.data as any).message
              ? (error.response.data as any).message
              : t('conflict.error');
          showApiError(errorMessage, 'warning');
        } else if (error.response?.status === 413) {
          showApiError(t('size.too.large.message'), 'error');
        } else if (error.response?.status === 415) {
          showApiError(t('wrong.file.type.message'), 'error');
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params = {}): Promise<AxiosResponse<T>> {
    const response: AxiosResponse<T> = await this.instance.get(url, {
      params: params
    });
    return response;
  }

  async post<T>(
    url: string,
    data: Record<string, any> | FormData = {}
  ): Promise<AxiosResponse<T>> {
    let config = {};

    if (data instanceof FormData) {
      config = {
        headers: {
          'Content-Type': undefined
        }
      };
    }
    const response: AxiosResponse<T> = await this.instance.post(
      url,
      data,
      config
    );
    return response;
  }

  async put<T>(
    url: string,
    data: Record<string, any> = {}
  ): Promise<AxiosResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.instance.put(url, data);
      return response;
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  }

  async patch<T>(
    url: string,
    data: Record<string, any> | FormData = {}
  ): Promise<AxiosResponse<T>> {
    try {
      let config = {};

      if (data instanceof FormData) {
        config = {
          headers: {
            'Content-Type': undefined
          }
        };
      }
      const response: AxiosResponse<T> = await this.instance.patch(
        url,
        data,
        config
      );
      return response;
    } catch (error) {
      console.error('Error patching data:', error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.instance.delete(
        url,
        config
      );
      return response;
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  }
}

export const apiClient = new CustomApiClient();
export const publicApiClient = axios.create({
  baseURL: environments.backendBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});
