'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktuService, { KtuConsultantStatistics } from '@/services/ktu.service'
import { useYear } from './YearContext'
import ConsultantDetailModal from './ConsultantDetailModal'

export default function ConsultantsTab() {
  const { selectedYear, currentRound } = useYear()
  const [consultantStats, setConsultantStats] = useState<KtuConsultantStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConsultant, setSelectedConsultant] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    if (currentRound) {
      loadConsultantStats()
    } else {
      setConsultantStats([])
      setLoading(false)
    }
  }, [currentRound])

  const loadConsultantStats = async () => {
    if (!currentRound) return

    setLoading(true)
    try {
      const response = await ktuService.getStatisticsByConsultant(currentRound.id)
      setConsultantStats(response.data || [])
    } catch (error) {
      console.error('Failed to load consultant stats:', error)
      toast.error('Feil ved lasting av konsulentstatistikk')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-400'
    if (score >= 5) return 'text-green-600'
    if (score >= 4) return 'text-blue-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-100'
    if (score >= 5) return 'bg-green-100'
    if (score >= 4) return 'bg-blue-100'
    if (score >= 3) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (!selectedYear) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Velg et år for a se konsulenter</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Laster konsulenter for {selectedYear}...</p>
      </div>
    )
  }

  if (!currentRound) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ingen undersøkelse funnet for {selectedYear}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Konsulenter - {selectedYear}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {consultantStats.length} konsulenter med svar i {currentRound.name}
          </p>
        </div>
      </div>

      {/* Consultants list */}
      {consultantStats.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-gray-500">Ingen svar registrert for dette aret</p>
          <p className="text-sm text-gray-400 mt-1">
            Svar vil vises her når kundekontakter har besvart undersøkelsen
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konsulent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Antall svar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gjennomsnitt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score-fordeling
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultantStats
                .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
                .map((consultant) => (
                  <tr
                    key={consultant.consultantId}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedConsultant({
                      id: consultant.consultantId,
                      name: consultant.consultantName,
                    })}
                    title="Klikk for a se detaljer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {consultant.consultantName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {consultant.consultantName}
                          </div>
                          <div className="text-xs text-blue-600">Klikk for detaljer</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{consultant.responseCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{consultant.organizationCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(consultant.averageScore)} ${getScoreColor(consultant.averageScore)}`}
                      >
                        {consultant.averageScore?.toFixed(2) ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6].map((score) => {
                          // Handle both string and number keys from API
                          const dist = consultant.scoreDistribution as Record<string | number, number> | undefined
                          const count = dist?.[score] ?? dist?.[score.toString()] ?? 0
                          return (
                            <div
                              key={score}
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                                count > 0
                                  ? score >= 5
                                    ? 'bg-green-100 text-green-700'
                                    : score >= 3
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  : 'bg-gray-50 text-gray-400'
                              }`}
                              title={`Score ${score}: ${count} svar`}
                            >
                              {count || '-'}
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Consultant Detail Modal */}
      {selectedConsultant && (
        <ConsultantDetailModal
          consultantId={selectedConsultant.id}
          consultantName={selectedConsultant.name}
          isOpen={!!selectedConsultant}
          onClose={() => setSelectedConsultant(null)}
        />
      )}
    </div>
  )
}
