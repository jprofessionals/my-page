// components/hyttetrekning/AdminDashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import cabinLotteryService from '@/services/cabinLottery.service'

interface Drawing {
  id: string
  season: string
  status: string
  createdAt: string
  periods?: Array<unknown>
}

export default function AdminDashboard() {
  const router = useRouter()
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newSeason, setNewSeason] = useState('')

  useEffect(() => {
    loadDrawings()
  }, [])

  const loadDrawings = async () => {
    try {
      const response = await cabinLotteryService.adminGetAllDrawings()
      setDrawings(response.data)
    } catch (error) {
      console.error('Failed to load drawings:', error)
      toast.error('Feil ved lasting av trekkinger')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDrawing = async () => {
    if (!newSeason.trim()) {
      toast.warning('Vennligst fyll inn sesong')
      return
    }

    setCreating(true)
    try {
      const response = await cabinLotteryService.adminCreateDrawing(newSeason)
      router.push(`/admin/hyttetrekning/${response.data.id}`)
    } catch (error) {
      console.error('Failed to create drawing:', error)
      toast.error('Feil ved opprettelse av trekning')
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-green-100 text-green-800',
      LOCKED: 'bg-yellow-100 text-yellow-800',
      DRAWN: 'bg-blue-100 text-blue-800',
      PUBLISHED: 'bg-purple-100 text-purple-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      OPEN: 'Åpen',
      LOCKED: 'Låst',
      DRAWN: 'Trukket',
      PUBLISHED: 'Publisert',
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laster...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hyttetrekning - Admin</h1>
          <p className="mt-2 text-gray-600">
            Administrer hyttetrekkinger (vinter/sommer)
          </p>
        </div>

        {/* Create new drawing */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Opprett ny trekning</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newSeason}
              onChange={(e) => setNewSeason(e.target.value)}
              placeholder="F.eks. VINTER_2025_2026"
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCreateDrawing}
              disabled={creating}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {creating ? 'Oppretter...' : 'Opprett trekning'}
            </button>
          </div>
        </div>

        {/* Drawings list */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Eksisterende trekkinger</h2>
          </div>

          {drawings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Ingen trekkinger funnet. Opprett en ny trekning for å komme i gang.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {drawings.map((drawing) => (
                <div
                  key={drawing.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/hyttetrekning/${drawing.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {drawing.season}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                            drawing.status
                          )}`}
                        >
                          {getStatusText(drawing.status)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Opprettet: {new Date(drawing.createdAt).toLocaleDateString('nb-NO')}
                        {drawing.periods && drawing.periods.length > 0 && (
                          <span className="ml-4">
                            {drawing.periods.length} periode(r)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
