import { User } from '@/types';

// Simple in-memory user database
// In production, this would be replaced with a real backend
export const users: User[] = [
  {
    id: 1,
    phone: "+1234567890",
    password: "user123",
    name: "Test User 1"
  },
  {
    id: 2,
    phone: "+0987654321",
    password: "pass456",
    name: "Test User 2"
  },
  {
    id: 3,
    phone: "+1122334455",
    password: "demo789",
    name: "Demo User"
  }
];

export const findUser = (phone: string, password: string): User | undefined => {
  return users.find(u => u.phone === phone && u.password === password);
};

export const getUserByPhone = (phone: string): User | undefined => {
  return users.find(u => u.phone === phone);
};

export const addUser = (user: Omit<User, 'id'>): User => {
  const newUser = {
    ...user,
    id: users.length + 1
  };
  users.push(newUser);
  return newUser;
};