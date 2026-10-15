export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message, details) => new AppError(400, 'BAD_REQUEST', message, details)
export const notFound = (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message)
export const conflict = (code, message, details) => new AppError(409, code, message, details)
export const unprocessable = (message, details) => new AppError(422, 'VALIDATION_ERROR', message, details)