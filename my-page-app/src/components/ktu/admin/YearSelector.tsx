'use client'

import { useYear } from './YearContext'

export default function YearSelector() {
  const { selectedYear, setSelectedYear, availableYears, loading } = useYear()

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Laster ar...</span>
      </div>
    )
  }

  if (availableYears.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Ingen undersøkelser opprettet enna
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-600">Velg ar:</span>
      <div className="flex gap-1">
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${
                selectedYear === year
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  )
}
