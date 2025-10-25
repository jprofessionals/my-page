import { useRouter } from 'next/router'
import type { Drawing, DrawingStatus } from '@/types/cabinLottery.types'

interface DrawingHeaderProps {
  drawing: Drawing
  periodsCount: number
  onDeleteDrawing: () => Promise<void>
  onOpenDrawing: () => Promise<void>
  onRevertToDraft: () => Promise<void>
  onLockDrawing: () => Promise<void>
  onUnlockDrawing: () => Promise<void>
  onPublish: () => Promise<void>
  onGoToDraw: () => void
}

export default function DrawingHeader({
  drawing,
  periodsCount,
  onDeleteDrawing,
  onOpenDrawing,
  onRevertToDraft,
  onLockDrawing,
  onUnlockDrawing,
  onPublish,
  onGoToDraw,
}: DrawingHeaderProps) {
  const router = useRouter()

  const getStatusColor = (status: DrawingStatus): string => {
    const colors: Record<DrawingStatus, string> = {
      DRAFT: 'text-gray-600',
      OPEN: 'text-green-600',
      LOCKED: 'text-yellow-600',
      DRAWN: 'text-blue-600',
      PUBLISHED: 'text-purple-600',
    }
    return colors[status] || 'text-gray-600'
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => router.push('/admin/hyttetrekning')}
        className="text-blue-600 hover:text-blue-800 mb-4"
      >
        ← Tilbake til oversikt
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{drawing.season}</h1>
          <p className={`mt-2 text-lg font-medium ${getStatusColor(drawing.status)}`}>
            Status: {drawing.status}
          </p>
        </div>
        <div className="flex gap-3">
          {(drawing.status === 'DRAFT' || drawing.status === 'OPEN' || drawing.status === 'LOCKED') && (
            <button
              onClick={onDeleteDrawing}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Slett trekning
            </button>
          )}
          {drawing.status === 'DRAFT' && periodsCount > 0 && (
            <button
              onClick={onOpenDrawing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Åpne trekning
            </button>
          )}
          {(drawing.status === 'OPEN' || drawing.status === 'LOCKED') && (
            <button
              onClick={onRevertToDraft}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Tilbake til utkast
            </button>
          )}
          {drawing.status === 'OPEN' && periodsCount > 0 && (
            <button
              onClick={onLockDrawing}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Lås trekning
            </button>
          )}
          {drawing.status === 'LOCKED' && (
            <>
              <button
                onClick={onUnlockDrawing}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Lås opp trekning
              </button>
              <button
                onClick={onGoToDraw}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Kjør trekning
              </button>
            </>
          )}
          {drawing.status === 'DRAWN' && (
            <button
              onClick={onPublish}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Publiser resultater
            </button>
          )}
        </div>
      </div>
    </div>
  )
}