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