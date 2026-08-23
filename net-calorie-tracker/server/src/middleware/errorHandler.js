import { AppError } from '../utils/response.js';

function mapKnownError(err) {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message };
  }
  if (err.name === 'ValidationError') {
    return { status: 400, code: 'VALIDATION_ERROR', message: err.message };
  }
  if (err.name === 'CastError') {
    return { status: 400, code: 'INVALID_ID', message: `Invalid ${err.path}` };
  }
  if (err.code === 11000) {
    return { status: 409, code: 'DUPLICATE', message: 'Duplicate record' };
  }
  return { status: err.status ?? 500, code: err.code ?? 'INTERNAL_ERROR', message: err.message };
}

export function errorHandler(err, req, res, next) {
  const mapped = mapKnownError(err);
  const message = mapped.status === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : mapped.message;

  if (mapped.status === 500) {
    console.error(err);
  }

  res.status(mapped.status).json({ success: false, error: { message, code: mapped.code } });
}
