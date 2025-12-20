'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import RequireAuth from '@/components/auth/RequireAuth'
import {
  useCategorizeJobPostings,
  useCategorizationStatus,
  useJobPostingsByCategory,
  useJobPostingStatistics,
  useRecategorizeAllJobPostings,
} from '@/hooks/jobPosting'
import { TechCategory } from '@/data/types'
import { useAuthContext } from '@/providers/AuthProvider'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

const CATEGORY_COLORS = {
  javaKotlin: '#e11d48', // rose-600
  dotnet: '#7c3aed', // violet-600
  dataAnalytics: '#0891b2', // cyan-600
  frontend: '#16a34a', // green-600
  other: '#6b7280', // gray-500
}

const CATEGORY_LABELS = {
  javaKotlin: 'Java/Kotlin',
  dotnet: '.NET',
  dataAnalytics: 'Data og analyse',
  frontend: 'Frontend',
  other: 'Annet',
}

// Map from chart dataKey to TechCategory enum value
const CATEGORY_TO_TECH_CATEGORY: Record<string, TechCategory> = {
  javaKotlin: 'JAVA_KOTLIN',
  dotnet: 'DOTNET',
  dataAnalytics: 'DATA_ANALYTICS',
  frontend: 'FRONTEND',
  other: 'OTHER',
}

const formatMonth = (month: string) => {
  if (!month) return ''
  const [year, monthNum] = month.split('-')
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ]
  return `${monthNames[parseInt(monthNum) - 1]} ${year.slice(2)}`
}

export default function StatistikkPage() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { data: statistics, isLoading } = useJobPostingStatistics()
  const { mutate: categorize, isPending: isCategorizing } =
    useCategorizeJobPostings()
  const { mutate: recategorizeAll, isPending: isRecategorizing } =
    useRecategorizeAllJobPostings()
  const [showLast12Months, setShowLast12Months] = useState(false)
  const [isPollingStatus, setIsPollingStatus] = useState(false)
  const { data: categorizationStatus } = useCategorizationStatus(isPollingStatus)

  // Drill-down state
  const [selectedCategory, setSelectedCategory] = useState<TechCategory | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>('')
  const { data: drillDownData, isLoading: isDrillDownLoading } = useJobPostingsByCategory(
    selectedCategory,
    selectedMonth
  )

  // Handler for clicking on a data point
  const handleDataPointClick = (categoryKey: string, month: string) => {
    if (month && CATEGORY_TO_TECH_CATEGORY[categoryKey]) {
      setSelectedCategory(CATEGORY_TO_TECH_CATEGORY[categoryKey])
      setSelectedMonth(month)
      setSelectedCategoryLabel(CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS])
    }
  }

  // Create clickable active dot component for each category
  // eslint-disable-next-line react/display-name, @typescript-eslint/no-explicit-any
  const createClickableDot = (categoryKey: string, color: string) => (props: any) => {
    const { cx, cy, payload } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill={color}
        stroke="white"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDataPointClick(categoryKey, payload?.month)}
      />
    )
  }

  const closeDrillDown = () => {
    setSelectedCategory(null)
    setSelectedMonth(null)
    setSelectedCategoryLabel('')
  }

  // Start polling when categorization is started
  useEffect(() => {
    if (isCategorizing || isRecategorizing) {
      setIsPollingStatus(true)
    }
  }, [isCategorizing, isRecategorizing])

  // Stop polling and refresh statistics when categorization is done
  useEffect(() => {
    if (isPollingStatus && categorizationStatus && !categorizationStatus.isRunning) {
      setIsPollingStatus(false)
      // Refresh statistics to show updated data
      queryClient.invalidateQueries({ queryKey: ['job-posting-statistics'] })
    }
  }, [categorizationStatus, isPollingStatus, queryClient])

  const isCategorizationRunning = isCategorizing || isRecategorizing || categorizationStatus?.isRunning

  const chartData = useMemo(() => {
    if (!statistics?.monthlyData) return []

    let data = statistics.monthlyData

    if (showLast12Months) {
      data = data.slice(-12)
    }

    return data.map((item) => ({
      ...item,
      // Format month for display (2024-06 -> Jun 24)
      monthLabel: formatMonth(item.month || ''),
    }))
  }, [statistics, showLast12Months])

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="container mx-auto px-4 py-8">
          <p className="text-gray-500">Laster statistikk...</p>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href="/utlysninger"
              className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
            >
              &larr; Tilbake til utlysninger
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Utlysningsstatistikk
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showLast12Months}
                onChange={(e) => setShowLast12Months(e.target.checked)}
                className="rounded border-gray-300"
              />
              Vis kun siste 12 måneder
            </label>
            {user?.admin && statistics?.uncategorizedCount !== undefined && statistics.uncategorizedCount > 0 && (
              <button
                onClick={() => categorize()}
                disabled={isCategorizationRunning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                {isCategorizationRunning
                  ? categorizationStatus
                    ? `Kategoriserer... (${categorizationStatus.progress}/${categorizationStatus.total})`
                    : 'Starter kategorisering...'
                  : `Kategoriser ${statistics.uncategorizedCount} ukategoriserte`}
              </button>
            )}
            {user?.admin && (
              <button
                onClick={() => {
                  if (window.confirm('Er du sikker på at du vil rekategorisere alle utlysninger? Dette vil nullstille alle eksisterende kategorier og kjøre AI-kategorisering på nytt.')) {
                    recategorizeAll()
                  }
                }}
                disabled={isCategorizationRunning}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                {isCategorizationRunning
                  ? categorizationStatus
                    ? `Kategoriserer... (${categorizationStatus.progress}/${categorizationStatus.total})`
                    : 'Starter...'
                  : 'Rekategoriser alle'}
              </button>
            )}
          </div>
        </div>

        {/* Uncategorized warning */}
        {statistics?.uncategorizedCount !== undefined && statistics.uncategorizedCount > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              {statistics.uncategorizedCount} utlysninger er ikke kategorisert
              ennå.
              {user?.admin
                ? ' Klikk "Kategoriser" for å bruke AI til å kategorisere dem.'
                : ' Be en administrator om å kjøre kategorisering.'}
            </p>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Antall utlysninger per måned
          </h2>

          {chartData.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              Ingen data tilgjengelig
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  trigger="click"
                  wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = payload[0]?.payload as any
                    const month = data?.month
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-gray-800 mb-2 border-b pb-2">
                          {formatMonth(month)} <span className="text-xs text-gray-500 font-normal">(klikk for å velge)</span>
                        </p>
                        <div className="space-y-1">
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                            const value = data?.[key] ?? 0
                            const color = CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
                            return (
                              <button
                                key={key}
                                onClick={() => handleDataPointClick(key, month)}
                                className="flex items-center justify-between w-full px-2 py-1 rounded hover:bg-gray-100 transition-colors text-left"
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-sm text-gray-700">{label}</span>
                                </span>
                                <span className="text-sm font-medium text-gray-900">{value}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="javaKotlin"
                  name={CATEGORY_LABELS.javaKotlin}
                  stroke={CATEGORY_COLORS.javaKotlin}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.javaKotlin, strokeWidth: 0, r: 4, cursor: 'pointer' }}
                  activeDot={createClickableDot('javaKotlin', CATEGORY_COLORS.javaKotlin)}
                />
                <Line
                  type="monotone"
                  dataKey="dotnet"
                  name={CATEGORY_LABELS.dotnet}
                  stroke={CATEGORY_COLORS.dotnet}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.dotnet, strokeWidth: 0, r: 4, cursor: 'pointer' }}
                  activeDot={createClickableDot('dotnet', CATEGORY_COLORS.dotnet)}
                />
                <Line
                  type="monotone"
                  dataKey="dataAnalytics"
                  name={CATEGORY_LABELS.dataAnalytics}
                  stroke={CATEGORY_COLORS.dataAnalytics}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.dataAnalytics, strokeWidth: 0, r: 4, cursor: 'pointer' }}
                  activeDot={createClickableDot('dataAnalytics', CATEGORY_COLORS.dataAnalytics)}
                />
                <Line
                  type="monotone"
                  dataKey="frontend"
                  name={CATEGORY_LABELS.frontend}
                  stroke={CATEGORY_COLORS.frontend}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.frontend, strokeWidth: 0, r: 4, cursor: 'pointer' }}
                  activeDot={createClickableDot('frontend', CATEGORY_COLORS.frontend)}
                />
                <Line
                  type="monotone"
                  dataKey="other"
                  name={CATEGORY_LABELS.other}
                  stroke={CATEGORY_COLORS.other}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.other, strokeWidth: 0, r: 4, cursor: 'pointer' }}
                  activeDot={createClickableDot('other', CATEGORY_COLORS.other)}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend/Summary */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const total = chartData.reduce((sum, item) => {
              const value = item[key as keyof typeof item]
              return sum + (typeof value === 'number' ? value : 0)
            }, 0)
            return (
              <div
                key={key}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS],
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500">totalt</p>
              </div>
            )
          })}
        </div>

        {/* Debug info - data range */}
        {user?.admin && statistics && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Database info:</h3>
            <ul className="space-y-1">
              <li>Totalt antall utlysninger: {statistics.totalCount}</li>
              <li>Ukategoriserte: {statistics.uncategorizedCount}</li>
              <li>Mangler dato: {statistics.missingDateCount}</li>
              <li>Eldste dato: {statistics.oldestDate || 'N/A'}</li>
              <li>Nyeste dato: {statistics.newestDate || 'N/A'}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Drill-down Modal */}
      {selectedCategory && selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedCategoryLabel} - {formatMonth(selectedMonth)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {drillDownData?.length || 0} utlysninger
                  </p>
                </div>
                <button
                  onClick={closeDrillDown}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isDrillDownLoading ? (
                <p className="text-gray-500 text-center py-8">Laster utlysninger...</p>
              ) : drillDownData && drillDownData.length > 0 ? (
                <div className="space-y-4">
                  {drillDownData.map((posting) => (
                    <Link
                      key={posting.id}
                      href={`/utlysninger?id=${posting.id}`}
                      onClick={closeDrillDown}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{posting.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{posting.customer?.name}</p>
                        </div>
                        {posting.urgent && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                            HASTER
                          </span>
                        )}
                      </div>
                      {posting.deadline && (
                        <p className="text-xs text-gray-500 mt-2">
                          Frist: {new Date(posting.deadline).toLocaleDateString('nb-NO')}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Ingen utlysninger funnet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </RequireAuth>
  )
}
