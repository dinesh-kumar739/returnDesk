'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import RequestForm from '@/components/RequestForm'

export default function NewRequestPage() {
  const router = useRouter()

  const create = async (payload) => {
    const res = await apiFetch('/requests', { method: 'POST', body: JSON.stringify(payload) })
    router.push(`/requests/${res.data.id}`)
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-sky-700 hover:underline">Back to requests</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">New return request</h1>
      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <RequestForm submitLabel="Create request" onSubmit={create} onCancel={() => router.push('/')} />
      </div>
    </main>
  )
}