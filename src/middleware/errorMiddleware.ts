import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
}

const errorMiddleware = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] Status: ${status}, Message: ${message}`);

  res.status(status).json({
    error: {
      status,
      message
    }
  });
};

export default errorMiddleware;
