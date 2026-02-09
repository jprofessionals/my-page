'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  salesPipelineService,
  type CompetencyBaseAnalytics,
} from '@/services/salesPipeline.service'
import type { CustomerSector } from '@/data/types/types.gen'

// ===== Constants =====

const PERIOD_OPTIONS = [
  { value: 6, label: 'Siste 6 mnd' },
  { value: 12, label: 'Siste 12 mnd' },
  { value: 24, label: 'Siste 2 år' },
] as const

const SECTOR_LABELS: Record<CustomerSector, string> = {
  PUBLIC: 'Offentlig',
  PRIVATE: 'Privat',
  UNKNOWN: 'Ikke klassifisert',
}

const SECTOR_COLORS: Record<CustomerSector, string> = {
  PUBLIC: '#3b82f6',
  PRIVATE: '#22c55e',
  UNKNOWN: '#6b7280',
}

const TECH_CATEGORY_LABELS: Record<string, string> = {
  JAVA_KOTLIN: 'Java/Kotlin',
  DOTNET: '.NET',
  DATA_ANALYTICS: 'Data/Analyse',
  FRONTEND: 'Frontend',
  OTHER: 'Annet',
}

type TagSortKey = 'tagName' | 'demanded' | 'won' | 'hitRate'
type SortDir = 'asc' | 'desc'

// ===== Helpers =====

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function hitRateColor(rate: number): string {
  if (rate > 50) return 'text-success'
  if (rate >= 25) return 'text-warning'
  return 'text-error'
}

function getTechLabel(category: string): string {
  return TECH_CATEGORY_LABELS[category] || category
}

// ===== Component =====

export default function CompetencyBaseTab() {
  const [analytics, setAnalytics] = useState<CompetencyBaseAnalytics | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState<number>(12)

  // Tag table sorting
  const [tagSortKey, setTagSortKey] = useState<TagSortKey>('demanded')
  const [tagSortDir, setTagSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    loadData()
  }, [months])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getCompetencyBaseAnalytics(months)
      setAnalytics(data ?? null)
    } catch (error) {
      console.error('Failed to load competency base analytics:', error)
      toast.error('Kunne ikke laste konsulentbase-data')
    } finally {
      setLoading(false)
    }
  }

  // ===== Derived data =====

  const sectorChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.sectorDistribution.map((s) => ({
      name: SECTOR_LABELS[s.sector as CustomerSector] || s.sector,
      value: s.consultantCount,
      sector: s.sector as CustomerSector,
    }))
  }, [analytics])

  const techChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.techCategoryDistribution.map((t) => ({
      category: getTechLabel(t.techCategory),
      count: t.count,
    }))
  }, [analytics])

  const skillGapChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.skillGap.map((s) => ({
      category: getTechLabel(s.techCategory),
      demanded: s.demanded,
      won: s.won,
      hitRate: s.hitRate,
      techCategory: s.techCategory,
    }))
  }, [analytics])

  const sortedTags = useMemo(() => {
    if (!analytics) return []
    const top15 = [...analytics.tagAnalysis]
      .sort((a, b) => b.demanded - a.demanded)
      .slice(0, 15)

    top15.sort((a, b) => {
      let cmp = 0
      switch (tagSortKey) {
        case 'tagName':
          cmp = a.tagName.localeCompare(b.tagName)
          break
        case 'demanded':
          cmp = a.demanded - b.demanded
          break
        case 'won':
          cmp = a.won - b.won
          break
        case 'hitRate':
          cmp = a.hitRate - b.hitRate
          break
      }
      return tagSortDir === 'asc' ? cmp : -cmp
    })

    return top15
  }, [analytics, tagSortKey, tagSortDir])

  const handleTagSort = useCallback(
    (key: TagSortKey) => {
      if (tagSortKey === key) {
        setTagSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setTagSortKey(key)
        setTagSortDir('desc')
      }
    },
    [tagSortKey],
  )

  const tagSortIndicator = (key: TagSortKey) => {
    if (tagSortKey !== key) return ''
    return tagSortDir === 'asc' ? ' \u2191' : ' \u2193'
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

  const { availabilityStats } = analytics

  // ===== Render =====

  return (
    <div>
      {/* Period filter */}
      <div className="flex justify-end mb-6">
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

      {/* Section 1: Kapasitetsoversikt */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Kapasitetsoversikt</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Totalt ansatte</div>
            <div className="stat-value text-primary">
              {availabilityStats.totalConsultants}
            </div>
            <div className="stat-desc">Konsulenter i selskapet</div>
          </div>

          <div className="stat bg-success/10 border border-success/30 rounded-lg p-4">
            <div className="stat-title text-success">Ledig nå</div>
            <div className="stat-value text-success">
              {availabilityStats.available}
            </div>
            <div className="stat-desc text-success/70">
              Tilgjengelig for oppdrag
            </div>
          </div>

          <div className="stat bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="stat-title text-warning">Blir ledige</div>
            <div className="stat-value text-warning">
              {availabilityStats.availableSoon}
            </div>
            <div className="stat-desc text-warning/70">
              {availabilityStats.assigned > 0
                ? `+ ${availabilityStats.assigned} venter på oppstart`
                : 'På salgstavla'}
            </div>
          </div>

          <div className="stat bg-error/10 border border-error/30 rounded-lg p-4">
            <div className="stat-title text-error">Opptatt</div>
            <div className="stat-value text-error">
              {availabilityStats.occupied}
            </div>
            <div className="stat-desc text-error/70">I pågående oppdrag</div>
          </div>
        </div>
      </div>

      {/* Section 2: Kommende ledige konsulenter */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Kommende ledige konsulenter
        </h2>
        <div className="bg-base-200 rounded-lg p-4">
          {analytics.upcomingAvailable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Konsulent</th>
                    <th>Ledig fra</th>
                    <th>Nåværende kunde</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.upcomingAvailable
                    .sort((a, b) => {
                      if (!a.availableFrom) return 1
                      if (!b.availableFrom) return -1
                      return a.availableFrom.localeCompare(b.availableFrom)
                    })
                    .map((c) => (
                      <tr key={c.consultant.id}>
                        <td className="font-medium">
                          {c.consultant.name || '-'}
                        </td>
                        <td>{formatDate(c.availableFrom)}</td>
                        <td>{c.currentCustomer || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen konsulenter blir ledige i nærmeste fremtid
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Sektor-fordeling */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sektor-fordeling</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut chart */}
          <div className="bg-base-200 rounded-lg p-4">
            {sectorChartData.length > 0 &&
            sectorChartData.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectorChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {sectorChartData.map((entry) => (
                      <Cell
                        key={entry.sector}
                        fill={SECTOR_COLORS[entry.sector] || '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      color: '#f3f4f6',
                    }}
                    formatter={(value) => [value, 'Konsulenter']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Ingen sektordata tilgjengelig
              </div>
            )}
          </div>

          {/* Sector table */}
          <div className="bg-base-200 rounded-lg p-4">
            {analytics.sectorDistribution.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sektor</th>
                      <th>Antall kunder</th>
                      <th>Antall konsulenter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.sectorDistribution.map((s) => (
                      <tr key={s.sector}>
                        <td className="font-medium">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                SECTOR_COLORS[s.sector as CustomerSector] ||
                                '#6b7280',
                            }}
                          />
                          {SECTOR_LABELS[s.sector as CustomerSector] ||
                            s.sector}
                        </td>
                        <td>{s.customerCount}</td>
                        <td>{s.consultantCount}</td>
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
      </div>

      {/* Section 4: Teknologi-fordeling */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Teknologi-fordeling</h2>
        <div className="bg-base-200 rounded-lg p-4">
          {techChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={techChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      color: '#f3f4f6',
                    }}
                    formatter={(value) => [value, 'Konsulenter']}
                  />
                  <Bar
                    dataKey="count"
                    name="Konsulenter"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">
                Antall opptatte konsulenter per teknologikategori
              </p>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Ingen teknologidata tilgjengelig
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Skill gap-analyse */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Skill gap-analyse</h2>
        <div className="bg-base-200 rounded-lg p-4">
          {skillGapChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={skillGapChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      color: '#f3f4f6',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="demanded"
                    name="Etterspørsel"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="won"
                    name="Vunnet"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">
                Gapet mellom blå (etterspørsel) og grønn (vunnet) viser hvor vi
                mangler kapasitet/kompetanse
              </p>

              {/* Skill gap table */}
              <div className="overflow-x-auto mt-4 border-t border-base-300 pt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Etterspørsel</th>
                      <th>Vunnet</th>
                      <th>Hit Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillGapChartData.map((entry) => (
                      <tr key={entry.techCategory}>
                        <td className="font-medium">{entry.category}</td>
                        <td>{entry.demanded}</td>
                        <td>{entry.won}</td>
                        <td className={hitRateColor(entry.hitRate)}>
                          {entry.hitRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              Ingen skill gap-data tilgjengelig
            </div>
          )}
        </div>
      </div>

      {/* Section 6: Tagg-analyse */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tagg-analyse</h2>
        <div className="bg-base-200 rounded-lg p-4">
          {sortedTags.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleTagSort('tagName')}
                    >
                      Tag{tagSortIndicator('tagName')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleTagSort('demanded')}
                    >
                      Etterspørsel{tagSortIndicator('demanded')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleTagSort('won')}
                    >
                      Vunnet{tagSortIndicator('won')}
                    </th>
                    <th
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleTagSort('hitRate')}
                    >
                      Hit Rate{tagSortIndicator('hitRate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTags.map((tag) => (
                    <tr key={tag.tagName}>
                      <td className="font-medium">{tag.tagName}</td>
                      <td>{tag.demanded}</td>
                      <td>{tag.won}</td>
                      <td className={hitRateColor(tag.hitRate)}>
                        {tag.hitRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2">
                Topp 15 tagger sortert etter etterspørsel
              </p>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-500">
              Ingen tagg-data tilgjengelig
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
