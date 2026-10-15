import { pool } from '../db.js'
import { conflict, notFound } from '../errors.js'
import { toRequest, toNote } from './mapper.js'
import { allowedActions, EDITABLE_STATUSES } from './rules.js'

const withActions = (request) => ({ ...request, allowedActions: allowedActions(request.status) })

function rethrowDuplicate(err) {
  if (err.code === '23505' && err.constraint === 'one_live_request_per_item') {
    throw conflict(
      'DUPLICATE_LIVE_REQUEST',
      'A live request already exists for this item on this order'
    )
  }
  throw err
}

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
    return withActions(toRequest(rows[0]))
  } catch (err) {
    rethrowDuplicate(err)
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
    items: listResult.rows.map((row) => withActions(toRequest(row))),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  }
}

async function fetchNotes(id) {
  const { rows } = await pool.query(
    `SELECT id, author, body, created_at FROM request_notes
     WHERE request_id = $1 ORDER BY created_at ASC, id ASC`,
    [id]
  )
  return rows.map(toNote)
}

async function fetchLive(id) {
  const { rows } = await pool.query(
    'SELECT * FROM return_requests WHERE id = $1 AND deleted_at IS NULL',
    [id]
  )
  if (!rows[0]) throw notFound('Request not found')
  return toRequest(rows[0])
}

export async function getRequest(id) {
  const request = await fetchLive(id)
  const notes = await fetchNotes(id)
  return { ...withActions(request), notes }
}

const EDITABLE_COLUMNS = {
  customerName: 'customer_name',
  customerEmail: 'customer_email',
  customerPhone: 'customer_phone',
  orderNumber: 'order_number',
  itemSku: 'item_sku',
  itemName: 'item_name',
  quantity: 'quantity',
  reason: 'reason',
}

export async function updateRequest(id, input) {
  const entries = Object.entries(input).filter(([key]) => key in EDITABLE_COLUMNS)
  const sets = entries.map(([key], i) => `${EDITABLE_COLUMNS[key]} = $${i + 1}`)
  const values = entries.map(([, value]) => value)
  const idParam = `$${values.length + 1}`
  const statusParam = `$${values.length + 2}`

  try {
    const { rows } = await pool.query(
      `UPDATE return_requests
       SET ${sets.join(', ')}, updated_at = now()
       WHERE id = ${idParam} AND deleted_at IS NULL AND status = ANY(${statusParam}::request_status[])
       RETURNING *`,
      [...values, id, EDITABLE_STATUSES]
    )
    if (rows[0]) return withActions(toRequest(rows[0]))
  } catch (err) {
    rethrowDuplicate(err)
  }

  const current = await fetchLive(id)
  throw conflict(
    'REQUEST_LOCKED',
    `Details cannot be edited once a request is ${current.status}`,
    { status: current.status }
  )
}

export async function listNotes(id) {
  await fetchLive(id)
  return fetchNotes(id)
}

export async function addNote(id, { author, body }) {
  const { rows } = await pool.query(
    `INSERT INTO request_notes (request_id, author, body)
     SELECT id, $2, $3 FROM return_requests WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, author, body, created_at`,
    [id, author, body]
  )
  if (!rows[0]) throw notFound('Request not found')
  return toNote(rows[0])
}