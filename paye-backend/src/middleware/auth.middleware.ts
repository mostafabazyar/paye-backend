// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      phone: string;
      type?: 'USER' | 'ADMIN' | 'DRAFT' | 'IMPERSONATION';
    };

    // Expose the full decoded payload (id, phone, type) so controllers
    // can branch on token type — e.g. DRAFT vs USER.
    (req as any).user = {
      id: decoded.id,
      phone: decoded.phone,
      type: decoded.type,
    };
    (req as any).userId = decoded.id;

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token' });
  }
};

export default authMiddleware;