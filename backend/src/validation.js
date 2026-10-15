import { z } from 'zod'
import { unprocessable } from './errors.js'

export const REASONS = ['damaged', 'wrong_item', 'size_issue', 'not_as_described', 'changed_mind']
export const STATUSES = ['open', 'in_review', 'approved', 'rejected', 'completed']
export const RESOLUTIONS = ['refund', 'replacement', 'store_credit']

export function parse(schema, data) {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
  throw unprocessable('Validation failed', details)
}

const text = z.string().trim().min(1, 'This field is required')

export const createRequestSchema = z.object({
  customerName: text.max(120),
  customerEmail: z.string().trim().toLowerCase().email('Enter a valid email'),
  customerPhone: z.string().trim().max(30).optional(),
  orderNumber: text.max(40),
  itemSku: text.max(60),
  itemName: text.max(160),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  reason: z.enum(REASONS),
})