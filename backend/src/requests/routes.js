import { Router } from 'express'
import { asyncHandler } from '../errorHandler.js'
import { parse, createRequestSchema } from '../validation.js'
import { createRequest } from './service.js'

const router = Router()

router.post('/', asyncHandler(async (req, res) => {
  const input = parse(createRequestSchema, req.body)
  const request = await createRequest(input)
  res.status(201).location(`/api/requests/${request.id}`).json({ data: request })
}))

export default router