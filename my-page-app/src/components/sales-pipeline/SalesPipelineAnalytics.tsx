'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
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
import {
  salesPipelineService,
  type SalesPipelineAnalytics,
  type SalesActivity,
  type MonthlyTrendData,
} from '@/services/salesPipeline.service'
import Link from 'next/link'

const CLOSED_REASON_LABELS: Record<string, string> = {
  REJECTED_BY_SUPPLIER: 'Avvist av leverandør',
  REJECTED_BY_CUSTOMER: 'Avvist av kunde',
  MISSING_REQUIREMENTS: 'Manglende krav',
  OTHER_CANDIDATE_CHOSEN: 'Annen kandidat valgt',
  ASSIGNMENT_CANCELLED: 'Oppdrag kansellert',
  CONSULTANT_UNAVAILABLE: 'Konsulent utilgjengelig',
  CONSULTANT_WON_OTHER: 'Konsulent vant annet',
  OTHER: 'Annet',
}

// Funnel period options
const FUNNEL_PERIODS = [
  { value: 1, label: 'Siste måned' },
  { value: 3, label: 'Siste 3 mnd' },
  { value: 4, label: 'Siste kvartal' },
  { value: 6, label: 'Siste halvår' },
  { value: 12, label: 'Siste år' },
]

// Funnel stages in order (excluding LOST which is shown separately)
const FUNNEL_STAGES = ['INTERESTED', 'SENT_TO_SUPPLIER', 'SENT_TO_CUSTOMER', 'INTERVIEW'] as const

export default function SalesPipelineAnalyticsComponent() {
  const [analytics, setAnalytics] = useState<SalesPipelineAnalytics | null>(null)
  const [allActivities, setAllActivities] = useState<SalesActivity[]>([])
  const [trends, setTrends] = useState<MonthlyTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [trendMonths, setTrendMonths] = useState(12)
  const [funnelMonths, setFunnelMonths] = useState(3) // Default 3 months

  useEffect(() => {
    loadAnalytics()
    loadAllActivities()
  }, [])

  useEffect(() => {
    loadTrends()
  }, [trendMonths])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getAnalytics()
      setAnalytics(data ?? null)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Kunne ikke laste analytics-data')
    } finally {
      setLoading(false)
    }
  }

  const loadTrends = async () => {
    try {
      const data = await salesPipelineService.getTrends(trendMonths)
      setTrends(data ?? [])
    } catch (error) {
      console.error('Failed to load trends:', error)
    }
  }

  const loadAllActivities = async () => {
    try {
      // Fetch all activities (including inactive to see full funnel)
      const data = await salesPipelineService.getActivities()
      setAllActivities(data ?? [])
    } catch (error) {
      console.error('Failed to load activities:', error)
    }
  }

  // Calculate funnel data based on selected period
  const getFunnelData = () => {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - funnelMonths)

    // Filter activities created within the period
    const filteredActivities = allActivities.filter((activity) => {
      const createdAt = new Date(activity.createdAt)
      return createdAt >= cutoffDate
    })

    // Count by current stage for active activities
    const stageCounts: Record<string, number> = {}
    FUNNEL_STAGES.forEach((stage) => {
      stageCounts[stage] = filteredActivities.filter(
        (a) => a.status === 'ACTIVE' && a.currentStage === stage
      ).length
    })

    // Count won and lost
    const wonCount = filteredActivities.filter((a) => a.status === 'WON').length
    const lostCount = filteredActivities.filter(
      (a) => a.status === 'CLOSED_OTHER_WON'
    ).length

    // Total created in period
    const totalCreated = filteredActivities.length

    return { stageCounts, wonCount, lostCount, totalCreated }
  }

  const funnelData = getFunnelData()

  // Format month label (e.g., "2024-11" -> "Nov 24")
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']
    return `${monthNames[parseInt(monthNum) - 1]} ${year.slice(2)}`
  }

  // Format change between current and previous period
  const formatChange = (current: number, previous: number) => {
    const diff = current - previous
    if (diff === 0) return null
    const isPositive = diff > 0
    const arrow = isPositive ? '↑' : '↓'
    return {
      text: `${arrow} ${Math.abs(diff)} vs forrige`,
      isPositive,
    }
  }

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

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salgstavle Analytics</h1>
        <Link href="/salgstavle" className="btn btn-outline btn-sm">
          ← Tilbake til salgstavle
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Aktive prosesser</div>
          <div className="stat-value text-primary">{analytics.totalActiveActivities}</div>
          <div className="stat-desc">Pågående salgsaktiviteter</div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Vunnet i år</div>
          <div className="stat-value text-success">{analytics.wonThisYear}</div>
          <div className="stat-desc">
            {(() => {
              const change = formatChange(analytics.wonThisYear, analytics.wonLastYear)
              if (change) {
                return (
                  <span className={change.isPositive ? 'text-success' : 'text-error'}>
                    {change.text} år
                  </span>
                )
              }
              return `${analytics.wonThisQuarter} dette kvartal`
            })()}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Besvart i år</div>
          <div className="stat-value text-info">{analytics.createdThisYear}</div>
          <div className="stat-desc">
            {(() => {
              const change = formatChange(analytics.createdThisYear, analytics.createdLastYear)
              if (change) {
                return (
                  <span className={change.isPositive ? 'text-success' : 'text-error'}>
                    {change.text} år
                  </span>
                )
              }
              return `${analytics.createdThisQuarter} dette kvartal`
            })()}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Win Rate</div>
          <div className="stat-value text-info">{analytics.conversionRate.toFixed(1)}%</div>
          <div className="stat-desc">Vunnet / (Vunnet + Tapt)</div>
        </div>
      </div>

      {/* Period Comparison Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">Denne måneden</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-success">{analytics.wonThisMonth}</div>
              <div className="text-xs text-gray-500">Vunnet</div>
              {formatChange(analytics.wonThisMonth, analytics.wonLastMonth) && (
                <div className={`text-xs ${formatChange(analytics.wonThisMonth, analytics.wonLastMonth)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.wonThisMonth, analytics.wonLastMonth)?.text}
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-error">{analytics.lostThisMonth}</div>
              <div className="text-xs text-gray-500">Tapt</div>
              {formatChange(analytics.lostThisMonth, analytics.lostLastMonth) && (
                <div className={`text-xs ${!formatChange(analytics.lostThisMonth, analytics.lostLastMonth)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.lostThisMonth, analytics.lostLastMonth)?.text}
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{analytics.createdThisMonth}</div>
              <div className="text-xs text-gray-500">Besvart</div>
              {formatChange(analytics.createdThisMonth, analytics.createdLastMonth) && (
                <div className={`text-xs ${formatChange(analytics.createdThisMonth, analytics.createdLastMonth)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.createdThisMonth, analytics.createdLastMonth)?.text}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">Dette kvartalet</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-success">{analytics.wonThisQuarter}</div>
              <div className="text-xs text-gray-500">Vunnet</div>
              {formatChange(analytics.wonThisQuarter, analytics.wonLastQuarter) && (
                <div className={`text-xs ${formatChange(analytics.wonThisQuarter, analytics.wonLastQuarter)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.wonThisQuarter, analytics.wonLastQuarter)?.text}
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-error">{analytics.lostThisQuarter}</div>
              <div className="text-xs text-gray-500">Tapt</div>
              {formatChange(analytics.lostThisQuarter, analytics.lostLastQuarter) && (
                <div className={`text-xs ${!formatChange(analytics.lostThisQuarter, analytics.lostLastQuarter)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.lostThisQuarter, analytics.lostLastQuarter)?.text}
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{analytics.createdThisQuarter}</div>
              <div className="text-xs text-gray-500">Besvart</div>
              {formatChange(analytics.createdThisQuarter, analytics.createdLastQuarter) && (
                <div className={`text-xs ${formatChange(analytics.createdThisQuarter, analytics.createdLastQuarter)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.createdThisQuarter, analytics.createdLastQuarter)?.text}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">I år</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-success">{analytics.wonThisYear}</div>
              <div className="text-xs text-gray-500">Vunnet</div>
              {formatChange(analytics.wonThisYear, analytics.wonLastYear) && (
                <div className={`text-xs ${formatChange(analytics.wonThisYear, analytics.wonLastYear)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.wonThisYear, analytics.wonLastYear)?.text}
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold">{analytics.averageDaysToClose.toFixed(0)}</div>
              <div className="text-xs text-gray-500">Dager til lukket</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{analytics.createdThisYear}</div>
              <div className="text-xs text-gray-500">Besvart</div>
              {formatChange(analytics.createdThisYear, analytics.createdLastYear) && (
                <div className={`text-xs ${formatChange(analytics.createdThisYear, analytics.createdLastYear)?.isPositive ? 'text-success' : 'text-error'}`}>
                  {formatChange(analytics.createdThisYear, analytics.createdLastYear)?.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Availability Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Konsulent-tilgjengelighet</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat bg-success/10 border border-success/30 rounded-lg p-4">
            <div className="stat-title text-success">Ledige nå</div>
            <div className="stat-value text-success">{analytics.availabilityStats.available}</div>
          </div>
          <div className="stat bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="stat-title text-warning">Blir ledige</div>
            <div className="stat-value text-warning">{analytics.availabilityStats.availableSoon}</div>
          </div>
          <div className="stat bg-info/10 border border-info/30 rounded-lg p-4">
            <div className="stat-title text-info">Tildelt</div>
            <div className="stat-value text-info">{analytics.availabilityStats.assigned}</div>
          </div>
          <div className="stat bg-error/10 border border-error/30 rounded-lg p-4">
            <div className="stat-title text-error">Opptatt</div>
            <div className="stat-value text-error">{analytics.availabilityStats.occupied}</div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Månedlige trender</h2>
          <select
            className="select select-bordered select-sm"
            value={trendMonths}
            onChange={(e) => setTrendMonths(Number(e.target.value))}
          >
            <option value={6}>Siste 6 måneder</option>
            <option value={12}>Siste 12 måneder</option>
            <option value={24}>Siste 2 år</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bench Time (Lediggang) Chart */}
          <div className="bg-base-200 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Lediggang (ukeverk)</h3>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    labelFormatter={formatMonth}
                    formatter={(value) => [Number(value).toFixed(1), 'Ukeverk']}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="benchWeeks"
                    name="Lediggang (ukeverk)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Ingen data tilgjengelig
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Ukeverk ledig = dager med AVAILABLE eller ASSIGNED status / 5
            </p>
          </div>

          {/* Sales Activity Chart */}
          <div className="bg-base-200 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Salgsaktivitet</h3>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    labelFormatter={formatMonth}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    name="Besvarte utlysninger"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="won"
                    name="Vunnet"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lost"
                    name="Tapt"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Ingen data tilgjengelig
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Blå = utlysninger vi svarte på, Grønn = vunnet, Rød = tapt
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pipeline Funnel</h2>
          <select
            className="select select-bordered select-sm"
            value={funnelMonths}
            onChange={(e) => setFunnelMonths(Number(e.target.value))}
          >
            {FUNNEL_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-base-200 rounded-lg p-6">
          {/* Horizontal Funnel visualization */}
          <div className="flex items-center gap-4">
            {/* Starting count */}
            <div className="text-center flex-shrink-0">
              <div className="text-2xl font-bold text-info">{funnelData.totalCreated}</div>
              <div className="text-xs text-gray-500">Besvart</div>
            </div>

            {/* Funnel stages - horizontal flow */}
            <div className="flex-1 flex items-center">
              {(() => {
                const stages = [
                  { key: 'INTERESTED', label: 'Interessert', count: funnelData.stageCounts['INTERESTED'] || 0 },
                  { key: 'SENT_TO_SUPPLIER', label: 'Til leverandør', count: funnelData.stageCounts['SENT_TO_SUPPLIER'] || 0 },
                  { key: 'SENT_TO_CUSTOMER', label: 'Til kunde', count: funnelData.stageCounts['SENT_TO_CUSTOMER'] || 0 },
                  { key: 'INTERVIEW', label: 'Intervju', count: funnelData.stageCounts['INTERVIEW'] || 0 },
                ]
                const colors = ['bg-blue-500', 'bg-blue-400', 'bg-cyan-500', 'bg-indigo-400']

                return stages.map((stage, index) => (
                  <div key={stage.key} className="flex items-center flex-1">
                    {/* Stage box */}
                    <div className={`${colors[index]} rounded-lg p-3 flex-1 text-white text-center min-w-0`}>
                      <div className="text-2xl font-bold">{stage.count}</div>
                      <div className="text-xs truncate">{stage.label}</div>
                    </div>
                    {/* Arrow between stages */}
                    {index < stages.length - 1 && (
                      <div className="text-gray-400 px-1 flex-shrink-0">→</div>
                    )}
                  </div>
                ))
              })()}
            </div>

            {/* Arrow to outcomes */}
            <div className="text-gray-400 flex-shrink-0">→</div>

            {/* Outcomes */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
                  <span className="text-xl font-bold text-success">{funnelData.wonCount}</span>
                </div>
                <div className="text-xs text-success mt-1">Vunnet</div>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-error/20 border-2 border-error flex items-center justify-center">
                  <span className="text-xl font-bold text-error">{funnelData.lostCount}</span>
                </div>
                <div className="text-xs text-error mt-1">Tapt</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Viser aktiviteter opprettet i valgt periode
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Consultant Stats */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Konsulent-statistikk</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Konsulent</th>
                  <th className="text-center">Aktive</th>
                  <th className="text-center">Tapt</th>
                  <th className="text-center w-12" title="Har vunnet oppdrag">✓</th>
                </tr>
              </thead>
              <tbody>
                {analytics.consultantStats.slice(0, 10).map((stat) => (
                  <tr key={stat.consultant.id}>
                    <td>{stat.consultant.name || stat.consultant.email}</td>
                    <td className="text-center">
                      <span className="badge badge-primary">{stat.activeActivities}</span>
                    </td>
                    <td className="text-center">
                      {stat.lostTotal > 0 && (
                        <span className="badge badge-error">{stat.lostTotal}</span>
                      )}
                    </td>
                    <td className="text-center">
                      {stat.wonTotal > 0 && (
                        <span className="text-success text-lg" title={`Vunnet ${stat.wonTotal}`}>✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analytics.consultantStats.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Viser topp 10 av {analytics.consultantStats.length} konsulenter
              </p>
            )}
          </div>
        </div>

        {/* Customer Stats */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Kunde-statistikk</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Kunde</th>
                  <th className="text-center">Aktive</th>
                  <th className="text-center">Vunnet</th>
                  <th className="text-center">Tapt</th>
                </tr>
              </thead>
              <tbody>
                {analytics.customerStats.slice(0, 10).map((stat, index) => (
                  <tr key={`${stat.customerName}-${index}`}>
                    <td>{stat.customerName}</td>
                    <td className="text-center">
                      <span className="badge badge-primary">{stat.activeActivities}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-success">{stat.wonTotal}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-error">{stat.lostTotal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analytics.customerStats.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Viser topp 10 av {analytics.customerStats.length} kunder
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Closed Reasons */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tapsårsaker</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analytics.closedReasonStats
            .filter((r) => r.count > 0)
            .sort((a, b) => b.count - a.count)
            .map((reason) => (
              <div
                key={reason.reason}
                className="bg-base-200 rounded-lg p-3 flex justify-between items-center"
              >
                <span className="text-sm">{CLOSED_REASON_LABELS[reason.reason] || reason.reason}</span>
                <span className="badge badge-error">{reason.count}</span>
              </div>
            ))}
          {analytics.closedReasonStats.filter((r) => r.count > 0).length === 0 && (
            <p className="text-gray-500 col-span-full">Ingen tapte prosesser ennå</p>
          )}
        </div>
      </div>

    </div>
  )
}
