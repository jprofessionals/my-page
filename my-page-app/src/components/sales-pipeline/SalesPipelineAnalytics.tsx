'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  salesPipelineService,
  type SalesPipelineAnalytics,
  type SalesStage,
} from '@/services/salesPipeline.service'
import Link from 'next/link'

const STAGE_LABELS: Record<SalesStage, string> = {
  INTERESTED: 'Interessert',
  SENT_TO_SUPPLIER: 'Sendt til leverandør',
  SENT_TO_CUSTOMER: 'Sendt til kunde',
  INTERVIEW: 'Intervju',
  LOST: 'Tapt',
}

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

export default function SalesPipelineAnalyticsComponent() {
  const [analytics, setAnalytics] = useState<SalesPipelineAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

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

  // Calculate the max count for the funnel visualization
  const maxStageCount = Math.max(
    ...analytics.activitiesByStage.map((s) => s.count),
    1
  )

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
            {analytics.wonThisQuarter} dette kvartal, {analytics.wonThisMonth} denne måned
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Win Rate</div>
          <div className="stat-value text-info">{analytics.conversionRate.toFixed(1)}%</div>
          <div className="stat-desc">Vunnet / (Vunnet + Tapt)</div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title">Gj.snitt dager til lukket</div>
          <div className="stat-value">{analytics.averageDaysToClose.toFixed(0)}</div>
          <div className="stat-desc">Fra opprettet til lukket</div>
        </div>
      </div>

      {/* Availability Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Konsulent-tilgjengelighet</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="stat bg-success/10 border border-success/30 rounded-lg p-4">
            <div className="stat-title text-success">Ledige nå</div>
            <div className="stat-value text-success">{analytics.availabilityStats.available}</div>
          </div>
          <div className="stat bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="stat-title text-warning">Blir ledige</div>
            <div className="stat-value text-warning">{analytics.availabilityStats.availableSoon}</div>
          </div>
          <div className="stat bg-error/10 border border-error/30 rounded-lg p-4">
            <div className="stat-title text-error">Opptatt</div>
            <div className="stat-value text-error">{analytics.availabilityStats.occupied}</div>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pipeline Funnel</h2>
        <div className="bg-base-200 rounded-lg p-6">
          {analytics.activitiesByStage
            .filter((s) => s.stage !== 'LOST')
            .map((stageData, index) => {
              const widthPercent = (stageData.count / maxStageCount) * 100
              return (
                <div key={stageData.stage} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{STAGE_LABELS[stageData.stage]}</span>
                    <span className="badge badge-primary">{stageData.count}</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-6">
                    <div
                      className="bg-primary h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(widthPercent, 5)}%`,
                        opacity: 1 - index * 0.15,
                      }}
                    />
                  </div>
                </div>
              )
            })}
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
                  <th className="text-center">Vunnet</th>
                  <th className="text-center">Tapt</th>
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
                      <span className="badge badge-success">{stat.wonTotal}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-error">{stat.lostTotal}</span>
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

      {/* Win/Loss Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Vunnet/Tapt oversikt</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-base-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Denne måneden</div>
            <div className="flex gap-4">
              <div>
                <span className="text-success font-bold text-xl">{analytics.wonThisMonth}</span>
                <span className="text-sm text-gray-500 ml-1">vunnet</span>
              </div>
              <div>
                <span className="text-error font-bold text-xl">{analytics.lostThisMonth}</span>
                <span className="text-sm text-gray-500 ml-1">tapt</span>
              </div>
            </div>
          </div>
          <div className="bg-base-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Dette kvartalet</div>
            <div className="flex gap-4">
              <div>
                <span className="text-success font-bold text-xl">{analytics.wonThisQuarter}</span>
                <span className="text-sm text-gray-500 ml-1">vunnet</span>
              </div>
              <div>
                <span className="text-error font-bold text-xl">{analytics.lostThisQuarter}</span>
                <span className="text-sm text-gray-500 ml-1">tapt</span>
              </div>
            </div>
          </div>
          <div className="bg-base-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Dette året</div>
            <div className="flex gap-4">
              <div>
                <span className="text-success font-bold text-xl">{analytics.wonThisYear}</span>
                <span className="text-sm text-gray-500 ml-1">vunnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
