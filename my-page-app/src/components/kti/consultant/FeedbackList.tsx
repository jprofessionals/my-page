'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktiService, { KtiResponseSummary } from '@/services/kti.service'

export default function FeedbackList() {
  const [responses, setResponses] = useState<KtiResponseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    loadResponses()
  }, [])

  const loadResponses = async () => {
    setLoading(true)
    try {
      const response = await ktiService.getMyResponses()
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

  const getScoreBgColor = (score: number | null | undefined) => {
    if (score == null) return 'bg-gray-100'
    if (score >= 5) return 'bg-green-100'
    if (score >= 4) return 'bg-blue-100'
    if (score >= 3) return 'bg-yellow-100'
    return 'bg-red-100'
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen tilbakemeldinger</h3>
        <p className="text-gray-500">Du har ikke mottatt noen tilbakemeldinger ennå.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {responses.length} {responses.length === 1 ? 'tilbakemelding' : 'tilbakemeldinger'}
        </h2>
      </div>

      <div className="space-y-4">
        {responses.map((response) => (
          <div
            key={response.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {/* Header - Always visible */}
            <button
              onClick={() => setExpandedId(expandedId === response.id ? null : response.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Score badge */}
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${getScoreBgColor(response.averageScore)}`}
                >
                  <span className={`text-lg font-bold ${getScoreColor(response.averageScore)}`}>
                    {response.averageScore?.toFixed(1) ?? '-'}
                  </span>
                </div>

                {/* Contact and organization info */}
                <div className="text-left">
                  <p className="font-medium text-gray-900">{response.contactName}</p>
                  <p className="text-sm text-gray-500">{response.organizationName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{formatDate(response.respondedAt)}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === response.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {expandedId === response.id && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                <div className="space-y-4">
                  {/* Rating questions */}
                  {response.questionResponses
                    ?.filter((qr) => qr.questionType === 'RATING_1_6')
                    .map((qr) => (
                      <div key={qr.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">{qr.questionText}</span>
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
                          <span className={`text-sm font-medium ${getScoreColor(qr.ratingValue)}`}>
                            {qr.ratingValue ?? '-'}
                          </span>
                        </div>
                      </div>
                    ))}

                  {/* Text responses */}
                  {response.questionResponses
                    ?.filter((qr) => qr.questionType === 'FREE_TEXT' && qr.textValue)
                    .map((qr) => (
                      <div key={qr.id} className="py-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">{qr.questionText}</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 italic">&quot;{qr.textValue}&quot;</p>
                        </div>
                      </div>
                    ))}

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
        ))}
      </div>
    </div>
  )
}
