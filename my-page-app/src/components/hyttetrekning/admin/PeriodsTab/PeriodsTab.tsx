import type {
  Period,
  PeriodFormState,
  BulkPeriodFormState,
  DrawingStatus,
} from '@/types/cabinLottery.types'
import PeriodForm from './PeriodForm'
import BulkPeriodForm from './BulkPeriodForm'
import PeriodListItem from './PeriodListItem'

interface PeriodsTabProps {
  periods: Period[]
  drawingStatus: DrawingStatus
  showPeriodForm: boolean
  showBulkPeriodForm: boolean
  newPeriod: PeriodFormState
  bulkPeriod: BulkPeriodFormState
  editingPeriodId: string | null
  editPeriod: PeriodFormState
  onTogglePeriodForm: () => void
  onToggleBulkPeriodForm: () => void
  onUpdateNewPeriod: (
    field: keyof PeriodFormState,
    value: string | number,
  ) => void
  onUpdateBulkPeriod: (field: keyof BulkPeriodFormState, value: string) => void
  onUpdateEditPeriod: (
    field: keyof PeriodFormState,
    value: string | number,
  ) => void
  onAddPeriod: () => Promise<void>
  onBulkAddPeriods: () => Promise<void>
  onEditPeriod: (period: Period) => void
  onUpdatePeriod: () => Promise<void>
  onCancelEdit: () => void
  onDeletePeriod: (periodId: string) => Promise<void>
}

export default function PeriodsTab({
  periods,
  drawingStatus,
  showPeriodForm,
  showBulkPeriodForm,
  newPeriod,
  bulkPeriod,
  editingPeriodId,
  editPeriod,
  onTogglePeriodForm,
  onToggleBulkPeriodForm,
  onUpdateNewPeriod,
  onUpdateBulkPeriod,
  onUpdateEditPeriod,
  onAddPeriod,
  onBulkAddPeriods,
  onEditPeriod,
  onUpdatePeriod,
  onCancelEdit,
  onDeletePeriod,
}: PeriodsTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Perioder</h2>
        {(drawingStatus === 'DRAFT' || drawingStatus === 'OPEN') && (
          <div className="flex gap-2">
            <button
              onClick={onToggleBulkPeriodForm}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {showBulkPeriodForm ? 'Avbryt' : 'Legg til flere perioder'}
            </button>
            <button
              onClick={onTogglePeriodForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showPeriodForm ? 'Avbryt' : 'Legg til enkeltperiode'}
            </button>
          </div>
        )}
      </div>

      {showPeriodForm && (
        <PeriodForm
          period={newPeriod}
          onChange={onUpdateNewPeriod}
          onSubmit={onAddPeriod}
          onCancel={onTogglePeriodForm}
          submitLabel="Lagre periode"
        />
      )}

      {showBulkPeriodForm && (
        <BulkPeriodForm
          bulkPeriod={bulkPeriod}
          onChange={onUpdateBulkPeriod}
          onSubmit={onBulkAddPeriods}
        />
      )}

      {periods.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Ingen perioder lagt til ennå
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <PeriodListItem
              key={period.id}
              period={period}
              drawingStatus={drawingStatus}
              isEditing={editingPeriodId === period.id}
              editForm={editPeriod}
              onEdit={onEditPeriod}
              onDelete={onDeletePeriod}
              onUpdateFormField={onUpdateEditPeriod}
              onSaveEdit={onUpdatePeriod}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
