import type { Period, PeriodFormState, DrawingStatus } from '@/types/cabinLottery.types'
import PeriodForm from './PeriodForm'

interface PeriodListItemProps {
  period: Period
  drawingStatus: DrawingStatus
  isEditing: boolean
  editForm: PeriodFormState
  onEdit: (period: Period) => void
  onDelete: (periodId: string) => Promise<void>
  onUpdateFormField: (field: keyof PeriodFormState, value: string | number) => void
  onSaveEdit: () => Promise<void>
  onCancelEdit: () => void
}

export default function PeriodListItem({
  period,
  drawingStatus,
  isEditing,
  editForm,
  onEdit,
  onDelete,
  onUpdateFormField,
  onSaveEdit,
  onCancelEdit,
}: PeriodListItemProps) {
  if (isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-4">Rediger periode</h3>
        <PeriodForm
          period={editForm}
          onChange={onUpdateFormField}
          onSubmit={onSaveEdit}
          onCancel={onCancelEdit}
          submitLabel="Lagre endringer"
        />
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">{period.description}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(period.startDate).toLocaleDateString('nb-NO')} -{' '}
            {new Date(period.endDate).toLocaleDateString('nb-NO')}
          </p>
          {period.comment && (
            <p className="text-sm text-gray-600 mt-1 italic">{period.comment}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Sort: {period.sortOrder}</span>
          {(drawingStatus === 'DRAFT' || drawingStatus === 'OPEN') && (
            <>
              <button
                onClick={() => onEdit(period)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Rediger
              </button>
              <button
                onClick={() => onDelete(period.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Slett
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}