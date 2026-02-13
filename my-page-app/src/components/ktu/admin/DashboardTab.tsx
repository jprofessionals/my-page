'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktuService, { KtuCompanyTrendStatistics } from '@/services/ktu.service'
import TrendChart from './TrendChart'

export default function DashboardTab() {
  const [trendData, setTrendData] = useState<KtuCompanyTrendStatistics | null>(
    null,
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const trendResponse = await ktuService.getCompanyTrends()

      if (trendResponse.data) {
        setTrendData(trendResponse.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Feil ved lasting av data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate aggregate stats from yearly statistics
  const latestYear = trendData?.yearlyStatistics?.length
    ? Math.max(...trendData.yearlyStatistics.map((ys) => ys.year))
    : null
  const latestStats = latestYear
    ? trendData?.yearlyStatistics?.find((ys) => ys.year === latestYear)
    : null

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Laster oversikt...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary KPIs from latest year */}
      {latestStats && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Siste undersøkelse ({latestStats.year})
          </h2>
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Undersøkelse</p>
                  <p className="text-lg font-bold text-blue-600">
                    {latestStats.roundName}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Svarprosent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {latestStats.responseRate?.toFixed(0) ?? 0}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {latestStats.totalResponses} svar
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Konsulenter</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {latestStats.consultantCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Kunder</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {latestStats.organizationCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Charts */}
      {trendData && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Utvikling over tid
          </h2>

          {/* Response rate trend */}
          {trendData.yearlyStatistics &&
            trendData.yearlyStatistics.length > 0 && (
              <TrendChart
                data={trendData.yearlyStatistics
                  .sort((a, b) => a.year - b.year)
                  .map((ys) => ({
                    year: ys.year,
                    value: ys.responseRate,
                    responseCount: ys.totalResponses,
                  }))}
                title="Svarprosent over tid"
                color="#10B981"
                height={200}
                minValue={0}
                maxValue={100}
                valueSuffix="%"
              />
            )}

          {/* Per-question trends - one chart per question */}
          {trendData.questionTrends && trendData.questionTrends.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Score per spørsmål over tid
              </h3>
              {trendData.questionTrends.map((qt) => {
                const responseCounts = qt.yearlyResponseCounts || {}
                const chartData = Object.entries(qt.yearlyAverages || {})
                  .map(([yearStr, value]) => ({
                    year: parseInt(yearStr),
                    value: value ?? null,
                    // Try both string and number keys since backend might serialize either way
                    responseCount:
                      responseCounts[yearStr] ??
                      responseCounts[parseInt(yearStr) as unknown as string],
                  }))
                  .sort((a, b) => a.year - b.year)

                return (
                  <TrendChart
                    key={qt.questionCode}
                    data={chartData}
                    title={qt.questionText}
                    color="#3B82F6"
                    height={180}
                  />
                )
              })}
            </div>
          )}

          {/* Yearly overview table */}
          {trendData.yearlyStatistics &&
            trendData.yearlyStatistics.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Årlig oversikt
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          År
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Undersøkelse
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Svar
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Svarprosent
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Konsulenter
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Kunder
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trendData.yearlyStatistics
                        .sort((a, b) => b.year - a.year)
                        .map((ys) => (
                          <tr key={ys.year} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              {ys.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ys.roundName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {ys.totalResponses}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {ys.responseRate.toFixed(0)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {ys.consultantCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {ys.organizationCount}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

      {/* No data state */}
      {!trendData && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-500">Ingen data tilgjengelig</p>
          <p className="text-sm text-gray-400 mt-2">
            Opprett undersøkelser og samle inn svar for å se statistikk
          </p>
        </div>
      )}
    </div>
  )
}
