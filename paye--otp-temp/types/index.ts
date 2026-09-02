export interface User {
  id: number;
  phone: string;
  password: string;
  name: string;
}

export interface OTP {
  id: string;
  phone: string;
  otp: string;
  expiresAt: string;
  createdAt: string;
  used: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}