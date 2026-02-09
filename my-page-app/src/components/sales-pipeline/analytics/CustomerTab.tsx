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
  ResponsiveContainer,
} from 'recharts'
import {
  salesPipelineService,
  type CustomerAnalytics,
} from '@/services/salesPipeline.service'
import type {
  SalesActivityReadable,
  CustomerDetailedStats,
  CustomerSector,
} from '@/data/types/types.gen'

// ===== Constants =====

const PERIOD_OPTIONS = [
  { value: 6, label: 'Siste 6 mnd' },
  { value: 12, label: 'Siste 12 mnd' },
  { value: undefined, label: 'All tid' },
] as const

const SECTOR_LABELS: Record<CustomerSector, string> = {
  PUBLIC: 'Offentlig',
  PRIVATE: 'Privat',
  UNKNOWN: 'Ukjent',
}

const SECTOR_BADGE_CLASSES: Record<CustomerSector, string> = {
  PUBLIC: 'badge-info',
  PRIVATE: 'badge-success',
  UNKNOWN: 'badge-ghost',
}

const CLOSED_REASON_LABELS: Record<string, string> = {
  REJECTED_BY_SUPPLIER: 'Avvist av leverandør',
  REJECTED_BY_CUSTOMER: 'Avvist av kunde',
  MISSING_REQUIREMENTS: 'Manglende krav',
  OTHER_CANDIDATE_CHOSEN: 'Annen kandidat valgt',
  ASSIGNMENT_CANCELLED: 'Oppdrag kansellert',
  CONSULTANT_UNAVAILABLE: 'Konsulent utilgjengelig',
  CONSULTANT_WON_OTHER: 'Vant annet oppdrag',
  OTHER: 'Annet',
}

const SOURCE_LABELS: Record<string, string> = {
  DIRECT: 'Direkte',
  BROKER: 'Mellomledd',
  SUPPLIER: 'Leverandør',
  FRAMEWORK_DIRECT: 'Rammeavtale direkte',
  FRAMEWORK_SUBCONTRACTOR: 'Rammeavtale underlev.',
  OTHER: 'Annet',
}

type CustomerSortKey =
  | 'name'
  | 'sector'
  | 'consultants'
  | 'active'
  | 'won'
  | 'lost'
  | 'winRate'
type SupplierSortKey = 'name' | 'total' | 'won' | 'lost' | 'winRate'
type SourceSortKey = 'source' | 'postings' | 'won' | 'lost' | 'winRate'
type SortDir = 'asc' | 'desc'

// ===== Helpers =====

function sectorBadge(sector: CustomerSector | null | undefined) {
  if (!sector) return <span className="badge badge-ghost badge-sm">Ukjent</span>
  const cls = SECTOR_BADGE_CLASSES[sector] || 'badge-ghost'
  const label = SECTOR_LABELS[sector] || sector
  return <span className={`badge ${cls} badge-sm`}>{label}</span>
}

function winRateColor(rate: number): string {
  if (rate > 50) return 'text-success'
  if (rate >= 30) return ''
  return 'text-error'
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

function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source
}

function getClosedReasonLabel(reason: string | null | undefined): string {
  if (!reason) return '-'
  return CLOSED_REASON_LABELS[reason] || reason
}

// ===== Component =====

export default function CustomerTab() {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState<number | undefined>(12)

  // Customer table
  const [searchQuery, setSearchQuery] = useState('')
  const [customerSortKey, setCustomerSortKey] = useState<CustomerSortKey>('won')
  const [customerSortDir, setCustomerSortDir] = useState<SortDir>('desc')

  // Expanded customer row
  const [expandedCustomerId, setExpandedCustomerId] = useState<
    number | null | 'null'
  >(null)
  const [expandedActivities, setExpandedActivities] = useState<
    SalesActivityReadable[]
  >([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Supplier table
  const [supplierSortKey, setSupplierSortKey] =
    useState<SupplierSortKey>('total')
  const [supplierSortDir, setSupplierSortDir] = useState<SortDir>('desc')

  // Source table
  const [sourceSortKey, setSourceSortKey] = useState<SourceSortKey>('postings')
  const [sourceSortDir, setSourceSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    loadData()
  }, [months])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getCustomerAnalytics(months)
      setAnalytics(data ?? null)
    } catch (error) {
      console.error('Failed to load customer analytics:', error)
      toast.error('Kunne ikke laste kundedata')
    } finally {
      setLoading(false)
    }
  }

  // ===== Drill-down: load activities for a customer =====

  const handleExpandCustomer = useCallback(
    async (customer: CustomerDetailedStats) => {
      const key = customer.customerId ?? 'null'
      if (expandedCustomerId === key) {
        setExpandedCustomerId(null)
        setExpandedActivities([])
        return
      }

      setExpandedCustomerId(key)

      if (customer.customerId != null) {
        setLoadingActivities(true)
        try {
          const activities = await salesPipelineService.getActivitiesByCustomer(
            customer.customerId,
            true,
          )
          setExpandedActivities(activities ?? [])
        } catch (error) {
          console.error('Failed to load customer activities:', error)
          toast.error('Kunne ikke laste aktiviteter for kunde')
          setExpandedActivities([])
        } finally {
          setLoadingActivities(false)
        }
      } else {
        // No customerId, can't fetch activities
        setExpandedActivities([])
      }
    },
    [expandedCustomerId],
  )

  // ===== Customer table sorting =====

  const filteredAndSortedCustomers = useMemo(() => {
    if (!analytics) return []
    let result = [...analytics.customers]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((c) => c.customerName.toLowerCase().includes(q))
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (customerSortKey) {
        case 'name':
          cmp = a.customerName.localeCompare(b.customerName)
          break
        case 'sector':
          cmp = (a.sector || 'UNKNOWN').localeCompare(b.sector || 'UNKNOWN')
          break
        case 'consultants':
          cmp = a.currentConsultantCount - b.currentConsultantCount
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
      }
      return customerSortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [analytics, searchQuery, customerSortKey, customerSortDir])

  const handleCustomerSort = useCallback(
    (key: CustomerSortKey) => {
      if (customerSortKey === key) {
        setCustomerSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setCustomerSortKey(key)
        setCustomerSortDir(key === 'name' ? 'asc' : 'desc')
      }
    },
    [customerSortKey],
  )

  const customerSortIndicator = (key: CustomerSortKey) => {
    if (customerSortKey !== key) return ''
    return customerSortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  // ===== Supplier table sorting =====

  const sortedSuppliers = useMemo(() => {
    if (!analytics) return []
    const result = [...analytics.supplierStats]

    result.sort((a, b) => {
      let cmp = 0
      switch (supplierSortKey) {
        case 'name':
          cmp = a.supplierName.localeCompare(b.supplierName)
          break
        case 'total':
          cmp = a.totalActivities - b.totalActivities
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
      }
      return supplierSortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [analytics, supplierSortKey, supplierSortDir])

  const handleSupplierSort = useCallback(
    (key: SupplierSortKey) => {
      if (supplierSortKey === key) {
        setSupplierSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSupplierSortKey(key)
        setSupplierSortDir(key === 'name' ? 'asc' : 'desc')
      }
    },
    [supplierSortKey],
  )

  const supplierSortIndicator = (key: SupplierSortKey) => {
    if (supplierSortKey !== key) return ''
    return supplierSortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  // ===== Source table sorting =====

  const sortedSources = useMemo(() => {
    if (!analytics) return []
    const result = [...analytics.sourceStats]

    result.sort((a, b) => {
      let cmp = 0
      switch (sourceSortKey) {
        case 'source':
          cmp = getSourceLabel(a.source).localeCompare(getSourceLabel(b.source))
          break
        case 'postings':
          cmp = a.totalJobPostings - b.totalJobPostings
          break
        case 'won':
          cmp = a.wonActivities - b.wonActivities
          break
        case 'lost':
          cmp = a.lostActivities - b.lostActivities
          break
        case 'winRate':
          cmp = a.winRate - b.winRate
          break
      }
      return sourceSortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [analytics, sourceSortKey, sourceSortDir])

  const handleSourceSort = useCallback(
    (key: SourceSortKey) => {
      if (sourceSortKey === key) {
        setSourceSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSourceSortKey(key)
        setSourceSortDir(key === 'source' ? 'asc' : 'desc')
      }
    },
    [sourceSortKey],
  )

  const sourceSortIndicator = (key: SourceSortKey) => {
    if (sourceSortKey !== key) return ''
    return sourceSortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  // ===== Source chart data =====

  const sourceChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.sourceStats.map((s) => ({
      source: getSourceLabel(s.source),
      winRate: s.winRate,
      rawSource: s.source,
    }))
  }, [analytics])

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
        <p className="text-gray-500">Ingen kundedata tilgjengelig</p>
      </div>
    )
  }

  // ===== Render =====

  return (
    <div>
      {/* Period filter */}
      <div className="flex justify-end mb-6">
        <select
          className="select select-bordered select-sm"
          value={months ?? ''}
          onChange={(e) => {
            const val = e.target.value
            setMonths(val === '' ? undefined : Number(val))
          }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Section 1: Kunde-tabell */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Kunde-tabell</h2>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Søk etter kunde..."
            className="input input-bordered w-full max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="ml-3 text-sm text-gray-500">
              {filteredAndSortedCustomers.length} av{' '}
              {analytics.customers.length} kunder
            </span>
          )}
        </div>

        <div className="bg-base-200 rounded-lg p-4">
          {filteredAndSortedCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleCustomerSort('name')}
                    >
                      Kunde{customerSortIndicator('name')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleCustomerSort('sector')}
                    >
                      Sektor{customerSortIndicator('sector')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleCustomerSort('consultants')}
                    >
                      Konsulenter nå{customerSortIndicator('consultants')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleCustomerSort('active')}
                    >
                      Aktive{customerSortIndicator('active')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleCustomerSort('won')}
                    >
                      Vunnet{customerSortIndicator('won')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleCustomerSort('lost')}
                    >
                      Tapt{customerSortIndicator('lost')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleCustomerSort('winRate')}
                    >
                      Win Rate{customerSortIndicator('winRate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCustomers.map((customer) => {
                    const key = customer.customerId ?? 'null'
                    const isExpanded = expandedCustomerId === key

                    return (
                      <Fragment key={key}>
                        {/* Main row */}
                        <tr
                          className={`cursor-pointer hover:bg-base-300 ${isExpanded ? 'bg-base-300/50' : ''}`}
                          onClick={() => handleExpandCustomer(customer)}
                        >
                          <td className="font-medium">
                            {customer.customerName}
                          </td>
                          <td>{sectorBadge(customer.sector)}</td>
                          <td className="text-right">
                            {customer.currentConsultantCount}
                          </td>
                          <td className="text-right">
                            {customer.activeActivities}
                          </td>
                          <td className="text-right text-success">
                            {customer.wonTotal}
                          </td>
                          <td className="text-right text-error">
                            {customer.lostTotal}
                          </td>
                          <td className="text-right">
                            {customer.wonTotal + customer.lostTotal > 0 ? (
                              <span className={winRateColor(customer.winRate)}>
                                {customer.winRate.toFixed(1)}%
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>

                        {/* Expanded drill-down */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="bg-base-300/30 p-0">
                              <div className="p-4 space-y-4">
                                {/* Summary stats */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  <div className="stat bg-base-200 rounded-lg p-3">
                                    <div className="stat-title text-xs">
                                      Konsulenter hos kunde
                                    </div>
                                    <div className="stat-value text-lg text-primary">
                                      {customer.currentConsultantCount}
                                    </div>
                                  </div>
                                  <div className="stat bg-base-200 rounded-lg p-3">
                                    <div className="stat-title text-xs">
                                      Win Rate
                                    </div>
                                    <div className="stat-value text-lg text-primary">
                                      {customer.wonTotal + customer.lostTotal >
                                      0
                                        ? `${customer.winRate.toFixed(1)}%`
                                        : '-'}
                                    </div>
                                    <div className="stat-desc text-xs">
                                      {customer.wonTotal}V /{' '}
                                      {customer.lostTotal}T
                                    </div>
                                  </div>
                                  <div className="stat bg-base-200 rounded-lg p-3">
                                    <div className="stat-title text-xs">
                                      Vanligste tapsårsak
                                    </div>
                                    <div className="stat-value text-sm">
                                      {getClosedReasonLabel(
                                        customer.mostCommonLossReason,
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Activity history */}
                                {loadingActivities ? (
                                  <div className="flex justify-center py-4">
                                    <div className="loading loading-spinner loading-md"></div>
                                  </div>
                                ) : expandedActivities.length > 0 ? (
                                  <div>
                                    <h3 className="font-semibold mb-3">
                                      Aktivitetshistorikk (
                                      {expandedActivities.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                      <table className="table table-xs">
                                        <thead>
                                          <tr>
                                            <th>Konsulent</th>
                                            <th>Tittel</th>
                                            <th className="text-center">
                                              Utfall
                                            </th>
                                            <th>Tapsårsak</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {expandedActivities.map(
                                            (activity) => (
                                              <tr key={activity.id}>
                                                <td>
                                                  {activity.consultant?.name ||
                                                    '-'}
                                                </td>
                                                <td className="max-w-xs truncate">
                                                  {activity.title}
                                                </td>
                                                <td className="text-center">
                                                  {activity.status === 'WON' ||
                                                  activity.status ===
                                                    'CLOSED_OTHER_WON' ? (
                                                    outcomeBadge(
                                                      activity.status,
                                                    )
                                                  ) : activity.status ===
                                                    'ACTIVE' ? (
                                                    <span
                                                      className="text-info font-bold"
                                                      title="Pågående"
                                                    >
                                                      &#8226;
                                                    </span>
                                                  ) : (
                                                    outcomeBadge('LOST')
                                                  )}
                                                </td>
                                                <td>
                                                  {getClosedReasonLabel(
                                                    activity.closedReason,
                                                  )}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : customer.customerId == null ? (
                                  <div className="text-sm text-gray-500">
                                    Kan ikke hente aktiviteter for kunde uten ID
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    Ingen aktiviteter funnet for denne kunden
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
                ? `Ingen kunder matcher "${searchQuery}"`
                : 'Ingen kundedata tilgjengelig'}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Sektor-analyse */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sektor-analyse</h2>
        <div className="bg-base-200 rounded-lg p-4">
          {analytics.sectorComparison.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sektor</th>
                    <th className="text-right">Antall kunder</th>
                    <th className="text-right">Antall konsulenter</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.sectorComparison.map((s) => (
                    <tr key={s.sector}>
                      <td className="font-medium">
                        {sectorBadge(s.sector as CustomerSector)}
                        <span className="ml-2">
                          {SECTOR_LABELS[s.sector as CustomerSector] ||
                            s.sector}
                        </span>
                      </td>
                      <td className="text-right">{s.customerCount}</td>
                      <td className="text-right">{s.consultantCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen sektordata tilgjengelig
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Leverandør/mellomledd-analyse */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Leverandør/mellomledd-analyse
        </h2>
        <div className="bg-base-200 rounded-lg p-4">
          {sortedSuppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSupplierSort('name')}
                    >
                      Leverandør{supplierSortIndicator('name')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSupplierSort('total')}
                    >
                      Prosesser{supplierSortIndicator('total')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSupplierSort('won')}
                    >
                      Vunnet{supplierSortIndicator('won')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSupplierSort('lost')}
                    >
                      Tapt{supplierSortIndicator('lost')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSupplierSort('winRate')}
                    >
                      Win Rate{supplierSortIndicator('winRate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSuppliers.map((supplier) => (
                    <tr key={supplier.supplierName}>
                      <td className="font-medium">{supplier.supplierName}</td>
                      <td className="text-right">{supplier.totalActivities}</td>
                      <td className="text-right text-success">
                        {supplier.wonTotal}
                      </td>
                      <td className="text-right text-error">
                        {supplier.lostTotal}
                      </td>
                      <td className="text-right">
                        {supplier.wonTotal + supplier.lostTotal > 0 ? (
                          <span className={winRateColor(supplier.winRate)}>
                            {supplier.winRate.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen leverandørdata tilgjengelig
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Kilde-analyse */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Kilde-analyse</h2>

        {/* Bar chart: win rate per source */}
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          {sourceChartData.length > 0 ? (
            <>
              <h3 className="font-semibold mb-3">Win rate per kilde</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="source"
                    stroke="#9ca3af"
                    fontSize={12}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                    }}
                    formatter={(value) => [
                      `${Number(value).toFixed(1)}%`,
                      'Win Rate',
                    ]}
                  />
                  <Bar
                    dataKey="winRate"
                    name="Win Rate"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Ingen kildedata tilgjengelig
            </div>
          )}
        </div>

        {/* Source table */}
        <div className="bg-base-200 rounded-lg p-4">
          {sortedSources.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSourceSort('source')}
                    >
                      Kilde{sourceSortIndicator('source')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSourceSort('postings')}
                    >
                      Utlysninger{sourceSortIndicator('postings')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSourceSort('won')}
                    >
                      Vunnet{sourceSortIndicator('won')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSourceSort('lost')}
                    >
                      Tapt{sourceSortIndicator('lost')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary text-right"
                      onClick={() => handleSourceSort('winRate')}
                    >
                      Win Rate{sourceSortIndicator('winRate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSources.map((source) => (
                    <tr key={source.source}>
                      <td className="font-medium">
                        {getSourceLabel(source.source)}
                      </td>
                      <td className="text-right">{source.totalJobPostings}</td>
                      <td className="text-right text-success">
                        {source.wonActivities}
                      </td>
                      <td className="text-right text-error">
                        {source.lostActivities}
                      </td>
                      <td className="text-right">
                        {source.wonActivities + source.lostActivities > 0 ? (
                          <span className={winRateColor(source.winRate)}>
                            {source.winRate.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen kildedata tilgjengelig
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
