import { pool } from '../db.js'
import { conflict } from '../errors.js'
import { toRequest } from './mapper.js'

export async function createRequest(input) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO return_requests
         (customer_name, customer_email, customer_phone, order_number,
          item_sku, item_name, quantity, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.customerName,
        input.customerEmail,
        input.customerPhone ?? null,
        input.orderNumber,
        input.itemSku,
        input.itemName,
        input.quantity,
        input.reason,
      ]
    )
    return toRequest(rows[0])
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'one_live_request_per_item') {
      throw conflict(
        'DUPLICATE_LIVE_REQUEST',
        'A live request already exists for this item on this order',
        { orderNumber: input.orderNumber, itemSku: input.itemSku }
      )
    }
    throw err
  }
}

const SORT_COLUMNS = {
  created_at: 'created_at',
  updated_at: 'updated_at',
  customer_name: 'lower(customer_name)',
  reference: 'reference',
  status: 'status',
}

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&')

export async function listRequests({ q, status, reason, sort, order, page, pageSize }) {
  const conditions = ['deleted_at IS NULL']
  const params = []

  if (q) {
    params.push(`%${escapeLike(q)}%`)
    const p = `$${params.length}`
    conditions.push(
      `(customer_name ILIKE ${p} OR customer_email ILIKE ${p} OR order_number ILIKE ${p} OR reference ILIKE ${p})`
    )
  }
  if (status) {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }
  if (reason) {
    params.push(reason)
    conditions.push(`reason = $${params.length}`)
  }

  const where = conditions.join(' AND ')
  const direction = order === 'asc' ? 'ASC' : 'DESC'
  const orderBy = `${SORT_COLUMNS[sort]} ${direction}, id ${direction}`
  const limitParam = `$${params.length + 1}`
  const offsetParam = `$${params.length + 2}`

  const [countResult, listResult] = await Promise.all([
    pool.query(`SELECT count(*)::int AS total FROM return_requests WHERE ${where}`, params),
    pool.query(
      `SELECT * FROM return_requests WHERE ${where}
       ORDER BY ${orderBy} LIMIT ${limitParam} OFFSET ${offsetParam}`,
      [...params, pageSize, (page - 1) * pageSize]
    ),
  ])

  const total = countResult.rows[0].total
  return {
    items: listResult.rows.map(toRequest),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  }
}