import { Router } from 'express'
import { asyncHandler } from '../errorHandler.js'
import {
  parse,
  parseId,
  createRequestSchema,
  updateRequestSchema,
  createNoteSchema,
  listQuerySchema,
} from '../validation.js'
import {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  listNotes,
  addNote,
} from './service.js'

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

router.get('/:id', asyncHandler(async (req, res) => {
  const request = await getRequest(parseId(req.params.id))
  res.json({ data: request })
}))

router.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const input = parse(updateRequestSchema, req.body)
  res.json({ data: await updateRequest(id, input) })
}))

router.get('/:id/notes', asyncHandler(async (req, res) => {
  const notes = await listNotes(parseId(req.params.id))
  res.json({ data: notes })
}))

router.post('/:id/notes', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const input = parse(createNoteSchema, req.body)
  res.status(201).json({ data: await addNote(id, input) })
}))

export default router