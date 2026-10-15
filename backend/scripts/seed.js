import { pool } from '../src/db.js'

const customers = [
  { name: 'Riya Sharma', email: 'riya.sharma@example.com', phone: '9876543210' },
  { name: 'Aman Verma', email: 'aman.verma@example.com', phone: '9812345678' },
  { name: 'Neha Gupta', email: 'neha.gupta@example.com', phone: null },
  { name: 'Rohan Mehta', email: 'rohan.mehta@example.com', phone: '9898989898' },
  { name: 'Priya Nair', email: 'priya.nair@example.com', phone: '9765432109' },
  { name: 'Karan Singh', email: 'karan.singh@example.com', phone: null },
  { name: 'Sneha Patil', email: 'sneha.patil@example.com', phone: '9123456780' },
  { name: 'Vikram Joshi', email: 'vikram.joshi@example.com', phone: '9345678901' },
]

const items = [
  { sku: 'SKU-SHOE-42', name: 'Running Shoes', price: 2499 },
  { sku: 'SKU-TSHIRT-M', name: 'Cotton T-Shirt (M)', price: 499 },
  { sku: 'SKU-JEANS-32', name: 'Slim Fit Jeans', price: 1799 },
  { sku: 'SKU-BAG-01', name: 'Laptop Backpack', price: 1299 },
  { sku: 'SKU-WATCH-05', name: 'Smart Watch', price: 3999 },
  { sku: 'SKU-BOTTLE-02', name: 'Steel Water Bottle', price: 399 },
  { sku: 'SKU-HOODIE-L', name: 'Fleece Hoodie (L)', price: 1499 },
  { sku: 'SKU-EARBUD-09', name: 'Wireless Earbuds', price: 1999 },
]

const reasons = ['damaged', 'wrong_item', 'size_issue', 'not_as_described', 'changed_mind']
const resolutions = ['refund', 'replacement', 'store_credit']
const plan = [
  ['open', 8],
  ['in_review', 8],
  ['approved', 7],
  ['rejected', 6],
  ['completed', 7],
]

const authors = ['Agent Meera', 'Agent Dev', 'Agent Isha']
const noteTexts = [
  'Customer contacted by phone, awaiting photos of the item.',
  'Photos received, item looks damaged as described.',
  'Checked with warehouse, original packaging was intact.',
  'Customer prefers a replacement over a refund.',
  'Return label emailed to the customer.',
  'Item received at warehouse and inspected.',
]

const rows = []
let n = 0
for (const [status, count] of plan) {
  for (let k = 0; k < count; k++) {
    const customer = customers[n % customers.length]
    const item = items[(n * 3) % items.length]
    const quantity = (n % 3) + 1
    const resolution =
      status === 'approved' || status === 'completed' ? resolutions[n % resolutions.length] : null
    rows.push({
      customer,
      item,
      quantity,
      orderNumber: `ORD-${3001 + n}`,
      reason: reasons[k % reasons.length],
      status,
      resolution,
      refundAmount: resolution === 'refund' ? item.price * quantity : null,
      ageHours: (36 - n) * 18 + 6,
      noteCount: n % 3 === 0 ? 2 : n % 4 === 1 ? 1 : 0,
      removed: false,
    })
    n++
  }
}

const closed = rows.find((row) => row.status === 'rejected')
rows.push({
  ...closed,
  reason: 'changed_mind',
  status: 'open',
  resolution: null,
  refundAmount: null,
  ageHours: 2,
  noteCount: 1,
})

rows.push({
  customer: customers[0],
  item: items[5],
  quantity: 1,
  orderNumber: 'ORD-9001',
  reason: 'changed_mind',
  status: 'open',
  resolution: null,
  refundAmount: null,
  ageHours: 50,
  noteCount: 0,
  removed: true,
})
rows.push({
  customer: customers[3],
  item: items[7],
  quantity: 1,
  orderNumber: 'ORD-9002',
  reason: 'wrong_item',
  status: 'rejected',
  resolution: null,
  refundAmount: null,
  ageHours: 70,
  noteCount: 1,
  removed: true,
})

const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query('TRUNCATE request_notes, return_requests RESTART IDENTITY CASCADE')
  await client.query('ALTER SEQUENCE request_ref_seq RESTART WITH 1001')

  for (const row of rows) {
    const created = new Date(Date.now() - row.ageHours * 3600 * 1000)
    const updated = row.status === 'open' ? created : new Date(created.getTime() + 3600 * 1000)

    const { rows: inserted } = await client.query(
      `INSERT INTO return_requests
         (customer_name, customer_email, customer_phone, order_number, item_sku, item_name,
          quantity, reason, status, resolution, refund_amount, created_at, updated_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        row.customer.name,
        row.customer.email,
        row.customer.phone,
        row.orderNumber,
        row.item.sku,
        row.item.name,
        row.quantity,
        row.reason,
        row.status,
        row.resolution,
        row.refundAmount,
        created,
        updated,
        row.removed ? updated : null,
      ]
    )

    const id = Number(inserted[0].id)
    for (let i = 0; i < row.noteCount; i++) {
      await client.query(
        `INSERT INTO request_notes (request_id, author, body, created_at)
         VALUES ($1, $2, $3, $4)`,
        [
          id,
          authors[(id + i) % authors.length],
          noteTexts[(id + i) % noteTexts.length],
          new Date(created.getTime() + (i + 1) * 30 * 60 * 1000),
        ]
      )
    }
  }

  await client.query('COMMIT')
  console.log(`seeded ${rows.length} requests`)
} catch (err) {
  await client.query('ROLLBACK')
  console.error('seed failed:', err.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}