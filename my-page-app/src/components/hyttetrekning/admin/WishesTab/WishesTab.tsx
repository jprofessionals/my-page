import type {
  Wish,
  DrawingStatus,
  WishesViewMode,
  ImportResult,
} from '@/types/cabinLottery.types'
import WishesByUser from './WishesByUser'
import WishesByPeriod from './WishesByPeriod'

interface WishesTabProps {
  wishes: Wish[]
  drawingStatus: DrawingStatus
  wishesViewMode: WishesViewMode
  importFile: File | null
  importing: boolean
  importResult: ImportResult | null
  onSetWishesViewMode: (mode: WishesViewMode) => void
  onSetImportFile: (file: File | null) => void
  onImport: () => Promise<void>
}

export default function WishesTab({
  wishes,
  drawingStatus,
  wishesViewMode,
  importFile,
  importing,
  importResult,
  onSetWishesViewMode,
  onSetImportFile,
  onImport,
}: WishesTabProps) {
  const uniqueUsersCount = new Set(wishes.map((w) => w.userId)).size

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Ønsker</h2>
        {drawingStatus === 'OPEN' && (
          <div className="flex gap-3">
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={(e) => onSetImportFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <button
              onClick={onImport}
              disabled={!importFile || importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {importing ? 'Importerer...' : 'Importer CSV'}
            </button>
          </div>
        )}
      </div>

      {importResult && (
        <div
          className={`p-4 rounded-lg mb-6 ${importResult.errorCount === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}
        >
          <p className="font-medium">Import resultat:</p>
          <p>Totalt linjer: {importResult.totalLines}</p>
          <p>Vellykkede: {importResult.successCount}</p>
          <p>Feil: {importResult.errorCount}</p>
        </div>
      )}

      {wishes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Ingen ønsker registrert ennå
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              <p>
                Totalt ønsker: {wishes.length} fra {uniqueUsersCount} brukere
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSetWishesViewMode('by-user')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  wishesViewMode === 'by-user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Per bruker
              </button>
              <button
                onClick={() => onSetWishesViewMode('by-period')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  wishesViewMode === 'by-period'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Per periode
              </button>
            </div>
          </div>

          {wishesViewMode === 'by-user' && <WishesByUser wishes={wishes} />}

          {wishesViewMode === 'by-period' && <WishesByPeriod wishes={wishes} />}
        </div>
      )}
    </div>
  )
}
