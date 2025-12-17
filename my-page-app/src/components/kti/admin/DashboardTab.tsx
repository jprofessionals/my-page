'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktiService, {
  KtiRoundStatistics,
  KtiCompanyTrendStatistics,
} from '@/services/kti.service'
import { useYear } from './YearContext'
import { MultiLineTrendChart } from './TrendChart'

export default function DashboardTab() {
  const { selectedYear, currentRound } = useYear()
  const [currentStats, setCurrentStats] = useState<KtiRoundStatistics | null>(null)
  const [trendData, setTrendData] = useState<KtiCompanyTrendStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedYear, currentRound])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load trend data (all years)
      const trendResponse = await ktiService.getCompanyTrends()
      if (trendResponse.data) {
        setTrendData(trendResponse.data)
      }

      // Load current year stats if we have a round
      if (currentRound) {
        const statsResponse = await ktiService.getRoundStatistics(currentRound.id)
        if (statsResponse.data) {
          setCurrentStats(statsResponse.data)
        }
      } else {
        setCurrentStats(null)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Feil ved lasting av data')
    } finally {
      setLoading(false)
    }
  }

  // Generate chart colors for questions
  const questionColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
  ]

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
      {/* KPIs for selected year */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedYear ? `Nokkeltal ${selectedYear}` : 'Nokkeltal'}
        </h2>

        {!currentRound ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Velg et år for a se nøkkeltall
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Response Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Svarprosent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {currentStats?.responseRate?.toFixed(0) ?? 0}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {currentStats?.totalResponses ?? 0} av {currentStats?.totalInvitations ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Consultants */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Konsulenter</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {currentStats?.consultantCount ?? 0}
                  </p>
                  <p className="text-xs text-gray-400">med svar</p>
                </div>
              </div>
            </div>

            {/* Organizations */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Kunder</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {currentStats?.organizationCount ?? 0}
                  </p>
                  <p className="text-xs text-gray-400">med svar</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score Distribution per question for selected year */}
      {currentStats?.questionStatistics && currentStats.questionStatistics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score-fordeling per spørsmål {selectedYear}</h3>
          <div className="space-y-6">
            {currentStats.questionStatistics.map((qs) => (
              <div key={qs.questionId} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{qs.questionText}</span>
                  </div>
                  <div className="ml-4 text-right">
                    <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded ${
                      (qs.averageScore ?? 0) >= 5
                        ? 'bg-green-100 text-green-800'
                        : (qs.averageScore ?? 0) >= 4
                          ? 'bg-blue-100 text-blue-800'
                          : (qs.averageScore ?? 0) >= 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                      {qs.averageScore?.toFixed(2) ?? '-'}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{qs.responseCount} svar</div>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {[1, 2, 3, 4, 5, 6].map((score) => {
                    // Handle both string and number keys from API
                    const dist = qs.scoreDistribution as Record<string | number, number> | undefined
                    const count = dist?.[score] ?? dist?.[score.toString()] ?? 0
                    const allValues = Object.values(dist || {}).filter((v): v is number => typeof v === 'number')
                    const maxCount = allValues.length > 0 ? Math.max(...allValues, 1) : 1
                    const heightPx = maxCount > 0 ? Math.max((count / maxCount) * 48, count > 0 ? 4 : 0) : 0
                    return (
                      <div key={score} className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-0.5">{count > 0 ? count : ''}</div>
                        <div
                          className={`w-full rounded-t transition-all ${
                            score >= 5 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ height: `${heightPx}px` }}
                        />
                        <div className="text-xs text-gray-600 mt-1">{score}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Charts */}
      {trendData && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Utvikling over tid</h2>

          {/* Per-question trends */}
          {trendData.questionTrends && trendData.questionTrends.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Score per spørsmål over tid
              </h3>

              {/* Create multi-line chart data */}
              {(() => {
                // Get all years from the data
                const allYears = new Set<number>()
                trendData.questionTrends.forEach((qt) => {
                  Object.keys(qt.yearlyAverages || {}).forEach((y) => allYears.add(parseInt(y)))
                })
                const sortedYears = Array.from(allYears).sort((a, b) => a - b)

                const chartData = sortedYears.map((year) => {
                  const values: Record<string, number | null> = {}
                  trendData.questionTrends.forEach((qt) => {
                    const yearStr = year.toString()
                    values[qt.questionCode] = qt.yearlyAverages?.[yearStr] ?? null
                  })
                  return { year, values }
                })

                const series = trendData.questionTrends.map((qt, idx) => ({
                  key: qt.questionCode,
                  label: qt.questionText.length > 50 ? qt.questionText.slice(0, 50) + '...' : qt.questionText,
                  color: questionColors[idx % questionColors.length],
                }))

                return <MultiLineTrendChart data={chartData} series={series} title="" height={350} />
              })()}
            </div>
          )}

          {/* Yearly overview table */}
          {trendData.yearlyStatistics && trendData.yearlyStatistics.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Arlig oversikt</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">År</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Undersøkelse</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Svar</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Svarprosent</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Konsulenter</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kunder</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trendData.yearlyStatistics
                      .sort((a, b) => b.year - a.year)
                      .map((ys) => (
                        <tr
                          key={ys.year}
                          className={`hover:bg-gray-50 ${ys.year === selectedYear ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{ys.year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ys.roundName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{ys.totalResponses}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{ys.responseRate.toFixed(0)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{ys.consultantCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{ys.organizationCount}</td>
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
            Opprett undersøkelser og samle inn svar for a se statistikk
          </p>
        </div>
      )}
    </div>
  )
}
