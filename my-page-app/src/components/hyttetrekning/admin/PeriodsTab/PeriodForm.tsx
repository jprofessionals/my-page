import type { PeriodFormState } from '@/types/cabinLottery.types'

interface PeriodFormProps {
  period: PeriodFormState
  onChange: (field: keyof PeriodFormState, value: string | number) => void
  onSubmit: () => Promise<void>
  onCancel: () => void
  submitLabel: string
}

export default function PeriodForm({
  period,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: PeriodFormProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Startdato</label>
          <input
            type="date"
            value={period.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Sluttdato</label>
          <input
            type="date"
            value={period.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Beskrivelse</label>
          <input
            type="text"
            value={period.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="F.eks. Påske, Vinterferie Oslo"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Sortering</label>
          <input
            type="number"
            value={period.sortOrder}
            onChange={(e) => onChange('sortOrder', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Kommentar (valgfritt)</label>
          <input
            type="text"
            value={period.comment}
            onChange={(e) => onChange('comment', e.target.value)}
            placeholder="F.eks. Vinterferie, Påske, JPro julebord"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}