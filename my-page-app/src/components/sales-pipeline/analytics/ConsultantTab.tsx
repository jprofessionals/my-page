'use client'

import { Fragment, useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  salesPipelineService,
  type ConsultantDetailedStats,
} from '@/services/salesPipeline.service'
import type {
  SalesActivityReadable,
  AvailabilityStatus,
  SalesStage,
} from '@/data/types/types.gen'

// ===== Constants =====

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

const KEY_FACTOR_LABELS: Record<string, string> = {
  PRICE: 'Pris',
  EXPERIENCE: 'Erfaring',
  AVAILABILITY: 'Tilgjengelighet',
  CUSTOMER_FIT: 'Kundematch',
  TECHNICAL_MATCH: 'Teknisk match',
  REFERENCES: 'Referanser',
  OTHER: 'Annet',
}

const AVAILABILITY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  AVAILABLE: { label: 'Ledig', className: 'badge-success' },
  AVAILABLE_SOON: { label: 'Blir ledig', className: 'badge-warning' },
  ASSIGNED: { label: 'Tildelt', className: 'badge-info' },
  OCCUPIED: { label: 'Opptatt', className: 'badge-error' },
}

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  INTERESTED: { label: 'Interessert', className: 'bg-blue-500 text-white' },
  SENT_TO_SUPPLIER: {
    label: 'Til leverandør',
    className: 'bg-cyan-500 text-white',
  },
  SENT_TO_CUSTOMER: {
    label: 'Til kunde',
    className: 'bg-indigo-500 text-white',
  },
  INTERVIEW: { label: 'Intervju', className: 'bg-purple-500 text-white' },
}

type MainSortKey =
  | 'name'
  | 'status'
  | 'active'
  | 'won'
  | 'lost'
  | 'winRate'
  | 'avgDays'
type HistorySortKey =
  | 'customer'
  | 'title'
  | 'status'
  | 'reason'
  | 'match'
  | 'duration'
  | 'price'
type SortDir = 'asc' | 'desc'

// ===== Helpers =====

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

function daysSince(start: string): number {
  const s = new Date(start).getTime()
  const now = Date.now()
  return Math.round((now - s) / (1000 * 60 * 60 * 24))
}

function getCustomerDisplayName(activity: SalesActivityReadable): string {
  return activity.customer?.name || activity.customerName || '-'
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '-'
  return `${price.toLocaleString('nb-NO')} kr`
}

function availabilityBadge(status: AvailabilityStatus | undefined | null) {
  if (!status) {
    return <span className="badge badge-ghost badge-sm">Ukjent</span>
  }
  const config = AVAILABILITY_CONFIG[status]
  if (!config) {
    return <span className="badge badge-ghost badge-sm">Ukjent</span>
  }
  return (
    <span className={`badge ${config.className} badge-sm`}>{config.label}</span>
  )
}

function stageBadge(stage: SalesStage) {
  const config = STAGE_CONFIG[stage]
  if (!config) {
    return <span className="badge badge-ghost badge-sm">{stage}</span>
  }
  return (
    <span className={`badge badge-sm ${config.className}`}>{config.label}</span>
  )
}

function outcomeBadge(status: string) {
  if (status === 'WON') {
    return (
      <span className="text-success font-bold" title="Vunnet">
        &#10003;
      </span>
    )
  }
  return (
    <span className="text-error font-bold" title="Tapt">
      &#10007;
    </span>
  )
}

// ===== Component =====

export default function ConsultantTab() {
  const [consultants, setConsultants] = useState<ConsultantDetailedStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Main table sort
  const [sortKey, setSortKey] = useState<MainSortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Expanded row
  const [expandedConsultantId, setExpandedConsultantId] = useState<
    number | null
  >(null)

  // History table sort (per expanded consultant)
  const [historySortKey, setHistorySortKey] =
    useState<HistorySortKey>('duration')
  const [historySortDir, setHistorySortDir] = useState<SortDir>('desc')

  // History row expansion for evaluation details
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(
    null,
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getConsultantAnalytics()
      setConsultants(data ?? [])
    } catch (error) {
      console.error('Failed to load consultant analytics:', error)
      toast.error('Kunne ikke laste konsulentdata')
    } finally {
      setLoading(false)
    }
  }

  // ===== Derived data =====

  const filteredAndSorted = useMemo(() => {
    let result = [...consultants]

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((c) =>
        (c.consultant.name || '').toLowerCase().includes(q),
      )
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = (a.consultant.name || '').localeCompare(b.consultant.name || '')
          break
        case 'status':
          cmp = (a.availabilityStatus || '').localeCompare(
            b.availabilityStatus || '',
          )
          break
        case 'active':
          cmp = a.activeActivities - b.activeActivities
          break
        case 'won':
          cmp = a.wonTotal - b.wonTotal
          break
        case 'lost':
          cmp = a.lostTotal - b.lostTotal
          break
        case 'winRate':
          cmp = a.winRate - b.winRate
          break
        case 'avgDays':
          cmp = a.avgDaysToClose - b.avgDaysToClose
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [consultants, searchQuery, sortKey, sortDir])

  const handleMainSort = useCallback(
    (key: MainSortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir(key === 'name' ? 'asc' : 'desc')
      }
    },
    [sortKey],
  )

  const mainSortIndicator = (key: MainSortKey) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  const handleHistorySort = useCallback(
    (key: HistorySortKey) => {
      if (historySortKey === key) {
        setHistorySortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setHistorySortKey(key)
        setHistorySortDir('desc')
      }
    },
    [historySortKey],
  )

  const historySortIndicator = (key: HistorySortKey) => {
    if (historySortKey !== key) return ''
    return historySortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  // Helper to get active/closed activities for a consultant
  const getActiveActivities = (
    stats: ConsultantDetailedStats,
  ): SalesActivityReadable[] => {
    return stats.activities.filter((a) => a.status === 'ACTIVE')
  }

  const getClosedActivities = (
    stats: ConsultantDetailedStats,
  ): SalesActivityReadable[] => {
    return stats.activities.filter(
      (a) => a.status === 'WON' || a.status === 'CLOSED_OTHER_WON',
    )
  }

  const getSortedClosedActivities = (
    stats: ConsultantDetailedStats,
  ): SalesActivityReadable[] => {
    const closed = getClosedActivities(stats)

    closed.sort((a, b) => {
      let cmp = 0
      switch (historySortKey) {
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
        case 'reason':
          cmp = (a.closedReason || '').localeCompare(b.closedReason || '')
          break
        case 'match':
          cmp = (a.matchRating ?? 0) - (b.matchRating ?? 0)
          break
        case 'duration': {
          const dA = daysBetween(a.createdAt, a.closedAt) ?? 0
          const dB = daysBetween(b.createdAt, b.closedAt) ?? 0
          cmp = dA - dB
          break
        }
        case 'price':
          cmp = (a.offeredPrice ?? 0) - (b.offeredPrice ?? 0)
          break
      }
      return historySortDir === 'asc' ? cmp : -cmp
    })

    return closed
  }

  const getPreviousCustomers = (stats: ConsultantDetailedStats): string[] => {
    const wonActivities = stats.activities.filter((a) => a.status === 'WON')
    const customerNames = wonActivities
      .map((a) => getCustomerDisplayName(a))
      .filter((n) => n !== '-')
    return [...new Set(customerNames)]
  }

  // ===== Loading / Empty states =====

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (consultants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Ingen konsulentdata tilgjengelig</p>
      </div>
    )
  }

  // ===== Render =====

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Søk etter konsulent..."
          className="input input-bordered w-full max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <span className="ml-3 text-sm text-gray-500">
            {filteredAndSorted.length} av {consultants.length} konsulenter
          </span>
        )}
      </div>

      {/* Consultant table */}
      <div className="bg-base-200 rounded-lg p-4">
        {filteredAndSorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleMainSort('name')}
                  >
                    Konsulent{mainSortIndicator('name')}
                  </th>
                  <th
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleMainSort('status')}
                  >
                    Status{mainSortIndicator('status')}
                  </th>
                  <th
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleMainSort('active')}
                  >
                    Aktive{mainSortIndicator('active')}
                  </th>
                  <th
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleMainSort('won')}
                  >
                    Vunnet{mainSortIndicator('won')}
                  </th>
                  <th
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleMainSort('lost')}
                  >
                    Tapt{mainSortIndicator('lost')}
                  </th>
                  <th
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleMainSort('winRate')}
                  >
                    Win Rate{mainSortIndicator('winRate')}
                  </th>
                  <th
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleMainSort('avgDays')}
                  >
                    Snitt dager{mainSortIndicator('avgDays')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((stats) => {
                  const isExpanded =
                    expandedConsultantId === stats.consultant.id
                  const activeActivities = getActiveActivities(stats)
                  const closedActivities = getSortedClosedActivities(stats)
                  const previousCustomers = getPreviousCustomers(stats)

                  return (
                    <Fragment key={stats.consultant.id}>
                      {/* Main row */}
                      <tr
                        className={`cursor-pointer hover:bg-base-300 ${isExpanded ? 'bg-base-300/50' : ''}`}
                        onClick={() =>
                          setExpandedConsultantId(
                            isExpanded ? null : (stats.consultant.id ?? null),
                          )
                        }
                      >
                        <td className="font-medium">
                          {stats.consultant.name || '-'}
                        </td>
                        <td>{availabilityBadge(stats.availabilityStatus)}</td>
                        <td className="text-right">{stats.activeActivities}</td>
                        <td className="text-right text-success">
                          {stats.wonTotal}
                        </td>
                        <td className="text-right text-error">
                          {stats.lostTotal}
                        </td>
                        <td className="text-right">
                          {stats.wonTotal + stats.lostTotal > 0
                            ? `${stats.winRate.toFixed(1)}%`
                            : '-'}
                        </td>
                        <td className="text-right">
                          {stats.avgDaysToClose > 0
                            ? stats.avgDaysToClose.toFixed(1)
                            : '-'}
                        </td>
                      </tr>

                      {/* Expanded drill-down */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-base-300/30 p-0">
                            <div className="p-4 space-y-6">
                              {/* Summary section */}
                              <div>
                                <h3 className="font-semibold mb-3">
                                  Oppsummering
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="stat bg-base-200 rounded-lg p-3">
                                    <div className="stat-title text-xs">
                                      Win Rate
                                    </div>
                                    <div className="stat-value text-lg text-primary">
                                      {stats.wonTotal + stats.lostTotal > 0
                                        ? `${stats.winRate.toFixed(1)}%`
                                        : '-'}
                                    </div>
                                    <div className="stat-desc text-xs">
                                      {stats.wonTotal}V / {stats.lostTotal}T
                                    </div>
                                  </div>

                                  <div className="stat bg-base-200 rounded-lg p-3">
                                    <div className="stat-title text-xs">
                                      Snitt match-rating
                                    </div>
                                    <div
                                      className="stat-value text-lg text-warning"
                                      title={renderStarsNumeric(
                                        stats.avgMatchRating,
                                      )}
                                    >
                                      {renderStars(stats.avgMatchRating)}
                                    </div>
                                    <div className="stat-desc text-xs">
                                      {renderStarsNumeric(stats.avgMatchRating)}
                                    </div>
                                  </div>

                                  <div className="stat bg-base-200 rounded-lg p-3">
                                    <div className="stat-title text-xs">
                                      Vanligste tapsårsak
                                    </div>
                                    <div className="stat-value text-sm">
                                      {stats.mostCommonLossReason
                                        ? CLOSED_REASON_LABELS[
                                            stats.mostCommonLossReason
                                          ] || stats.mostCommonLossReason
                                        : '-'}
                                    </div>
                                  </div>

                                  <div className="stat bg-base-200 rounded-lg p-3">
                                    <div className="stat-title text-xs">
                                      Tidligere kunder
                                    </div>
                                    <div className="stat-value text-sm">
                                      {previousCustomers.length > 0
                                        ? previousCustomers.join(', ')
                                        : '-'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Active processes table */}
                              {activeActivities.length > 0 && (
                                <div>
                                  <h3 className="font-semibold mb-3">
                                    Aktive prosesser ({activeActivities.length})
                                  </h3>
                                  <div className="overflow-x-auto">
                                    <table className="table table-xs">
                                      <thead>
                                        <tr>
                                          <th>Kunde</th>
                                          <th>Tittel</th>
                                          <th>Fase</th>
                                          <th>Levert</th>
                                          <th className="text-right">
                                            Dager i prosess
                                          </th>
                                          <th className="text-right">
                                            Tilbudt pris
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {activeActivities.map((activity) => (
                                          <tr key={activity.id}>
                                            <td>
                                              {getCustomerDisplayName(activity)}
                                            </td>
                                            <td className="max-w-xs truncate">
                                              {activity.title}
                                            </td>
                                            <td>
                                              {stageBadge(
                                                activity.currentStage,
                                              )}
                                            </td>
                                            <td className="text-xs">
                                              {activity.submittedAt ? (
                                                <>
                                                  {new Date(
                                                    activity.submittedAt,
                                                  ).toLocaleDateString(
                                                    'nb-NO',
                                                    {
                                                      day: 'numeric',
                                                      month: 'short',
                                                    },
                                                  )}
                                                  <span className="text-gray-500 ml-1">
                                                    (
                                                    {activity.submittedTo ===
                                                    'SUPPLIER'
                                                      ? 'lev.'
                                                      : 'kunde'}
                                                    )
                                                  </span>
                                                </>
                                              ) : (
                                                '-'
                                              )}
                                            </td>
                                            <td className="text-right">
                                              {daysSince(activity.createdAt)}
                                            </td>
                                            <td className="text-right">
                                              {formatPrice(
                                                activity.offeredPrice,
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* History table (closed activities) */}
                              {closedActivities.length > 0 ? (
                                <div>
                                  <h3 className="font-semibold mb-3">
                                    Historikk ({closedActivities.length})
                                  </h3>
                                  <div className="overflow-x-auto">
                                    <table className="table table-xs">
                                      <thead>
                                        <tr>
                                          <th
                                            className="cursor-pointer hover:text-primary"
                                            onClick={() =>
                                              handleHistorySort('customer')
                                            }
                                          >
                                            Kunde
                                            {historySortIndicator('customer')}
                                          </th>
                                          <th
                                            className="cursor-pointer hover:text-primary"
                                            onClick={() =>
                                              handleHistorySort('title')
                                            }
                                          >
                                            Tittel
                                            {historySortIndicator('title')}
                                          </th>
                                          <th
                                            className="cursor-pointer hover:text-primary text-center"
                                            onClick={() =>
                                              handleHistorySort('status')
                                            }
                                          >
                                            Utfall
                                            {historySortIndicator('status')}
                                          </th>
                                          <th
                                            className="cursor-pointer hover:text-primary"
                                            onClick={() =>
                                              handleHistorySort('reason')
                                            }
                                          >
                                            Tapsårsak
                                            {historySortIndicator('reason')}
                                          </th>
                                          <th
                                            className="cursor-pointer hover:text-primary"
                                            onClick={() =>
                                              handleHistorySort('match')
                                            }
                                          >
                                            Match{historySortIndicator('match')}
                                          </th>
                                          <th
                                            className="cursor-pointer hover:text-primary text-right"
                                            onClick={() =>
                                              handleHistorySort('duration')
                                            }
                                          >
                                            Varighet (dager)
                                            {historySortIndicator('duration')}
                                          </th>
                                          <th
                                            className="cursor-pointer hover:text-primary text-right"
                                            onClick={() =>
                                              handleHistorySort('price')
                                            }
                                          >
                                            Pris{historySortIndicator('price')}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {closedActivities.map((activity) => {
                                          const duration = daysBetween(
                                            activity.createdAt,
                                            activity.closedAt,
                                          )
                                          const isHistoryExpanded =
                                            expandedHistoryId === activity.id

                                          return (
                                            <Fragment key={activity.id}>
                                              <tr
                                                className="cursor-pointer hover:bg-base-300"
                                                onClick={() =>
                                                  setExpandedHistoryId(
                                                    isHistoryExpanded
                                                      ? null
                                                      : activity.id,
                                                  )
                                                }
                                              >
                                                <td>
                                                  {getCustomerDisplayName(
                                                    activity,
                                                  )}
                                                </td>
                                                <td className="max-w-xs truncate">
                                                  {activity.title}
                                                </td>
                                                <td className="text-center">
                                                  {outcomeBadge(
                                                    activity.status,
                                                  )}
                                                </td>
                                                <td>
                                                  {activity.closedReason
                                                    ? CLOSED_REASON_LABELS[
                                                        activity.closedReason
                                                      ] || activity.closedReason
                                                    : '-'}
                                                </td>
                                                <td
                                                  title={renderStarsNumeric(
                                                    activity.matchRating,
                                                  )}
                                                >
                                                  {activity.matchRating != null
                                                    ? renderStars(
                                                        activity.matchRating,
                                                      )
                                                    : '-'}
                                                </td>
                                                <td className="text-right">
                                                  {duration != null
                                                    ? duration
                                                    : '-'}
                                                </td>
                                                <td className="text-right">
                                                  {formatPrice(
                                                    activity.offeredPrice,
                                                  )}
                                                </td>
                                              </tr>

                                              {/* Evaluation details expansion */}
                                              {isHistoryExpanded && (
                                                <tr className="bg-base-200/50">
                                                  <td colSpan={8}>
                                                    <div className="p-3 space-y-2">
                                                      {activity.evaluationNotes && (
                                                        <div>
                                                          <span className="font-semibold text-sm">
                                                            Evalueringsnotater:{' '}
                                                          </span>
                                                          <span className="text-sm">
                                                            {
                                                              activity.evaluationNotes
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                      {activity.closedReasonNote && (
                                                        <div>
                                                          <span className="font-semibold text-sm">
                                                            Tapsnotat:{' '}
                                                          </span>
                                                          <span className="text-sm">
                                                            {
                                                              activity.closedReasonNote
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                      {activity.evaluationDocumentUrl && (
                                                        <div>
                                                          <span className="font-semibold text-sm">
                                                            Dokument:{' '}
                                                          </span>
                                                          <a
                                                            href={
                                                              activity.evaluationDocumentUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="link link-primary text-sm"
                                                          >
                                                            {
                                                              activity.evaluationDocumentUrl
                                                            }
                                                          </a>
                                                        </div>
                                                      )}
                                                      {activity.keyFactors &&
                                                        activity.keyFactors
                                                          .length > 0 && (
                                                          <div>
                                                            <span className="font-semibold text-sm">
                                                              Nøkkelfaktorer:{' '}
                                                            </span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                              {activity.keyFactors.map(
                                                                (kf) => (
                                                                  <span
                                                                    key={kf}
                                                                    className="badge badge-outline badge-sm"
                                                                  >
                                                                    {KEY_FACTOR_LABELS[
                                                                      kf
                                                                    ] || kf}
                                                                  </span>
                                                                ),
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}
                                                      {!activity.evaluationNotes &&
                                                        !activity.closedReasonNote &&
                                                        !activity.evaluationDocumentUrl &&
                                                        (!activity.keyFactors ||
                                                          activity.keyFactors
                                                            .length === 0) && (
                                                          <p className="text-sm text-gray-500">
                                                            Ingen
                                                            evalueringsdetaljer
                                                            registrert
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
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  Ingen avsluttede aktiviteter for denne
                                  konsulenten
                                </div>
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
            {searchQuery
              ? `Ingen konsulenter matcher "${searchQuery}"`
              : 'Ingen konsulentdata tilgjengelig'}
          </div>
        )}
      </div>
    </div>
  )
}
