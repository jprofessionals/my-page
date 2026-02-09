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
  type MonthlyTrendData,
} from '@/services/salesPipeline.service'

const FUNNEL_PERIODS = [
  { value: 1, label: 'Siste måned' },
  { value: 3, label: 'Siste 3 mnd' },
  { value: 4, label: 'Siste kvartal' },
  { value: 6, label: 'Siste halvår' },
  { value: 12, label: 'Siste år' },
  { value: undefined, label: 'All tid' },
] as const

export default function OverviewTab() {
  const [analytics, setAnalytics] = useState<SalesPipelineAnalytics | null>(
    null,
  )
  const [trends, setTrends] = useState<MonthlyTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [trendMonths, setTrendMonths] = useState(12)
  const [funnelMonths, setFunnelMonths] = useState<number | undefined>(
    undefined,
  )

  useEffect(() => {
    loadAnalytics()
  }, [funnelMonths])

  useEffect(() => {
    loadTrends()
  }, [trendMonths])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getAnalytics(funnelMonths)
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

  const formatMonth = (month: string) => {
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

  const formatChange = (current: number, previous: number) => {
    const diff = current - previous
    if (diff === 0) return null
    const isPositive = diff > 0
    const arrow = isPositive ? '\u2191' : '\u2193'
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
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Aktive prosesser</div>
          <div className="stat-value text-primary">
            {analytics.totalActiveActivities}
          </div>
          <div className="stat-desc">Pågående salgsaktiviteter</div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Vunnet i år</div>
          <div className="stat-value text-success">{analytics.wonThisYear}</div>
          <div className="stat-desc">
            {(() => {
              const change = formatChange(
                analytics.wonThisYear,
                analytics.wonLastYear,
              )
              if (change) {
                return (
                  <span
                    className={
                      change.isPositive ? 'text-success' : 'text-error'
                    }
                  >
                    {change.text} år
                  </span>
                )
              }
              return 'Samme som forrige år'
            })()}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Besvart i år</div>
          <div className="stat-value text-info">
            {analytics.createdThisYear}
          </div>
          <div className="stat-desc">
            {(() => {
              const change = formatChange(
                analytics.createdThisYear,
                analytics.createdLastYear,
              )
              if (change) {
                return (
                  <span
                    className={
                      change.isPositive ? 'text-success' : 'text-error'
                    }
                  >
                    {change.text} år
                  </span>
                )
              }
              return 'Samme som forrige år'
            })()}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Win Rate</div>
          <div className="stat-value text-info">
            {analytics.conversionRate.toFixed(1)}%
          </div>
          <div className="stat-desc">Vunnet / (Vunnet + Tapt)</div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Snitt dager til lukking</div>
          <div className="stat-value text-warning">
            {analytics.averageDaysToClose.toFixed(1)}
          </div>
          <div className="stat-desc">Fra opprettet til avsluttet</div>
        </div>
      </div>

      {/* Availability Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Konsulent-tilgjengelighet (
          {analytics.availabilityStats.totalConsultants} totalt)
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="stat bg-success/10 border border-success/30 rounded-lg p-4">
            <div className="stat-title text-success">Ledige nå</div>
            <div className="stat-value text-success">
              {analytics.availabilityStats.available}
            </div>
          </div>
          <div className="stat bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="stat-title text-warning">Blir ledige</div>
            <div className="stat-value text-warning">
              {analytics.availabilityStats.availableSoon}
            </div>
            <div className="stat-desc text-warning/70">På salgstavla</div>
          </div>
          <div className="stat bg-error/10 border border-error/30 rounded-lg p-4">
            <div className="stat-title text-error">Opptatt</div>
            <div className="stat-value text-error">
              {analytics.availabilityStats.occupied}
            </div>
            {analytics.availabilityStats.assigned > 0 && (
              <div className="stat-desc text-info">
                {analytics.availabilityStats.assigned} venter på oppstart
              </div>
            )}
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
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                    }}
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
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                    }}
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
            value={funnelMonths ?? ''}
            onChange={(e) =>
              setFunnelMonths(
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          >
            {FUNNEL_PERIODS.map((period) => (
              <option key={period.label} value={period.value ?? ''}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-base-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            {/* Starting count - all job postings in period */}
            <div className="text-center flex-shrink-0">
              <div className="text-2xl font-bold text-gray-400">
                {analytics.funnelTotalJobPostings}
              </div>
              <div className="text-xs text-gray-500">Utlysninger</div>
            </div>

            {/* Funnel stages - horizontal flow showing "reached" counts */}
            <div className="flex-1 flex items-center">
              {(() => {
                const stageLabels: Record<string, string> = {
                  INTERESTED: 'Interessert',
                  SENT_TO_SUPPLIER: 'Til leverandør',
                  SENT_TO_CUSTOMER: 'Til kunde',
                  INTERVIEW: 'Intervju',
                }
                const colors = [
                  'bg-blue-500',
                  'bg-blue-400',
                  'bg-cyan-500',
                  'bg-indigo-400',
                ]

                return (analytics.funnelData || []).map((stage, index) => (
                  <div key={stage.stage} className="flex items-center flex-1">
                    <div className="text-gray-400 px-1 flex-shrink-0">
                      &rarr;
                    </div>
                    <div
                      className={`${colors[index] || 'bg-gray-500'} rounded-lg p-3 flex-1 text-white text-center min-w-0`}
                      title={`${stage.reached} har nådd denne fasen, ${stage.current} er her nå`}
                    >
                      <div className="text-2xl font-bold">{stage.reached}</div>
                      <div className="text-xs truncate">
                        {stageLabels[stage.stage] || stage.stage}
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>

            {/* Arrow to outcomes */}
            <div className="text-gray-400 flex-shrink-0">&rarr;</div>

            {/* Outcomes */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
                  <span className="text-xl font-bold text-success">
                    {analytics.funnelWonCount}
                  </span>
                </div>
                <div className="text-xs text-success mt-1">Vunnet</div>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-error/20 border-2 border-error flex items-center justify-center">
                  <span className="text-xl font-bold text-error">
                    {analytics.funnelLostCount}
                  </span>
                </div>
                <div className="text-xs text-error mt-1">Tapt</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Antall som har nådd hver fase (
            {funnelMonths ? `siste ${funnelMonths} mnd` : 'all tid'})
          </p>
        </div>
      </div>
    </div>
  )
}
