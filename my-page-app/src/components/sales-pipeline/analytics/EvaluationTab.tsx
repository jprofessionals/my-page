'use client'

import { Fragment, useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  BarChart,
  Bar,
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
  type EvaluationAnalytics,
} from '@/services/salesPipeline.service'
import type { SalesActivityReadable } from '@/data/types/types.gen'

// ===== Constants =====

const PERIOD_OPTIONS = [
  { value: 3, label: 'Siste 3 mnd' },
  { value: 6, label: 'Siste 6 mnd' },
  { value: 12, label: 'Siste 12 mnd' },
  { value: -1, label: 'I år' },
  { value: undefined, label: 'All tid' },
] as const

const CLOSED_REASON_LABELS: Record<string, string> = {
  REJECTED_BY_SUPPLIER: 'Avvist av leverandør',
  REJECTED_BY_CUSTOMER: 'Avvist av kunde',
  MISSING_REQUIREMENTS: 'Manglende krav',
  LOST_AT_SUPPLIER: 'Tapt i leverandørvurdering',
  LOST_AT_CUSTOMER: 'Tapt hos kunde',
  ASSIGNMENT_CANCELLED: 'Oppdrag kansellert',
  CONSULTANT_UNAVAILABLE: 'Konsulent utilgjengelig',
  CONSULTANT_WON_OTHER: 'Vant annet oppdrag',
  OTHER: 'Annet',
}

const STAGE_LABELS: Record<string, string> = {
  INTERESTED: 'Interessert',
  SENT_TO_SUPPLIER: 'Til leverandør',
  SENT_TO_CUSTOMER: 'Til kunde',
  INTERVIEW: 'Intervju',
}

const KEY_FACTOR_LABELS: Record<string, string> = {
  PRICE: 'Pris',
  EXPERIENCE: 'Erfaring',
  AVAILABILITY: 'Tilgjengelighet',
  CUSTOMER_FIT: 'Kundetilpasning',
  TECHNICAL_MATCH: 'Teknisk match',
  REFERENCES: 'Referanser',
  OTHER: 'Annet',
}

const BAR_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#10b981',
  '#6b7280',
]

type SortKey =
  | 'consultant'
  | 'customer'
  | 'title'
  | 'status'
  | 'closedReason'
  | 'matchRating'
  | 'duration'
type SortDir = 'asc' | 'desc'

// ===== Helpers =====

function getMonthsForPeriod(value: number | undefined): number | undefined {
  if (value === -1) {
    // "I år" — calculate months from January 1 of the current year
    const now = new Date()
    return now.getMonth() + 1
  }
  return value
}

function renderStars(rating: number | null | undefined, max = 5): string {
  if (rating == null) return '-'
  const full = Math.round(rating)
  return (
    '\u2605'.repeat(Math.min(full, max)) +
    '\u2606'.repeat(Math.max(max - full, 0))
  )
}

function renderStarsNumeric(rating: number | null | undefined): string {
  if (rating == null) return '-'
  return `${rating.toFixed(1)} / 5`
}

function daysBetween(
  start: string,
  end: string | null | undefined,
): number | null {
  if (!end) return null
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return Math.round((e - s) / (1000 * 60 * 60 * 24))
}

function getCustomerDisplayName(activity: SalesActivityReadable): string {
  return activity.customer?.name || activity.customerName || '-'
}

function statusBadge(status: string) {
  if (status === 'WON') {
    return <span className="badge badge-success badge-sm">Vunnet</span>
  }
  return <span className="badge badge-error badge-sm">Tapt</span>
}

// ===== Component =====

export default function EvaluationTab() {
  const [analytics, setAnalytics] = useState<EvaluationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodValue, setPeriodValue] = useState<number | undefined>(undefined)

  // Section 2: expanded reason
  const [expandedReason, setExpandedReason] = useState<string | null>(null)

  // Section 6: drill-down state
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'won' | 'lost'>(
    'all',
  )
  const [sortKey, setSortKey] = useState<SortKey>('duration')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [periodValue])

  const loadData = async () => {
    setLoading(true)
    try {
      const months = getMonthsForPeriod(periodValue)
      const data = await salesPipelineService.getEvaluationAnalytics(months)
      setAnalytics(data ?? null)
    } catch (error) {
      console.error('Failed to load evaluation analytics:', error)
      toast.error('Kunne ikke laste evalueringsdata')
    } finally {
      setLoading(false)
    }
  }

  // ===== Derived data =====

  const lossChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.closedReasonBreakdown
      .filter((r) => r.count > 0)
      .map((r, i) => ({
        reason: r.reason,
        label: CLOSED_REASON_LABELS[r.reason] || r.reason,
        count: r.count,
        fill: BAR_COLORS[i % BAR_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count)
  }, [analytics])

  const expandedReasonActivities = useMemo(() => {
    if (!analytics || !expandedReason) return []
    return analytics.closedActivities.filter(
      (a) =>
        a.status === 'CLOSED_OTHER_WON' && a.closedReason === expandedReason,
    )
  }, [analytics, expandedReason])

  const matchChartData = useMemo(() => {
    if (!analytics?.matchRatingDistribution) return []
    return analytics.matchRatingDistribution.map((b) => ({
      rating: `${b.rating} \u2605`,
      ratingNum: b.rating,
      wonCount: b.wonCount,
      lostCount: b.lostCount,
    }))
  }, [analytics])

  const customerExpWinRates = useMemo(() => {
    if (!analytics?.customerExperienceEffect)
      return { withExp: null, withoutExp: null }
    const e = analytics.customerExperienceEffect
    const withTotal = e.withExperienceWon + e.withExperienceLost
    const withoutTotal = e.withoutExperienceWon + e.withoutExperienceLost
    return {
      withExp: withTotal > 0 ? (e.withExperienceWon / withTotal) * 100 : null,
      withoutExp:
        withoutTotal > 0 ? (e.withoutExperienceWon / withoutTotal) * 100 : null,
      withExpWon: e.withExperienceWon,
      withExpLost: e.withExperienceLost,
      withExpTotal: withTotal,
      withoutExpWon: e.withoutExperienceWon,
      withoutExpLost: e.withoutExperienceLost,
      withoutExpTotal: withoutTotal,
    }
  }, [analytics])

  // Drill-down table data
  const filteredActivities = useMemo(() => {
    if (!analytics) return []
    let activities = [...analytics.closedActivities]

    if (outcomeFilter === 'won') {
      activities = activities.filter((a) => a.status === 'WON')
    } else if (outcomeFilter === 'lost') {
      activities = activities.filter((a) => a.status === 'CLOSED_OTHER_WON')
    }

    activities.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'consultant':
          cmp = (a.consultant.name || '').localeCompare(b.consultant.name || '')
          break
        case 'customer':
          cmp = getCustomerDisplayName(a).localeCompare(
            getCustomerDisplayName(b),
          )
          break
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'closedReason':
          cmp = (a.closedReason || '').localeCompare(b.closedReason || '')
          break
        case 'matchRating':
          cmp = (a.matchRating ?? 0) - (b.matchRating ?? 0)
          break
        case 'duration': {
          const dA = daysBetween(a.createdAt, a.closedAt) ?? 0
          const dB = daysBetween(b.createdAt, b.closedAt) ?? 0
          cmp = dA - dB
          break
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return activities
  }, [analytics, outcomeFilter, sortKey, sortDir])

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('desc')
      }
    },
    [sortKey],
  )

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  // ===== Loading / Empty states =====

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

  // ===== Render =====

  return (
    <div>
      {/* Section 1: Period filter */}
      <div className="flex justify-end mb-6">
        <select
          className="select select-bordered select-sm"
          value={periodValue ?? ''}
          onChange={(e) =>
            setPeriodValue(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Section 2: Tapsaarsaker (horizontal bar chart) */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tapsårsaker</h2>
        <div className="bg-base-200 rounded-lg p-4">
          {lossChartData.length > 0 ? (
            <>
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, lossChartData.length * 48)}
              >
                <BarChart
                  data={lossChartData}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    stroke="#9ca3af"
                    fontSize={12}
                    width={180}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                    }}
                    formatter={(value) => [value, 'Antall']}
                  />
                  <Bar
                    dataKey="count"
                    name="Antall"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(_entry, index) => {
                      const item = lossChartData[index]
                      if (item) {
                        setExpandedReason(
                          expandedReason === item.reason ? null : item.reason,
                        )
                      }
                    }}
                  >
                    {lossChartData.map((entry, index) => (
                      <Cell
                        key={entry.reason}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                        opacity={
                          expandedReason && expandedReason !== entry.reason
                            ? 0.4
                            : 1
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">
                Klikk på en stolpe for å se aktivitetene med den årsaken
              </p>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              Ingen tapte aktiviteter i perioden
            </div>
          )}

          {/* Expanded reason list */}
          {expandedReason && expandedReasonActivities.length > 0 && (
            <div className="mt-4 border-t border-base-300 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">
                  {CLOSED_REASON_LABELS[expandedReason] || expandedReason} (
                  {expandedReasonActivities.length})
                </h3>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setExpandedReason(null)}
                >
                  Lukk
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>Konsulent</th>
                      <th>Kunde</th>
                      <th>Tittel</th>
                      <th>Notat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expandedReasonActivities.map((a) => (
                      <tr key={a.id}>
                        <td>{a.consultant.name || '-'}</td>
                        <td>{getCustomerDisplayName(a)}</td>
                        <td>{a.title}</td>
                        <td className="max-w-xs truncate">
                          {a.closedReasonNote || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Tap per fase */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tap per fase</h2>
        <div className="bg-base-200 rounded-lg p-4">
          {analytics.closedReasonByStage.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fase</th>
                    <th>Antall</th>
                    <th>Vanligste årsak</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.closedReasonByStage.map((stage) => {
                    const topReason =
                      stage.reasons.length > 0
                        ? stage.reasons.reduce((a, b) =>
                            b.count > a.count ? b : a,
                          )
                        : null
                    return (
                      <tr key={stage.stage}>
                        <td className="font-medium">
                          {STAGE_LABELS[stage.stage] || stage.stage}
                        </td>
                        <td>{stage.count}</td>
                        <td>
                          {topReason
                            ? `${CLOSED_REASON_LABELS[topReason.reason] || topReason.reason} (${topReason.count})`
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen data tilgjengelig
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Match-kvalitet */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Match-kvalitet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="stat bg-success/10 border border-success/30 rounded-lg p-4">
            <div className="stat-title text-success">
              Snitt match-rating (Vunnet)
            </div>
            <div className="stat-value text-success text-2xl">
              {analytics.avgMatchRatingWon != null
                ? renderStars(analytics.avgMatchRatingWon)
                : '-'}
            </div>
            <div className="stat-desc">
              {renderStarsNumeric(analytics.avgMatchRatingWon)}
            </div>
          </div>
          <div className="stat bg-error/10 border border-error/30 rounded-lg p-4">
            <div className="stat-title text-error">
              Snitt match-rating (Tapt)
            </div>
            <div className="stat-value text-error text-2xl">
              {analytics.avgMatchRatingLost != null
                ? renderStars(analytics.avgMatchRatingLost)
                : '-'}
            </div>
            <div className="stat-desc">
              {renderStarsNumeric(analytics.avgMatchRatingLost)}
            </div>
          </div>
        </div>

        {/* Match rating distribution chart */}
        <div className="bg-base-200 rounded-lg p-4">
          {matchChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={matchChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="rating" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="wonCount"
                    name="Vunnet"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="lostCount"
                    name="Tapt"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">
                Fordeling av match-rating for vunnede og tapte aktiviteter
              </p>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Ingen match-rating data tilgjengelig
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Kundeerfaring-effekt */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Kundeerfaring-effekt</h2>
        <div className="bg-base-200 rounded-lg p-4">
          {analytics.customerExperienceEffect &&
          (customerExpWinRates.withExp != null ||
            customerExpWinRates.withoutExp != null) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stat bg-base-300 rounded-lg p-4">
                <div className="stat-title">Med kundeerfaring</div>
                <div className="stat-value text-primary">
                  {customerExpWinRates.withExp != null
                    ? `${customerExpWinRates.withExp.toFixed(1)}%`
                    : '-'}
                </div>
                <div className="stat-desc">
                  {customerExpWinRates.withExp != null
                    ? `${analytics.customerExperienceEffect.withExperienceWon} vunnet / ${analytics.customerExperienceEffect.withExperienceWon + analytics.customerExperienceEffect.withExperienceLost} totalt`
                    : 'Ingen data'}
                </div>
              </div>
              <div className="stat bg-base-300 rounded-lg p-4">
                <div className="stat-title">Uten kundeerfaring</div>
                <div className="stat-value text-secondary">
                  {customerExpWinRates.withoutExp != null
                    ? `${customerExpWinRates.withoutExp.toFixed(1)}%`
                    : '-'}
                </div>
                <div className="stat-desc">
                  {customerExpWinRates.withoutExp != null
                    ? `${analytics.customerExperienceEffect.withoutExperienceWon} vunnet / ${analytics.customerExperienceEffect.withoutExperienceWon + analytics.customerExperienceEffect.withoutExperienceLost} totalt`
                    : 'Ingen data'}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen data om kundeerfaring tilgjengelig
            </div>
          )}
        </div>
      </div>

      {/* Section 6: Drill-down tabell */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Avsluttede aktiviteter</h2>
          <div className="join">
            <button
              className={`join-item btn btn-sm ${outcomeFilter === 'all' ? 'btn-active' : ''}`}
              onClick={() => setOutcomeFilter('all')}
            >
              Alle ({analytics.closedActivities.length})
            </button>
            <button
              className={`join-item btn btn-sm ${outcomeFilter === 'won' ? 'btn-active' : ''}`}
              onClick={() => setOutcomeFilter('won')}
            >
              Vunnet (
              {
                analytics.closedActivities.filter((a) => a.status === 'WON')
                  .length
              }
              )
            </button>
            <button
              className={`join-item btn btn-sm ${outcomeFilter === 'lost' ? 'btn-active' : ''}`}
              onClick={() => setOutcomeFilter('lost')}
            >
              Tapt (
              {
                analytics.closedActivities.filter(
                  (a) => a.status === 'CLOSED_OTHER_WON',
                ).length
              }
              )
            </button>
          </div>
        </div>

        <div className="bg-base-200 rounded-lg p-4">
          {filteredActivities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSort('consultant')}
                    >
                      Konsulent{sortIndicator('consultant')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSort('customer')}
                    >
                      Kunde{sortIndicator('customer')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSort('title')}
                    >
                      Tittel{sortIndicator('title')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSort('status')}
                    >
                      Utfall{sortIndicator('status')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSort('closedReason')}
                    >
                      Tapsårsak{sortIndicator('closedReason')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSort('matchRating')}
                    >
                      Match{sortIndicator('matchRating')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSort('duration')}
                    >
                      Varighet (dager){sortIndicator('duration')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => {
                    const duration = daysBetween(
                      activity.createdAt,
                      activity.closedAt,
                    )
                    const isExpanded = expandedRow === activity.id
                    return (
                      <Fragment key={activity.id}>
                        <tr
                          className="cursor-pointer hover:bg-base-300"
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : activity.id)
                          }
                        >
                          <td>{activity.consultant.name || '-'}</td>
                          <td>{getCustomerDisplayName(activity)}</td>
                          <td className="max-w-xs truncate">
                            {activity.title}
                          </td>
                          <td>{statusBadge(activity.status)}</td>
                          <td>
                            {activity.closedReason
                              ? CLOSED_REASON_LABELS[activity.closedReason] ||
                                activity.closedReason
                              : '-'}
                          </td>
                          <td title={renderStarsNumeric(activity.matchRating)}>
                            {activity.matchRating != null
                              ? renderStars(activity.matchRating)
                              : '-'}
                          </td>
                          <td>{duration != null ? duration : '-'}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-base-300/50">
                            <td colSpan={7}>
                              <div className="p-3 space-y-2">
                                {activity.evaluationNotes && (
                                  <div>
                                    <span className="font-semibold text-sm">
                                      Evalueringsnotater:{' '}
                                    </span>
                                    <span className="text-sm">
                                      {activity.evaluationNotes}
                                    </span>
                                  </div>
                                )}
                                {activity.closedReasonNote && (
                                  <div>
                                    <span className="font-semibold text-sm">
                                      Tapsnotat:{' '}
                                    </span>
                                    <span className="text-sm">
                                      {activity.closedReasonNote}
                                    </span>
                                  </div>
                                )}
                                {activity.evaluationDocumentUrl && (
                                  <div>
                                    <span className="font-semibold text-sm">
                                      Dokument:{' '}
                                    </span>
                                    <a
                                      href={activity.evaluationDocumentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="link link-primary text-sm"
                                    >
                                      {activity.evaluationDocumentUrl}
                                    </a>
                                  </div>
                                )}
                                {activity.keyFactors &&
                                  activity.keyFactors.length > 0 && (
                                    <div>
                                      <span className="font-semibold text-sm">
                                        Nøkkelfaktorer:{' '}
                                      </span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {activity.keyFactors.map((kf) => (
                                          <span
                                            key={kf}
                                            className="badge badge-outline badge-sm"
                                          >
                                            {KEY_FACTOR_LABELS[kf] || kf}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                {!activity.evaluationNotes &&
                                  !activity.closedReasonNote &&
                                  !activity.evaluationDocumentUrl &&
                                  (!activity.keyFactors ||
                                    activity.keyFactors.length === 0) && (
                                    <p className="text-sm text-gray-500">
                                      Ingen evalueringsdetaljer registrert
                                    </p>
                                  )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen avsluttede aktiviteter i perioden
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
