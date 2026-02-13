'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktuService, {
  KtuRound,
  KtuRoundStatus,
  CreateKtuRound,
  UpdateKtuRound,
} from '@/services/ktu.service'

export default function RoundsTab() {
  const [rounds, setRounds] = useState<KtuRound[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRound, setNewRound] = useState<CreateKtuRound>({
    name: '',
    year: new Date().getFullYear(),
  })
  const [editRound, setEditRound] = useState<KtuRound | null>(null)

  useEffect(() => {
    loadRounds()
  }, [])

  const loadRounds = async () => {
    try {
      const response = await ktuService.getRounds()
      setRounds(response.data || [])
    } catch (error) {
      console.error('Failed to load rounds:', error)
      toast.error('Feil ved lasting av runder')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRound = async () => {
    if (!newRound.name.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }

    setCreating(true)
    try {
      await ktuService.createRound(newRound)
      toast.success('Runde opprettet')
      setShowCreateModal(false)
      setNewRound({ name: '', year: new Date().getFullYear() })
      loadRounds()
    } catch (error) {
      console.error('Failed to create round:', error)
      toast.error('Feil ved opprettelse av runde')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteRound = async (id: number) => {
    if (!confirm('Er du sikker på at du vil slette denne runden?')) return

    try {
      await ktuService.deleteRound(id)
      toast.success('Runde slettet')
      loadRounds()
    } catch (error) {
      console.error('Failed to delete round:', error)
      toast.error('Feil ved sletting av runde. Kun DRAFT-runder kan slettes.')
    }
  }

  const handleUpdateRound = async () => {
    if (!editRound) return

    try {
      const updateData: UpdateKtuRound = {
        name: editRound.name,
        status: editRound.status,
        openDate: editRound.openDate,
        closeDate: editRound.closeDate,
      }
      await ktuService.updateRound(editRound.id, updateData)
      toast.success('Undersøkelse oppdatert')
      setShowEditModal(false)
      setEditRound(null)
      loadRounds()
    } catch (error) {
      console.error('Failed to update round:', error)
      toast.error('Feil ved oppdatering av undersøkelse')
    }
  }

  const openEditModal = (round: KtuRound) => {
    setEditRound({ ...round })
    setShowEditModal(true)
  }

  const getStatusBadge = (status: KtuRoundStatus) => {
    const styles: Record<KtuRoundStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      OPEN: 'bg-green-100 text-green-800',
      CLOSED: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: KtuRoundStatus) => {
    const texts: Record<KtuRoundStatus, string> = {
      DRAFT: 'Utkast',
      OPEN: 'Åpen',
      CLOSED: 'Lukket',
    }
    return texts[status] || status
  }

  if (loading) {
    return <div className="text-center py-8">Laster runder...</div>
  }

  return (
    <div>
      {/* Create button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Opprett ny runde
        </button>
      </div>

      {/* Rounds list */}
      {rounds.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Ingen runder funnet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Opprett din første runde
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Navn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  År
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åpningsdato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lukkedato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rounds.map((round) => (
                <tr key={round.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {round.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {round.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(round.status)}`}
                    >
                      {getStatusText(round.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {round.openDate || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {round.closeDate || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => openEditModal(round)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Rediger
                    </button>
                    <button
                      onClick={() => handleDeleteRound(round.id)}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      disabled={round.status !== 'DRAFT'}
                      title={
                        round.status !== 'DRAFT'
                          ? 'Kun DRAFT-runder kan slettes'
                          : ''
                      }
                    >
                      Slett
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Opprett ny runde</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn
                </label>
                <input
                  type="text"
                  value={newRound.name}
                  onChange={(e) =>
                    setNewRound({ ...newRound, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. KTU 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  År
                </label>
                <input
                  type="number"
                  value={newRound.year}
                  onChange={(e) =>
                    setNewRound({ ...newRound, year: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Åpningsdato (valgfritt)
                </label>
                <input
                  type="date"
                  value={newRound.openDate || ''}
                  onChange={(e) =>
                    setNewRound({
                      ...newRound,
                      openDate: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lukkedato (valgfritt)
                </label>
                <input
                  type="date"
                  value={newRound.closeDate || ''}
                  onChange={(e) =>
                    setNewRound({
                      ...newRound,
                      closeDate: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateRound}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Oppretter...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editRound && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rediger undersøkelse</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn
                </label>
                <input
                  type="text"
                  value={editRound.name}
                  onChange={(e) =>
                    setEditRound({ ...editRound, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  År
                </label>
                <input
                  type="number"
                  value={editRound.year}
                  onChange={(e) =>
                    setEditRound({
                      ...editRound,
                      year: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editRound.status}
                  onChange={(e) =>
                    setEditRound({
                      ...editRound,
                      status: e.target.value as KtuRoundStatus,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="DRAFT">Utkast</option>
                  <option value="OPEN">Åpen</option>
                  <option value="CLOSED">Avsluttet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Åpningsdato
                </label>
                <input
                  type="date"
                  value={editRound.openDate || ''}
                  onChange={(e) =>
                    setEditRound({
                      ...editRound,
                      openDate: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lukkedato
                </label>
                <input
                  type="date"
                  value={editRound.closeDate || ''}
                  onChange={(e) =>
                    setEditRound({
                      ...editRound,
                      closeDate: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditRound(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateRound}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
