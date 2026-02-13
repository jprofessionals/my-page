'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import ktuService, { KtuResponseSummary } from '@/services/ktu.service'

export default function FeedbackList() {
  const [responses, setResponses] = useState<KtuResponseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  useEffect(() => {
    loadResponses()
  }, [])

  const loadResponses = async () => {
    setLoading(true)
    try {
      const response = await ktuService.getMyResponses()
      if (response.data) {
        setResponses(response.data)
      }
    } catch (error) {
      console.error('Failed to load responses:', error)
      toast.error('Kunne ikke laste tilbakemeldinger')
    } finally {
      setLoading(false)
    }
  }

  // Get unique years from responses
  const availableYears = useMemo(() => {
    const years = responses
      .map((r) => r.year)
      .filter((y): y is number => y != null)
    return [...new Set(years)].sort((a, b) => b - a)
  }, [responses])

  // Filter responses by selected year
  const filteredResponses = useMemo(() => {
    if (selectedYear === 'all') return responses
    return responses.filter((r) => r.year === selectedYear)
  }, [responses, selectedYear])

  // Group responses by year for display
  const responsesByYear = useMemo(() => {
    const grouped: Record<number, KtuResponseSummary[]> = {}
    filteredResponses.forEach((r) => {
      const year = r.year ?? 0
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(r)
    })
    // Sort years descending
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({ year: Number(year), items }))
  }, [filteredResponses])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Ukjent dato'
    const date = new Date(dateString)
    return date.toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return 'text-gray-400'
    if (score >= 5) return 'text-green-600'
    if (score >= 4) return 'text-blue-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get text comments from a response
  const getComments = (response: KtuResponseSummary) => {
    return (
      response.questionResponses?.filter(
        (qr) => qr.questionType === 'FREE_TEXT' && qr.textValue,
      ) ?? []
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Laster tilbakemeldinger...</p>
      </div>
    )
  }

  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Ingen tilbakemeldinger
        </h3>
        <p className="text-gray-500">
          Du har ikke mottatt noen tilbakemeldinger enn.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with year filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {filteredResponses.length}{' '}
          {filteredResponses.length === 1
            ? 'tilbakemelding'
            : 'tilbakemeldinger'}
          {selectedYear !== 'all' && ` fra ${selectedYear}`}
        </h2>

        {availableYears.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filtrer:</span>
            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === 'all' ? 'all' : Number(e.target.value),
                )
              }
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle ({responses.length})</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year} ({responses.filter((r) => r.year === year).length})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Responses grouped by year */}
      {responsesByYear.map(({ year, items }) => (
        <div key={year} className="space-y-4">
          {/* Year header (only show if showing all years) */}
          {selectedYear === 'all' && availableYears.length > 1 && (
            <div className="flex items-center gap-3">
              <h3 className="text-md font-semibold text-gray-700">
                {year || 'Ukjent'}
              </h3>
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-400">{items.length} svar</span>
            </div>
          )}

          {/* Response cards */}
          <div className="space-y-4">
            {items.map((response) => {
              const comments = getComments(response)
              const hasComments = comments.length > 0

              return (
                <div
                  key={response.id}
                  className="bg-white rounded-lg shadow overflow-hidden"
                >
                  {/* Header - Always visible */}
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === response.id ? null : response.id,
                      )
                    }
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Organization initial */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                        <span className="text-lg font-bold text-blue-600">
                          {response.organizationName?.charAt(0).toUpperCase() ??
                            '?'}
                        </span>
                      </div>

                      {/* Contact and organization info */}
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {response.contactName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {response.organizationName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Comment indicator */}
                      {hasComments && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          {comments.length} kommentar
                          {comments.length > 1 ? 'er' : ''}
                        </span>
                      )}
                      <span className="text-sm text-gray-400">
                        {formatDate(response.respondedAt)}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === response.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Comments preview (always visible if there are comments) */}
                  {hasComments && expandedId !== response.id && (
                    <div className="px-6 pb-4 pt-0 border-t border-gray-100">
                      {comments.slice(0, 1).map((qr) => (
                        <div
                          key={qr.id}
                          className="bg-blue-50 rounded-lg p-3 mt-3"
                        >
                          <p className="text-sm text-gray-600 italic line-clamp-2">
                            &quot;{qr.textValue}&quot;
                          </p>
                          {comments.length > 1 && (
                            <p className="text-xs text-blue-500 mt-1">
                              + {comments.length - 1} flere kommentarer
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expanded content */}
                  {expandedId === response.id && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                      <div className="space-y-4">
                        {/* Round info */}
                        {response.roundName && (
                          <div className="text-xs text-gray-400 mb-2">
                            Undersokelse: {response.roundName}
                          </div>
                        )}

                        {/* Rating questions */}
                        {response.questionResponses
                          ?.filter((qr) => qr.questionType === 'RATING_1_6')
                          .map((qr) => (
                            <div
                              key={qr.id}
                              className="flex items-center justify-between py-2"
                            >
                              <span className="text-sm text-gray-700">
                                {qr.questionText}
                              </span>
                              <div className="flex items-center gap-2">
                                {/* Visual rating bar */}
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5, 6].map((n) => (
                                    <div
                                      key={n}
                                      className={`w-4 h-4 rounded ${
                                        qr.ratingValue && n <= qr.ratingValue
                                          ? 'bg-blue-500'
                                          : 'bg-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span
                                  className={`text-sm font-medium ${getScoreColor(qr.ratingValue)}`}
                                >
                                  {qr.ratingValue ?? '-'}
                                </span>
                              </div>
                            </div>
                          ))}

                        {/* Text responses / Comments */}
                        {comments.length > 0 && (
                          <div className="pt-2 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Kommentarer
                            </h4>
                            <div className="space-y-3">
                              {comments.map((qr) => (
                                <div
                                  key={qr.id}
                                  className="bg-blue-50 rounded-lg p-3"
                                >
                                  <p className="text-xs text-gray-500 mb-1">
                                    {qr.questionText}
                                  </p>
                                  <p className="text-sm text-gray-700 italic">
                                    &quot;{qr.textValue}&quot;
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contact email */}
                        {response.contactEmail && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                              Kontakt: {response.contactEmail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
