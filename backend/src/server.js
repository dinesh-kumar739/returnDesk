import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { pool } from './db.js'
import { asyncHandler, errorHandler, notFoundHandler } from './errorHandler.js'
import requestsRouter from './requests/routes.js'

const app = express()
app.use(cors())
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