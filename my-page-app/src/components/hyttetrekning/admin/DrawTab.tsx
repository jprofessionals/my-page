import type { DrawingStatus } from '@/types/cabinLottery.types'

interface DrawTabProps {
  drawingStatus: DrawingStatus
  drawSeed: string
  isDrawing: boolean
  onSetDrawSeed: (seed: string) => void
  onPerformDraw: () => Promise<void>
}

export default function DrawTab({
  drawingStatus,
  drawSeed,
  isDrawing,
  onSetDrawSeed,
  onPerformDraw,
}: DrawTabProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Kjør trekning</h2>

      {drawingStatus !== 'LOCKED' && drawingStatus !== 'DRAWN' ? (
        <div className="text-center py-12 text-gray-500">
          {drawingStatus === 'PUBLISHED'
            ? 'Kan ikke kjøre ny trekning når den allerede er publisert'
            : 'Trekningen må være låst før den kan kjøres'}
        </div>
      ) : (
        <div className="max-w-md">
          <p className="mb-6 text-gray-600">
            Når du kjører trekningen vil snake draft-algoritmen fordele hyttene.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Seed (valgfritt - kun for testing)
            </label>
            <input
              type="number"
              value={drawSeed}
              onChange={(e) => onSetDrawSeed(e.target.value)}
              placeholder="La stå tom for tilfeldig trekning"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              <strong>Ikke nødvendig å fylle ut.</strong> Når feltet er tomt
              genereres en helt tilfeldig trekning. Seed brukes kun for å
              reprodusere eksakt samme trekning i testing.
            </p>
          </div>

          <button
            onClick={onPerformDraw}
            disabled={isDrawing}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {isDrawing ? 'Kjører trekning...' : 'Kjør trekning nå'}
          </button>
        </div>
      )}
    </div>
  )
}
