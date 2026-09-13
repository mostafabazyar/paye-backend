import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

const impersonationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== "IMPERSONATION") {
      return res.status(403).json({
        success: false,
        message: "Impersonation token required",
      });
    }

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid impersonation token",
      });
    }

    if (!decoded.impersonatedBy) {
      return res.status(401).json({
        success: false,
        message: "Invalid impersonation token",
      });
    }

    (req as any).user = decoded;
    (req as any).userId = decoded.id;
    (req as any).impersonatedBy = decoded.impersonatedBy;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired impersonation token",
    });
  }
};

export default impersonationMiddleware;