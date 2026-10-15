'use client'

import { useState } from 'react'
import { fieldErrorsFrom } from '@/lib/api'
import { fieldClass, primaryButton } from '@/lib/styles'
import ErrorAlert from './ErrorAlert'

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export default function NotesPanel({ notes, onAdd }) {
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      await onAdd({ author, body })
      setBody('')
    } catch (err) {
      setError(err.message)
      setFieldErrors(fieldErrorsFrom(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-bold">Notes</h2>

      {notes.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No notes yet. Add the first one below.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{note.author}</span>
                <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">{note.body}</p>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3 border-t border-slate-200 pt-4">
        <ErrorAlert message={error} />
        <label className="block text-sm font-medium">
          Your name
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={`${fieldClass} mt-1`}
          />
          {fieldErrors.author && (
            <span className="mt-1 block text-xs font-normal text-red-700">{fieldErrors.author}</span>
          )}
        </label>
        <label className="block text-sm font-medium">
          Note
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${fieldClass} mt-1`}
          />
          {fieldErrors.body && (
            <span className="mt-1 block text-xs font-normal text-red-700">{fieldErrors.body}</span>
          )}
        </label>
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? 'Adding...' : 'Add note'}
        </button>
      </form>
    </section>
  )
}