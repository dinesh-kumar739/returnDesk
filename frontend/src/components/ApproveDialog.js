'use client'

import { useState } from 'react'
import { fieldErrorsFrom } from '@/lib/api'
import { RESOLUTION_OPTIONS } from '@/lib/constants'
import { fieldClass, primaryButton, secondaryButton } from '@/lib/styles'
import ErrorAlert from './ErrorAlert'

export default function ApproveDialog({ onConfirm, onClose }) {
  const [resolution, setResolution] = useState('refund')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    const payload = { to: 'approved', resolution }
    if (resolution === 'refund' && amount !== '') payload.refundAmount = Number(amount)

    try {
      await onConfirm(payload)
    } catch (err) {
      setError(err.message)
      setFieldErrors(fieldErrorsFrom(err))
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <h2 id="approve-title" className="text-lg font-bold">Approve request</h2>
        <ErrorAlert message={error} />

        <label className="block text-sm font-medium">
          Resolution
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className={`${fieldClass} mt-1`}
          >
            {RESOLUTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {fieldErrors.resolution && (
            <span className="mt-1 block text-xs font-normal text-red-700">{fieldErrors.resolution}</span>
          )}
        </label>

        {resolution === 'refund' && (
          <label className="block text-sm font-medium">
            Refund amount
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${fieldClass} mt-1`}
            />
            {fieldErrors.refundAmount && (
              <span className="mt-1 block text-xs font-normal text-red-700">{fieldErrors.refundAmount}</span>
            )}
          </label>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </form>
    </div>
  )
}