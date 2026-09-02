import axios, { AxiosError } from 'axios';
import { ApiResponse, OTP } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // No response from server
      console.error('No response from server');
    } else {
      // Request setup error
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const fetchOTPByPhone = async (phone: string): Promise<ApiResponse<OTP>> => {
  try {
    const response = await api.get<ApiResponse<OTP>>('/api/otp/view', {
      params: { phone }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching OTP:', error);
    // Return error response instead of throwing
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch OTP'
    };
  }
};

export const fetchAllOTPs = async (): Promise<ApiResponse<OTP[]>> => {
  try {
    const response = await api.get<ApiResponse<OTP[]>>('/api/otp/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching all OTPs:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch OTPs'
    };
  }
};

// Helper function to check if response is successful
export const isSuccessResponse = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } => {
  return response.success === true && response.data !== undefined;
};