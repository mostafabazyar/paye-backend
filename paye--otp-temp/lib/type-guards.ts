import { ApiResponse } from '@/types';

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false; message: string } {
  return response.success === false && typeof response.message === 'string';
}