'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktiService, {
  KtiConsultantOwnStatistics,
  KtiConsultantYearlyStats,
} from '@/services/kti.service'
import TrendChart from '../admin/TrendChart'
import FeedbackList from './FeedbackList'

type Tab = 'oversikt' | 'tilbakemeldinger'

export default function ConsultantKtiDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('oversikt')
  const [statistics, setStatistics] = useState<KtiConsultantOwnStatistics | null>(null)
  const [trends, setTrends] = useState<KtiConsultantYearlyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsResponse, trendsResponse] = await Promise.all([
        ktiService.getMyStatistics(),
        ktiService.getMyTrends(),
      ])

      if (statsResponse.data) {
        setStatistics(statsResponse.data)
      }
      if (trendsResponse.data) {
        setTrends(trendsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load KTI data:', error)
      toast.error('Kunne ikke laste KTI-data')
    } finally {
      setLoading(false)
    }
  }

  const formatDelta = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current == null || previous == null) return null
    const delta = current - previous
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(2)}`
  }

  const getDeltaColor = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current == null || previous == null) return 'text-gray-500'
    const delta = current - previous
    if (delta > 0) return 'text-green-600'
    if (delta < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  // Build trend chart data
  const trendChartData = trends?.yearlyData
    ? Object.entries(trends.yearlyData)
        .map(([year, data]) => ({
          year: parseInt(year),
          value: data.averageScore ?? null,
        }))
        .sort((a, b) => a.year - b.year)
    : []

  // Group question averages by category
  const categoryBreakdown = statistics?.questionAverages
    ? statistics.questionAverages.reduce(
        (acc, qa) => {
          const category = qa.category || 'Ukategorisert'
          if (!acc[category]) {
            acc[category] = []
          }
          acc[category].push(qa)
          return acc
        },
        {} as Record<string, typeof statistics.questionAverages>
      )
    : {}

  const tabs: { id: Tab; label: string }[] = [
    { id: 'oversikt', label: 'Oversikt' },
    { id: 'tilbakemeldinger', label: 'Tilbakemeldinger' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Laster KTI-resultater...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mine KTI-resultater</h1>
          <p className="mt-2 text-gray-600">
            Se dine tilbakemeldinger fra kundetilfredshetsundersokelser
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'oversikt' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nøkkeltall</h2>
              {!statistics || statistics.totalResponses === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  Du har ingen KTI-tilbakemeldinger ennå
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Average Score */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Gjennomsnittsscore</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {statistics.averageScore?.toFixed(2) ?? '-'}
                        </p>
                        {statistics.currentYearStats?.averageScore && statistics.previousYearStats?.averageScore && (
                          <p className={`text-xs ${getDeltaColor(statistics.currentYearStats.averageScore, statistics.previousYearStats.averageScore)}`}>
                            {formatDelta(statistics.currentYearStats.averageScore, statistics.previousYearStats.averageScore)} fra i fjor
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Total Responses */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Tilbakemeldinger</p>
                        <p className="text-2xl font-bold text-green-600">
                          {statistics.totalResponses}
                        </p>
                        <p className="text-xs text-gray-400">totalt</p>
                      </div>
                    </div>
                  </div>

                  {/* Rounds Participated */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Undersøkelser</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {statistics.roundsParticipated}
                        </p>
                        <p className="text-xs text-gray-400">deltatt i</p>
                      </div>
                    </div>
                  </div>

                  {/* Organizations (Current Year) */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Kunder i år</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {statistics.currentYearStats?.organizationCount ?? 0}
                        </p>
                        <p className="text-xs text-gray-400">ga tilbakemelding</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trend Chart */}
            {trendChartData.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Utvikling over tid</h2>
                <div className="max-w-2xl">
                  <TrendChart
                    data={trendChartData}
                    title="Din gjennomsnittsscore per år"
                    color="#3B82F6"
                    height={250}
                  />
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            {Object.keys(categoryBreakdown).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Score per kategori</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(categoryBreakdown).map(([category, questions]) => (
                    <div key={category} className="bg-white rounded-lg shadow p-6">
                      <h3 className="font-medium text-gray-900 mb-4">{category}</h3>
                      <div className="space-y-3">
                        {questions.map((q) => (
                          <div key={q.questionId} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex-1 mr-4">{q.questionText}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${((q.averageScore ?? 0) / 6) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-10 text-right">
                                {q.averageScore?.toFixed(1) ?? '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tilbakemeldinger' && <FeedbackList />}
      </div>
    </div>
  )
}
