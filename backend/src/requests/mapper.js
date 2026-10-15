export function toRequest(row) {
  return {
    id: row.id,
    reference: row.reference,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    orderNumber: row.order_number,
    itemSku: row.item_sku,
    itemName: row.item_name,
    quantity: row.quantity,
    reason: row.reason,
    status: row.status,
    resolution: row.resolution,
    refundAmount: row.refund_amount === null ? null : Number(row.refund_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toNote(row) {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at,
  }
}