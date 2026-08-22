import { AppError } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  const status = err instanceof AppError ? err.status : err.status ?? 500;
  const code = err instanceof AppError ? err.code : err.code ?? 'INTERNAL_ERROR';
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ success: false, error: { message, code } });
}
