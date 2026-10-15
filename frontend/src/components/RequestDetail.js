'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { REASON_LABELS, RESOLUTION_LABELS, TRANSITION_LABELS } from '@/lib/constants'
import { dangerButton, primaryButton, secondaryButton } from '@/lib/styles'
import ApproveDialog from '@/components/ApproveDialog'
import ErrorAlert from '@/components/ErrorAlert'
import NotesPanel from '@/components/NotesPanel'
import RequestForm from '@/components/RequestForm'
import StatusBadge from '@/components/StatusBadge'

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{children || '-'}</dd>
    </div>
  )
}

export default function RequestDetail() {
  const { id } = useParams()
  const router = useRouter()

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    apiFetch(`/requests/${id}`, { signal: controller.signal })
      .then((res) => {
        setRequest(res.data)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoadError(err.message)
        setLoading(false)
      })

    return () => controller.abort()
  }, [id, retryKey])

  const keepNotes = useCallback((updated) => setRequest((prev) => ({ ...updated, notes: prev.notes })), [])

  const transition = async (payload) => {
    const res = await apiFetch(`/requests/${id}/transition`, { method: 'POST', body: JSON.stringify(payload) })
    keepNotes(res.data)
  }

  const handleTransition = async (to) => {
    if (to === 'approved') {
      setActionError(null)
      setApproving(true)
      return
    }
    if (to === 'rejected' && !window.confirm('Reject this request? This cannot be undone.')) return
    setBusy(true)
    setActionError(null)
    try {
      await transition({ to })
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleApprove = async (payload) => {
    await transition(payload)
    setApproving(false)
  }

  const handleEdit = async (payload) => {
    const res = await apiFetch(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    keepNotes(res.data)
    setEditing(false)
  }

  const handleRemove = async () => {
    if (!window.confirm('Remove this request from the desk?')) return
    setBusy(true)
    setActionError(null)
    try {
      await apiFetch(`/requests/${id}`, { method: 'DELETE' })
      router.push('/')
    } catch (err) {
      setActionError(err.message)
      setBusy(false)
    }
  }

  const handleAddNote = async (payload) => {
    const res = await apiFetch(`/requests/${id}/notes`, { method: 'POST', body: JSON.stringify(payload) })
    setRequest((prev) => ({ ...prev, notes: [...prev.notes, res.data] }))
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-sky-700 hover:underline">Back to requests</Link>

      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading request">
          <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-48 animate-pulse rounded-lg bg-slate-200" />
        </div>
      )}

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{loadError}</span>
          <button onClick={() => setRetryKey((k) => k + 1)} className={dangerButton}>Retry</button>
        </div>
      )}

      {request && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight">{request.reference}</h1>
            <StatusBadge status={request.status} />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            {editing ? (
              <RequestForm
                initial={request}
                submitLabel="Save changes"
                onSubmit={handleEdit}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Customer">{request.customerName}</Detail>
                <Detail label="Email">{request.customerEmail}</Detail>
                <Detail label="Phone">{request.customerPhone}</Detail>
                <Detail label="Order">{request.orderNumber}</Detail>
                <Detail label="Item">{request.itemName}</Detail>
                <Detail label="SKU">{request.itemSku}</Detail>
                <Detail label="Quantity">{request.quantity}</Detail>
                <Detail label="Reason">{REASON_LABELS[request.reason]}</Detail>
                <Detail label="Resolution">{request.resolution && RESOLUTION_LABELS[request.resolution]}</Detail>
                <Detail label="Refund amount">
                  {request.refundAmount !== null && request.refundAmount.toLocaleString('en-IN')}
                </Detail>
                <Detail label="Created">{formatDateTime(request.createdAt)}</Detail>
                <Detail label="Last updated">{formatDateTime(request.updatedAt)}</Detail>
              </dl>
            )}
          </section>

          {!editing && (
            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-lg font-bold">Actions</h2>
              <ErrorAlert message={actionError} />

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {request.allowedActions.transitions.map((to) => (
                  <button
                    key={to}
                    onClick={() => handleTransition(to)}
                    disabled={busy}
                    className={to === 'rejected' ? dangerButton : primaryButton}
                  >
                    {TRANSITION_LABELS[to]}
                  </button>
                ))}
                {request.allowedActions.canEdit && (
                  <button onClick={() => setEditing(true)} disabled={busy} className={secondaryButton}>
                    Edit details
                  </button>
                )}
                {request.allowedActions.canRemove && (
                  <button onClick={handleRemove} disabled={busy} className={secondaryButton}>
                    Remove from desk
                  </button>
                )}
              </div>

              {!request.allowedActions.canEdit && (
                <p className="text-sm text-slate-600">
                  Customer and item details are locked because this request is {request.status.replace('_', ' ')}.
                  Notes can still be added.
                </p>
              )}
            </section>
          )}

          <NotesPanel notes={request.notes} onAdd={handleAddNote} />

          {approving && <ApproveDialog onConfirm={handleApprove} onClose={() => setApproving(false)} />}
        </>
      )}
    </main>
  )
}