import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { pool } from './db.js'
import { asyncHandler, errorHandler, notFoundHandler } from './errorHandler.js'
import requestsRouter from './requests/routes.js'

const allowedOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const app = express()
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT now() AS time')
  res.json({ data: { status: 'ok', dbTime: rows[0].time } })
}))

app.use('/api/requests', requestsRouter)
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(process.env.PORT || 4000, () => {
  console.log('server running')
})