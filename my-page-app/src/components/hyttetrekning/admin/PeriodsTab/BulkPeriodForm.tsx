import type { BulkPeriodFormState } from '@/types/cabinLottery.types'

interface BulkPeriodFormProps {
  bulkPeriod: BulkPeriodFormState
  onChange: (field: keyof BulkPeriodFormState, value: string) => void
  onSubmit: () => Promise<void>
}

export default function BulkPeriodForm({
  bulkPeriod,
  onChange,
  onSubmit,
}: BulkPeriodFormProps) {
  return (
    <div className="bg-purple-50 p-4 rounded-lg mb-6 border-2 border-purple-200">
      <h3 className="font-medium mb-3">
        Legg til flere perioder (onsdag til onsdag)
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Alle perioder blir automatisk opprettet som uke-perioder fra onsdag til
        onsdag. Beskrivelser genereres automatisk basert på datoene.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Første onsdag (startdato)
          </label>
          <input
            type="date"
            value={bulkPeriod.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Siste onsdag (sluttdato)
          </label>
          <input
            type="date"
            value={bulkPeriod.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>
      <button
        onClick={onSubmit}
        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
      >
        Opprett perioder
      </button>
    </div>
  )
}
