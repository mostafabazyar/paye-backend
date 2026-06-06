"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorMiddleware = (err, req, res, next) => {
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
exports.default = errorMiddleware;
