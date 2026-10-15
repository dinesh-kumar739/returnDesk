import { Suspense } from 'react'
import RequestDetail from '@/components/RequestDetail'

export default function RequestDetailPage() {
  return (
    <Suspense fallback={null}>
      <RequestDetail />
    </Suspense>
  )
}