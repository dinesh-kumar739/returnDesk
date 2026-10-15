import { Suspense } from 'react'
import RequestList from '@/components/RequestList'

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <RequestList />
      </Suspense>
    </main>
  )
}