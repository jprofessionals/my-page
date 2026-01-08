'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import ktuService, { KtuResponseSummary, KtuCompanyTrendStatistics } from '@/services/ktu.service'
import TrendChart from '@/components/ktu/admin/TrendChart'

// Helper to get score color
const getScoreColor = (score: number | null | undefined) => {
  if (score == null) return 'text-gray-400'
  if (score >= 5) return 'text-green-600'
  if (score >= 4) return 'text-blue-600'
  if (score >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

const getScoreBgColor = (score: number | null | undefined) => {
  if (score == null) return 'bg-gray-100'
  if (score >= 5) return 'bg-green-50'
  if (score >= 4) return 'bg-blue-50'
  if (score >= 3) return 'bg-yellow-50'
  return 'bg-red-50'
}

const MAX_YEARS_DEFAULT = 5

export default function ConsultantKtuDashboard() {
  const [responses, setResponses] = useState<KtuResponseSummary[]>([])
  const [companyTrends, setCompanyTrends] = useState<KtuCompanyTrendStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllYears, setShowAllYears] = useState(false)
  const [showCompanyTrends, setShowCompanyTrends] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [responsesData, trendsData] = await Promise.all([
        ktuService.getMyResponses(),
        ktuService.getCompanyTrends(),
      ])
      if (responsesData.data) {
        setResponses(responsesData.data)
      }
      if (trendsData.data) {
        setCompanyTrends(trendsData.data)
      }
    } catch (error) {
      console.error('Failed to load KTU data:', error)
      toast.error('Kunne ikke laste KTU-data')
    } finally {
      setLoading(false)
    }
  }

  // Get sorted years (descending)
  const allYears = useMemo(() => {
    const yearSet = new Set(responses.map((r) => r.year ?? 0))
    return Array.from(yearSet).sort((a, b) => b - a)
  }, [responses])

  // Years to display in table (limited unless showAllYears)
  const displayYears = useMemo(() => {
    if (showAllYears || allYears.length <= MAX_YEARS_DEFAULT) {
      return allYears
    }
    return allYears.slice(0, MAX_YEARS_DEFAULT)
  }, [allYears, showAllYears])

  const hasMoreYears = allYears.length > MAX_YEARS_DEFAULT

  // Calculate per-question scores per year
  const questionScoresByYear = useMemo(() => {
    const result: Record<number, Record<string, { questionText: string; scores: number[]; count: number }>> = {}

    responses.forEach((r) => {
      const year = r.year ?? 0
      if (!result[year]) result[year] = {}

      r.questionResponses?.forEach((qr) => {
        if (qr.questionType === 'RATING_1_6' && qr.ratingValue != null) {
          const key = qr.questionCode ?? qr.questionId?.toString() ?? 'unknown'
          if (!result[year][key]) {
            result[year][key] = { questionText: qr.questionText ?? '', scores: [], count: 0 }
          }
          result[year][key].scores.push(qr.ratingValue)
          result[year][key].count++
        }
      })
    })

    return result
  }, [responses])

  // Get unique question codes across all years
  const allQuestionCodes = useMemo(() => {
    const codes = new Set<string>()
    Object.values(questionScoresByYear).forEach((yearData) => {
      Object.keys(yearData).forEach((code) => codes.add(code))
    })
    return Array.from(codes).sort()
  }, [questionScoresByYear])

  // Get question text for a code
  const getQuestionText = (code: string) => {
    for (const yearData of Object.values(questionScoresByYear)) {
      if (yearData[code]) return yearData[code].questionText
    }
    return code
  }

  // Calculate average for a question in a year
  const getQuestionAverage = (year: number, code: string) => {
    const data = questionScoresByYear[year]?.[code]
    if (!data || data.scores.length === 0) return null
    return data.scores.reduce((a, b) => a + b, 0) / data.scores.length
  }

  // Get all comments grouped by year
  const commentsByYear = useMemo(() => {
    const result: Record<number, Array<{
      id: number
      contactName: string
      organizationName: string
      roundName?: string
      respondedAt?: string
      questionText?: string
      comment: string
    }>> = {}

    responses.forEach((r) => {
      const year = r.year ?? 0
      if (!result[year]) result[year] = []

      r.questionResponses?.forEach((qr) => {
        if (qr.questionType === 'FREE_TEXT' && qr.textValue) {
          result[year].push({
            id: qr.id ?? r.id ?? 0,
            contactName: r.contactName ?? 'Ukjent',
            organizationName: r.organizationName ?? 'Ukjent',
            roundName: r.roundName,
            respondedAt: r.respondedAt,
            questionText: qr.questionText,
            comment: qr.textValue,
          })
        }
      })
    })

    return result
  }, [responses])

  // Check if there are any comments
  const hasAnyComments = useMemo(() => {
    return Object.values(commentsByYear).some((comments) => comments.length > 0)
  }, [commentsByYear])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('nb-NO', { month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Laster KTU-resultater...</p>
          </div>
        </div>
      </div>
    )
  }

  if (responses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mine KTU-resultater</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen tilbakemeldinger</h3>
            <p className="text-gray-500">Du har ikke mottatt noen KTU-tilbakemeldinger enna.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Mine KTU-resultater</h1>
          <p className="mt-2 text-gray-600">
            {responses.length} tilbakemeldinger fra {allYears.length} {allYears.length === 1 ? 'undersøkelse' : 'undersøkelser'}
          </p>
        </div>

        {/* Company trends section */}
        {companyTrends && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <button
              onClick={() => setShowCompanyTrends(!showCompanyTrends)}
              className="w-full p-4 border-b flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">JPros samlede resultater</h2>
                <p className="text-sm text-gray-500 mt-1">Se hvordan hele selskapet scorer</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showCompanyTrends ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCompanyTrends && (
              <div className="p-4 space-y-6">
                {/* Response rate trend */}
                {companyTrends.yearlyStatistics && companyTrends.yearlyStatistics.length > 0 && (
                  <TrendChart
                    data={companyTrends.yearlyStatistics
                      .sort((a, b) => a.year - b.year)
                      .map((ys) => ({
                        year: ys.year,
                        value: ys.responseRate,
                        responseCount: ys.totalResponses,
                      }))}
                    title="Svarprosent over tid"
                    color="#10B981"
                    height={180}
                    minValue={0}
                    maxValue={100}
                    valueSuffix="%"
                  />
                )}

                {/* Per-question trends */}
                {companyTrends.questionTrends && companyTrends.questionTrends.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-700">Score per spørsmål over tid</h3>
                    {companyTrends.questionTrends.map((qt) => {
                      const responseCounts = qt.yearlyResponseCounts || {}
                      const chartData = Object.entries(qt.yearlyAverages || {})
                        .map(([yearStr, value]) => ({
                          year: parseInt(yearStr),
                          value: value ?? null,
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
                          height={160}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Score per question per year - Table */}
        {allQuestionCodes.length > 0 && allYears.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Score per spørsmål per år</h2>
                <p className="text-sm text-gray-500 mt-1">Skala 1-6 (6 er best)</p>
              </div>
              {hasMoreYears && (
                <button
                  onClick={() => setShowAllYears(!showAllYears)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAllYears ? `Vis siste ${MAX_YEARS_DEFAULT} år` : `Vis alle ${allYears.length} år`}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                      Spørsmål
                    </th>
                    {displayYears.map((year) => (
                      <th key={year} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {year || 'Ukjent'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allQuestionCodes.map((code) => (
                    <tr key={code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {getQuestionText(code)}
                      </td>
                      {displayYears.map((year) => {
                        const avg = getQuestionAverage(year, code)
                        const count = questionScoresByYear[year]?.[code]?.count ?? 0
                        return (
                          <td key={year} className="px-4 py-3 text-center">
                            {avg != null ? (
                              <div className={`inline-flex flex-col items-center px-3 py-1 rounded ${getScoreBgColor(avg)}`}>
                                <span className={`text-lg font-bold ${getScoreColor(avg)}`}>
                                  {avg.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-400">({count} svar)</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Respondents section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Hvem har svart</h2>
            <p className="text-sm text-gray-500 mt-1">Kontaktpersoner som har gitt tilbakemelding</p>
          </div>
          <div className="divide-y divide-gray-100">
            {allYears.map((year) => {
              const yearResponses = responses.filter((r) => (r.year ?? 0) === year)
              if (yearResponses.length === 0) return null

              return (
                <div key={year} className="p-4">
                  {allYears.length > 1 && (
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{year} ({yearResponses.length} svar)</h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {yearResponses.map((r) => (
                      <div key={r.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 text-sm">{r.contactName}</p>
                        <p className="text-xs text-gray-500">{r.organizationName}</p>
                        {r.contactEmail && (
                          <p className="text-xs text-blue-600 mt-1">{r.contactEmail}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Comments section */}
        {hasAnyComments && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Kommentarer</h2>
              <p className="text-sm text-gray-500 mt-1">Fritekst-tilbakemeldinger fra kundene</p>
            </div>
            <div className="divide-y divide-gray-100">
              {allYears.map((year) => {
                const yearComments = commentsByYear[year] ?? []
                if (yearComments.length === 0) return null

                return (
                  <div key={year} className="p-4">
                    {allYears.length > 1 && (
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">{year}</h3>
                    )}
                    <div className="space-y-3">
                      {yearComments.map((comment, idx) => (
                        <div key={`${comment.id}-${idx}`} className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{comment.contactName}</p>
                              <p className="text-xs text-gray-500">{comment.organizationName}</p>
                            </div>
                            {comment.respondedAt && (
                              <span className="text-xs text-gray-400">{formatDate(comment.respondedAt)}</span>
                            )}
                          </div>
                          {comment.questionText && (
                            <p className="text-xs text-gray-500 mb-1">{comment.questionText}</p>
                          )}
                          <p className="text-sm text-gray-700 italic">&quot;{comment.comment}&quot;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No comments message */}
        {!hasAnyComments && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            <p>Ingen fritekst-kommentarer mottatt ennå.</p>
          </div>
        )}
      </div>
    </div>
  )
}
