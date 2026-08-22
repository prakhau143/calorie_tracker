import { AppError } from '../utils/response.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }
    req[source] = result.data;
    next();
  };
}
