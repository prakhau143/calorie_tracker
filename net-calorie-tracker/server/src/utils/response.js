export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
