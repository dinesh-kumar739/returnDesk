'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { REASON_LABELS, REASON_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from '@/lib/constants'
import StatusBadge from './StatusBadge'
import { fieldClass } from '@/lib/styles'

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })



export default function RequestList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  const query = searchParams.toString()
  const status = searchParams.get('status') ?? ''
  const reason = searchParams.get('reason') ?? ''
  const sort = searchParams.get('sort') ?? 'created_at'
  const order = searchParams.get('order') ?? 'desc'
  const page = Number(searchParams.get('page') ?? 1)
  const hasFilters = Boolean(searchParams.get('q') || status || reason)

  const updateParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === '' || value == null) next.delete(key)
        else next.set(key, value)
      }
      if (!('page' in changes)) next.delete('page')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== (searchParams.get('q') ?? '')) {
        updateParams({ q: search.trim() })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchParams, updateParams])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    apiFetch(`/requests?${query}`, { signal: controller.signal })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setLoading(false)
      })

    return () => controller.abort()
  }, [query, retryKey])

  const clearFilters = () => {
    setSearch('')
    router.replace(pathname)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ReturnDesk</h1>
          <p className="text-sm text-slate-600">Return and replacement requests</p>
        </div>
        <Link
          href="/requests/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          New request
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, order or reference"
          aria-label="Search requests"
          className={`${fieldClass} sm:col-span-2 lg:col-span-1`}
        />
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          aria-label="Filter by status"
          className={fieldClass}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={reason}
          onChange={(e) => updateParams({ reason: e.target.value })}
          aria-label="Filter by reason"
          className={fieldClass}
        >
          <option value="">All reasons</option>
          {REASON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={`${sort}:${order}`}
          onChange={(e) => {
            const [nextSort, nextOrder] = e.target.value.split(':')
            updateParams({ sort: nextSort, order: nextOrder })
          }}
          aria-label="Sort requests"
          className={fieldClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{error}</span>
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading requests">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-200" />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">
            {hasFilters ? 'No requests match your search or filters' : 'No requests yet'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {hasFilters ? 'Try a different search or clear the filters.' : 'Create the first return request to get started.'}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Order / Item</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold">
                      <Link href={`/requests/${r.id}`} className="text-sky-700 hover:underline">
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.customerName}</div>
                      <div className="text-xs text-slate-500">{r.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.orderNumber}</div>
                      <div className="text-xs text-slate-500">{r.itemName} x {r.quantity}</div>
                    </td>
                    <td className="px-4 py-3">{REASON_LABELS[r.reason]}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-sky-700">{r.reference}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-2 font-medium">{r.customerName}</div>
                  <div className="text-sm text-slate-600">{r.orderNumber} · {r.itemName} x {r.quantity}</div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>{REASON_LABELS[r.reason]}</span>
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">
              Page {meta.page} of {Math.max(meta.totalPages, 1)} · {meta.total} requests
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => updateParams({ page: page - 1 })}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => updateParams({ page: page + 1 })}
                disabled={page >= meta.totalPages}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}