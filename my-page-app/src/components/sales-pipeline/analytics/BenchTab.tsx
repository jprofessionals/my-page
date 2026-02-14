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
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  salesPipelineService,
  type BenchAnalytics,
} from '@/services/salesPipeline.service'

const PERIOD_OPTIONS = [
  { value: 6, label: 'Siste 6 mnd' },
  { value: 12, label: 'Siste 12 mnd' },
  { value: 24, label: 'Siste 2 år' },
] as const

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
  const [months, setMonths] = useState<number>(12)

  useEffect(() => {
    loadData()
  }, [months])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getBenchAnalytics(months)
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

  const trendChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.involuntaryBenchTrend.map((entry) => ({
      month: entry.month,
      totalBenchWeeks: Math.round(entry.totalBenchWeeks * 10) / 10,
      isCalculated: entry.isCalculated,
    }))
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
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    fontSize={12}
                    label={{
                      value: 'Dager',
                      position: 'insideBottom',
                      offset: -5,
                      fill: '#9ca3af',
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    width={120}
                    tick={{ fill: '#d1d5db' }}
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

      {/* Section 3: Ufrivillig lediggang over tid */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Ufrivillig lediggang over tid
          </h2>
          <select
            className="select select-bordered select-sm"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-base-200 rounded-lg p-4">
          {trendChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    fontSize={12}
                    tick={{ fill: '#d1d5db' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    label={{
                      value: 'Ukeverk',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#9ca3af',
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
                    formatter={(value, _name, props) => [
                      `${value} ukeverk ${(props.payload as { isCalculated: boolean }).isCalculated ? '(beregnet)' : '(importert)'}`,
                      'Lediggang',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalBenchWeeks"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props as {
                        cx: number
                        cy: number
                        payload: { isCalculated: boolean }
                      }
                      return (
                        <circle
                          key={`dot-${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={payload.isCalculated ? '#22c55e' : '#3b82f6'}
                          stroke="none"
                        />
                      )
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  Beregnet fra historikk
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                  Importert data
                </span>
              </div>
            </>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              Ingen trenddata tilgjengelig
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
