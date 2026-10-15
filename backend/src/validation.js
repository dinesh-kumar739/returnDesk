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

const emptyToUndefined = (v) => (v === '' ? undefined : v)

export const SORT_FIELDS = ['created_at', 'updated_at', 'customer_name', 'reference', 'status']

export const listQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(STATUSES).optional()),
  reason: z.preprocess(emptyToUndefined, z.enum(REASONS).optional()),
  sort: z.enum(SORT_FIELDS).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})