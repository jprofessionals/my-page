import type { Period, Allocation } from '@/types/cabinLottery.types'

interface ResultsTabProps {
  periods: Period[]
  allocations: Allocation[]
}

export default function ResultsTab({ periods, allocations }: ResultsTabProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Resultater</h2>

      {allocations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Trekning ikke gjennomført ennå
        </div>
      ) : (
        <div className="space-y-6">
          {periods.map((period) => {
            const periodAllocs = allocations.filter((a) => a.periodId === period.id)
            return (
              <div key={period.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-3">{period.description}</h3>
                {periodAllocs.length === 0 ? (
                  <p className="text-sm text-gray-500">Ingen tildelinger</p>
                ) : (
                  <div className="space-y-2">
                    {periodAllocs.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="font-medium">{allocation.apartmentName}</span>
                        <span className="text-gray-600">{allocation.userName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}