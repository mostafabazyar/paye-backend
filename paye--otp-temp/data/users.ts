import { User } from '@/types';

// Simple in-memory user database
// All phone numbers stored WITHOUT +, starting with 0
export const users: User[] = [
  {
    id: 1,
    phone: "09125239708",  // Without + prefix
    password: "user123",
    name: "Test User 1"
  },
  {
    id: 2,
    phone: "09087654321",  // Without + prefix
    password: "pass456",
    name: "Test User 2"
  },
];

// Helper function to normalize phone number
export const normalizePhone = (phone: string): string => {
  // Remove spaces and special characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Remove + at the beginning
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it starts with 98 (Iran country code), convert to 0
  if (cleaned.startsWith('98')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // If it's 10 digits and doesn't start with 0, add 0
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
};

export const findUser = (phone: string, password: string): User | undefined => {
  const normalizedPhone = normalizePhone(phone);
  return users.find(u => u.phone === normalizedPhone && u.password === password);
};

export const getUserByPhone = (phone: string): User | undefined => {
  const normalizedPhone = normalizePhone(phone);
  return users.find(u => u.phone === normalizedPhone);
};

export const addUser = (user: Omit<User, 'id'>): User => {
  const newUser = {
    ...user,
    id: users.length + 1
  };
  users.push(newUser);
  return newUser;
};

// Format phone for display (with 0)
export const formatPhone = (phone: string): string => {
  return normalizePhone(phone);
};