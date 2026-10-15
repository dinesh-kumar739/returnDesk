import { AppError } from './errors.js'

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

function send(res, status, code, message, details) {
  const error = { code, message }
  if (details !== undefined) error.details = details
  res.status(status).json({ error })
}

export function notFoundHandler(req, res) {
  send(res, 404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} does not exist`)
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  if (err instanceof AppError) return send(res, err.status, err.code, err.message, err.details)
  if (err.type === 'entity.parse.failed') return send(res, 400, 'INVALID_JSON', 'Request body is not valid JSON')
  if (err.type === 'entity.too.large') return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large')
  console.error(err)
  send(res, 500, 'INTERNAL_ERROR', 'Something went wrong on the server')
}