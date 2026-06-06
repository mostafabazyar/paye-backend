import { Request, Response } from 'express';

interface UserControllerRequest extends Request {
  userId?: string;
  body: {
    name?: string;
    age?: number;
    gender?: string;
    bio?: string;
    photos?: string[];
  };
  params: {
    id?: string;
  };
}

// Add user controller functions here as needed

export {};
