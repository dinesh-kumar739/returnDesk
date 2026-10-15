import { z } from 'zod'
import { unprocessable , badRequest} from './errors.js'

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

export function parseId(value) {
  if (!/^[1-9]\d{0,14}$/.test(value)) {
    throw badRequest('Request id must be a positive integer')
  }
  return value
}

export const updateRequestSchema = createRequestSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update')

export const createNoteSchema = z.object({
  author: text.max(80),
  body: text.max(2000),
})

export const transitionSchema = z
  .object({
    to: z.enum(STATUSES),
    resolution: z.enum(RESOLUTIONS).optional(),
    refundAmount: z.number().min(0.01, 'Refund amount must be greater than zero').max(99999999.99).optional(),
  })
  .superRefine((data, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message })

    if (data.to === 'approved') {
      if (!data.resolution) {
        issue('resolution', 'A resolution is required to approve a request')
      } else if (data.resolution === 'refund' && data.refundAmount === undefined) {
        issue('refundAmount', 'A refund amount greater than zero is required for a refund')
      } else if (data.resolution !== 'refund' && data.refundAmount !== undefined) {
        issue('refundAmount', 'A refund amount is only allowed when the resolution is refund')
      }
      return
    }

    if (data.resolution !== undefined) issue('resolution', 'A resolution can only be set when approving')
    if (data.refundAmount !== undefined) issue('refundAmount', 'A refund amount can only be set when approving')
  })