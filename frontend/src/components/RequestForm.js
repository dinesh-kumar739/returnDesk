'use client'

import { useState } from 'react'
import { fieldErrorsFrom } from '@/lib/api'
import { REASON_OPTIONS } from '@/lib/constants'
import { fieldClass, primaryButton, secondaryButton } from '@/lib/styles'
import ErrorAlert from './ErrorAlert'

const FIELDS = [
  { name: 'customerName', label: 'Customer name', type: 'text' },
  { name: 'customerEmail', label: 'Customer email', type: 'email' },
  { name: 'customerPhone', label: 'Phone (optional)', type: 'tel' },
  { name: 'orderNumber', label: 'Order number', type: 'text' },
  { name: 'itemSku', label: 'Item SKU', type: 'text' },
  { name: 'itemName', label: 'Item name', type: 'text' },
  { name: 'quantity', label: 'Quantity', type: 'number' },
]

function initialValues(initial) {
  return {
    customerName: initial?.customerName ?? '',
    customerEmail: initial?.customerEmail ?? '',
    customerPhone: initial?.customerPhone ?? '',
    orderNumber: initial?.orderNumber ?? '',
    itemSku: initial?.itemSku ?? '',
    itemName: initial?.itemName ?? '',
    quantity: String(initial?.quantity ?? 1),
    reason: initial?.reason ?? 'damaged',
  }
}

export default function RequestForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialValues(initial))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    const payload = {
      ...values,
      customerPhone: values.customerPhone.trim(),
      quantity: values.quantity === '' ? null : Number(values.quantity),
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setError(err.message)
      setFieldErrors(fieldErrorsFrom(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorAlert message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.name} className="block text-sm font-medium">
            {field.label}
            <input
              type={field.type}
              min={field.type === 'number' ? 1 : undefined}
              value={values[field.name]}
              onChange={(e) => setValue(field.name, e.target.value)}
              aria-invalid={Boolean(fieldErrors[field.name])}
              className={`${fieldClass} mt-1`}
            />
            {fieldErrors[field.name] && (
              <span className="mt-1 block text-xs font-normal text-red-700">{fieldErrors[field.name]}</span>
            )}
          </label>
        ))}

        <label className="block text-sm font-medium">
          Reason
          <select
            value={values.reason}
            onChange={(e) => setValue('reason', e.target.value)}
            className={`${fieldClass} mt-1`}
          >
            {REASON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {fieldErrors.reason && (
            <span className="mt-1 block text-xs font-normal text-red-700">{fieldErrors.reason}</span>
          )}
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}