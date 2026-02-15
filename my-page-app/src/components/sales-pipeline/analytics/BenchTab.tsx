'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import {
  salesPipelineService,
  type BenchAnalytics,
} from '@/services/salesPipeline.service'

const MONTH_LABELS = [
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

const YEAR_COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
]

function formatDuration(days: number): string {
  const weeks = Math.floor(days / 7)
  const remainingDays = days % 7
  if (weeks === 0) return `${days}d`
  if (remainingDays === 0) return `${weeks}u`
  return `${weeks}u ${remainingDays}d`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getBenchColor(days: number): string {
  if (days > 28) return '#991b1b' // dark red
  if (days >= 14) return '#dc2626' // red
  return '#f87171' // light red
}

export default function BenchTab() {
  const [analytics, setAnalytics] = useState<BenchAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getBenchAnalytics(120)
      setAnalytics(data ?? null)
    } catch (error) {
      console.error('Failed to load bench analytics:', error)
      toast.error('Kunne ikke laste lediggangsdata')
    } finally {
      setLoading(false)
    }
  }

  const barChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.currentBenchDuration.map((entry) => ({
      name: entry.consultant.name || 'Ukjent',
      daysOnBench: entry.daysOnBench,
    }))
  }, [analytics])

  const { yoyChartData, yoyYears } = useMemo(() => {
    if (!analytics) return { yoyChartData: [], yoyYears: [] }

    // Only include years that appear in yearlyBenchSummary (years with real data)
    const validYears = new Set(
      analytics.yearlyBenchSummary.map((s) => s.year),
    )

    // Group by month number, with each year as a separate key
    const byMonth: Record<number, Record<string, number>> = {}
    const years = new Set<number>()

    for (const entry of analytics.involuntaryBenchTrend) {
      const [yearStr, monthStr] = entry.month.split('-')
      const year = parseInt(yearStr)
      if (!validYears.has(year)) continue
      const monthIdx = parseInt(monthStr) - 1
      years.add(year)
      if (!byMonth[monthIdx]) byMonth[monthIdx] = {}
      byMonth[monthIdx][String(year)] = entry.benchPercentage
    }

    const sortedYears = Array.from(years).sort()
    const data = Array.from({ length: 12 }, (_, i) => {
      const row: Record<string, string | number> = { month: MONTH_LABELS[i] }
      for (const year of sortedYears) {
        if (byMonth[i]?.[String(year)] !== undefined) {
          row[String(year)] = byMonth[i][String(year)]
        }
      }
      return row
    }).filter((row) => Object.keys(row).length > 1)

    return { yoyChartData: data, yoyYears: sortedYears }
  }, [analytics])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Ingen data tilgjengelig</p>
      </div>
    )
  }

  const barChartHeight = Math.max(300, barChartData.length * 40)

  return (
    <div>
      {/* Section 1: Nåværende lediggang */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Nåværende lediggang</h2>
        {barChartData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="bg-base-200 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={barChartHeight}>
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{ left: 20, right: 20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#d1d5db"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                    label={{
                      value: 'Dager',
                      position: 'insideBottom',
                      offset: -5,
                      fill: '#6b7280',
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    width={120}
                    tick={{ fill: '#374151' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      color: '#f3f4f6',
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                    itemStyle={{ color: '#f3f4f6' }}
                    formatter={(value) => [
                      formatDuration(value as number),
                      'Ledig',
                    ]}
                  />
                  <Bar dataKey="daysOnBench" radius={[0, 4, 4, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={getBenchColor(entry.daysOnBench)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="bg-base-200 rounded-lg p-4">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Konsulent</th>
                      <th>Varighet</th>
                      <th>Siden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.currentBenchDuration.map((entry) => (
                      <tr key={entry.consultant.id}>
                        <td className="font-medium">
                          {entry.consultant.name || '-'}
                        </td>
                        <td>
                          <span
                            className={
                              entry.daysOnBench > 28
                                ? 'text-error font-semibold'
                                : entry.daysOnBench >= 14
                                  ? 'text-warning'
                                  : ''
                            }
                          >
                            {formatDuration(entry.daysOnBench)}
                          </span>
                        </td>
                        <td className="text-sm opacity-70">
                          {formatDate(entry.becameAvailableAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-base-200 rounded-lg p-4">
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen konsulenter er ledige akkurat nå
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Ufrivillig lediggang per år */}
      {analytics.yearlyBenchSummary.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Ufrivillig lediggang per år
          </h2>
          <div className="bg-base-200 rounded-lg p-4">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>År</th>
                    <th className="text-right">Lediggang (ukeverk)</th>
                    <th className="text-right">Tilgjengelig (ukeverk)</th>
                    <th className="text-right">Andel</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.yearlyBenchSummary.map((entry) => (
                    <tr key={entry.year}>
                      <td className="font-medium">
                        {entry.year}
                        {entry.year === new Date().getFullYear() && (
                          <span className="text-xs opacity-50 ml-1">
                            (t.o.m.{' '}
                            {new Date().toLocaleDateString('nb-NO', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            )
                          </span>
                        )}
                      </td>
                      <td className="text-right">{entry.totalBenchWeeks}</td>
                      <td className="text-right">
                        {Math.round(entry.totalAvailableWeeks)}
                      </td>
                      <td className="text-right">
                        <span
                          className={
                            entry.benchPercentage > 5
                              ? 'text-error font-semibold'
                              : entry.benchPercentage > 2
                                ? 'text-warning'
                                : 'text-success'
                          }
                        >
                          {entry.benchPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: År-mot-år sammenligning */}
      {yoyChartData.length > 0 && yoyYears.length > 1 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Lediggang per måned – år mot år
          </h2>
          <div className="bg-base-200 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={yoyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#374151' }}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  label={{
                    value: '%',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#6b7280',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    color: '#f3f4f6',
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                  itemStyle={{ color: '#f3f4f6' }}
                  formatter={(value, name) => [`${value}%`, name]}
                  itemSorter={(item) => -(item.value as number)}
                />
                <Legend />
                {yoyYears.map((year, idx) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={String(year)}
                    stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
                    strokeWidth={year === new Date().getFullYear() ? 3 : 1.5}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
