'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktuService, {
  KtuConsultantOwnStatistics,
  KtuConsultantYearlyStats,
  KtuResponseSummary,
} from '@/services/ktu.service'
import TrendChart from './TrendChart'

interface Props {
  consultantId: number
  consultantName: string
  isOpen: boolean
  onClose: () => void
}

export default function ConsultantDetailModal({
  consultantId,
  consultantName,
  isOpen,
  onClose,
}: Props) {
  const [statistics, setStatistics] = useState<KtuConsultantOwnStatistics | null>(null)
  const [trends, setTrends] = useState<KtuConsultantYearlyStats | null>(null)
  const [responses, setResponses] = useState<KtuResponseSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && consultantId) {
      loadData()
    }
  }, [isOpen, consultantId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsResponse, trendsResponse, responsesResponse] = await Promise.all([
        ktuService.getConsultantStatisticsAdmin(consultantId),
        ktuService.getConsultantTrendsAdmin(consultantId),
        ktuService.getConsultantResponsesAdmin(consultantId),
      ])

      if (statsResponse.data) {
        setStatistics(statsResponse.data)
      }
      if (trendsResponse.data) {
        setTrends(trendsResponse.data)
      }
      if (responsesResponse.data) {
        setResponses(responsesResponse.data)
      }
    } catch (error) {
      console.error('Failed to load consultant KTU data:', error)
      toast.error('Kunne ikke laste KTU-data for konsulenten')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                KTU-resultater for {consultantName}
              </h2>
              <p className="text-sm text-gray-500">
                Statistikk og tilbakemeldinger fra kundetilfredshetsundersokelser
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Laster KTU-resultater...</p>
              </div>
            ) : !statistics || statistics.totalResponses === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                Ingen KTU-tilbakemeldinger for denne konsulenten
              </div>
            ) : (
              <div className="space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Average Score */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Gjennomsnitt</p>
                        <p className="text-xl font-bold text-blue-600">
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
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Tilbakemeldinger</p>
                        <p className="text-xl font-bold text-green-600">
                          {statistics.totalResponses}
                        </p>
                        <p className="text-xs text-gray-400">totalt</p>
                      </div>
                    </div>
                  </div>

                  {/* Rounds Participated */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Undersokelser</p>
                        <p className="text-xl font-bold text-purple-600">
                          {statistics.roundsParticipated}
                        </p>
                        <p className="text-xs text-gray-400">deltatt i</p>
                      </div>
                    </div>
                  </div>

                  {/* Organizations (Current Year) */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Kunder i ar</p>
                        <p className="text-xl font-bold text-orange-600">
                          {statistics.currentYearStats?.organizationCount ?? 0}
                        </p>
                        <p className="text-xs text-gray-400">ga tilbakemelding</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trend Chart */}
                {trendChartData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Utvikling over tid</h3>
                    <div className="max-w-xl">
                      <TrendChart
                        data={trendChartData}
                        title="Gjennomsnittsscore per ar"
                        color="#3B82F6"
                        height={200}
                      />
                    </div>
                  </div>
                )}

                {/* Individual Responses with Ratings */}
                {responses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Alle tilbakemeldinger ({responses.length})
                    </h3>
                    <div className="space-y-4">
                      {responses.map((response) => {
                        const getScoreColor = (score: number) => {
                          if (score >= 5) return 'bg-green-100 text-green-700'
                          if (score >= 4) return 'bg-blue-100 text-blue-700'
                          if (score >= 3) return 'bg-yellow-100 text-yellow-700'
                          return 'bg-red-100 text-red-700'
                        }
                        return (
                          <div key={response.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-gray-900">{response.organizationName}</p>
                                <p className="text-sm text-gray-500">
                                  {response.contactName}
                                  {response.respondedAt && (
                                    <span className="text-gray-400">
                                      {' '}&middot; {new Date(response.respondedAt).toLocaleDateString('nb-NO')}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Show all questions in order */}
                            <div className="space-y-2">
                              {response.questionResponses?.map((qr) => {
                                const hasScore = qr.ratingValue != null
                                const hasText = qr.textValue != null && qr.textValue !== ''
                                const isTextOnlyQuestion = qr.questionType === 'FREE_TEXT'

                                // Text-only question (FREE_TEXT) - show question and comment
                                if (isTextOnlyQuestion) {
                                  if (!hasText) return null
                                  return (
                                    <div key={`q-${qr.questionId}`} className="bg-white rounded p-3">
                                      <p className="text-sm text-gray-500 mb-1">{qr.questionText}</p>
                                      <p className="text-sm text-gray-700 italic pl-3 border-l-2 border-blue-300">{qr.textValue}</p>
                                    </div>
                                  )
                                }

                                // Rating question (or unknown type) - show with score or dash
                                return (
                                  <div key={`q-${qr.questionId}`} className="bg-white rounded p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-sm text-gray-700 flex-1">{qr.questionText}</p>
                                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${hasScore ? getScoreColor(qr.ratingValue!) : 'bg-gray-100 text-gray-400'}`}>
                                        {hasScore ? qr.ratingValue : '-'}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
