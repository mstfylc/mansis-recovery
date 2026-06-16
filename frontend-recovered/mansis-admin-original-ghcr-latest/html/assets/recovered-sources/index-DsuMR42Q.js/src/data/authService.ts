import { apiClient, publicApiClient } from './apiService';
import { User } from '@/types/User.interface';
import {
  LOG_IN,
  LOG_OUT,
  SEND_OTP,
  CHANGE_PASSWORD,
  FORGOT_PASSWORD,
  SWITCH_BRANCH,
  USERS
} from './endpoints';

export interface LoginData {
  userLoginData: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SwitchBranchResponse {
  accessToken: string;
  refreshToken: string;
}

export interface OtpResponse {
  status: string | number;
  message: string;
  otp?: string;
}

export interface ForgotPasswordResponse {
  status: string | number;
  message: string;
  isExists: boolean;
}

export const authService = {
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await publicApiClient.post<LoginResponse>(LOG_IN, data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.get(LOG_OUT);
  },

  async sendOtp(data: { phone: string }): Promise<OtpResponse> {
    const response = await publicApiClient.post<OtpResponse>(SEND_OTP, data);
    return response.data;
  },

  async changePassword(data: {
    phone: string;
    newPassword: string;
    otp: string;
  }): Promise<OtpResponse> {
    const response = await publicApiClient.post<OtpResponse>(
      CHANGE_PASSWORD,
      data
    );
    return response.data;
  },

  async forgotPassword(data: {
    phone: string;
  }): Promise<ForgotPasswordResponse> {
    const response = await publicApiClient.post<ForgotPasswordResponse>(
      FORGOT_PASSWORD,
      data
    );
    return response.data;
  },

  async switchBranch(branchId: number | null): Promise<SwitchBranchResponse> {
    const response = await apiClient.post<SwitchBranchResponse>(SWITCH_BRANCH, {
      branchId
    });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(`${USERS}/profile`);
    return response.data;
  }
};
