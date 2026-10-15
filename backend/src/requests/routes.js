import { Router } from 'express'
import { asyncHandler } from '../errorHandler.js'
import { parse, createRequestSchema ,listQuerySchema} from '../validation.js'
import { createRequest , listRequests} from './service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const query = parse(listQuerySchema, req.query)
  const { items, meta } = await listRequests(query)
  res.json({ data: items, meta })
}))

router.post('/', asyncHandler(async (req, res) => {
  const input = parse(createRequestSchema, req.body)
  const request = await createRequest(input)
  res.status(201).location(`/api/requests/${request.id}`).json({ data: request })
}))

export default router