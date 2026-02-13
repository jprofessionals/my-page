// pages/admin/hyttetrekning/[id].tsx
import { useRouter } from 'next/router'
import AdminDrawingDetail from '@/components/hyttetrekning/AdminDrawingDetail'

export default function AdminDrawingDetailPage() {
  const router = useRouter()
  const { id } = router.query

  // TODO: Re-enable auth for production
  // For local development without auth, render directly
  return <AdminDrawingDetail drawingId={id as string} />

  // return (
  //   <RequireAuth>
  //     <RequireAdmin>
  //       <AdminDrawingDetail drawingId={id as string} />
  //     </RequireAdmin>
  //   </RequireAuth>
  // )
}
