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
  useJobPostingStatistics,
} from '@/hooks/jobPosting'
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

export default function StatistikkPage() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { data: statistics, isLoading } = useJobPostingStatistics()
  const { mutate: categorize, isPending: isCategorizing } =
    useCategorizeJobPostings()
  const [showLast12Months, setShowLast12Months] = useState(false)
  const [isPollingStatus, setIsPollingStatus] = useState(false)
  const { data: categorizationStatus } = useCategorizationStatus(isPollingStatus)

  // Start polling when categorization is started
  useEffect(() => {
    if (isCategorizing) {
      setIsPollingStatus(true)
    }
  }, [isCategorizing])

  // Stop polling and refresh statistics when categorization is done
  useEffect(() => {
    if (isPollingStatus && categorizationStatus && !categorizationStatus.isRunning) {
      setIsPollingStatus(false)
      // Refresh statistics to show updated data
      queryClient.invalidateQueries({ queryKey: ['job-posting-statistics'] })
    }
  }, [categorizationStatus, isPollingStatus, queryClient])

  const isCategorizationRunning = isCategorizing || categorizationStatus?.isRunning

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
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="javaKotlin"
                  name={CATEGORY_LABELS.javaKotlin}
                  stroke={CATEGORY_COLORS.javaKotlin}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.javaKotlin, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="dotnet"
                  name={CATEGORY_LABELS.dotnet}
                  stroke={CATEGORY_COLORS.dotnet}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.dotnet, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="dataAnalytics"
                  name={CATEGORY_LABELS.dataAnalytics}
                  stroke={CATEGORY_COLORS.dataAnalytics}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.dataAnalytics, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="frontend"
                  name={CATEGORY_LABELS.frontend}
                  stroke={CATEGORY_COLORS.frontend}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.frontend, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="other"
                  name={CATEGORY_LABELS.other}
                  stroke={CATEGORY_COLORS.other}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS.other, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
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
      </div>
    </RequireAuth>
  )
}
