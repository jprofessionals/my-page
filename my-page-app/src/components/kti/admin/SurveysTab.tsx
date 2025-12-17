'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktiService, { KtiRound, KtiRoundStatus, CreateKtiRound, UpdateKtiRound } from '@/services/kti.service'
import SurveyImportModal from './SurveyImportModal'

interface Props {
  onSelectSurvey?: (survey: KtiRound) => void
}

export default function SurveysTab({ onSelectSurvey }: Props) {
  const [surveys, setSurveys] = useState<KtiRound[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [newSurvey, setNewSurvey] = useState<CreateKtiRound>({
    name: '',
    year: new Date().getFullYear(),
  })
  const [editingSurvey, setEditingSurvey] = useState<KtiRound | null>(null)
  const [editForm, setEditForm] = useState<UpdateKtiRound>({ name: '' })

  useEffect(() => {
    loadSurveys()
  }, [])

  const loadSurveys = async () => {
    try {
      const response = await ktiService.getRounds()
      // Sort by year descending
      const sorted = (response.data || []).sort((a, b) => b.year - a.year)
      setSurveys(sorted)
    } catch (error) {
      console.error('Failed to load surveys:', error)
      toast.error('Feil ved lasting av undersøkelser')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSurvey = async () => {
    if (!newSurvey.name.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }
    setCreating(true)
    try {
      await ktiService.createRound(newSurvey)
      toast.success('Undersøkelse opprettet')
      setShowCreateModal(false)
      setNewSurvey({ name: '', year: new Date().getFullYear() })
      loadSurveys()
    } catch (error) {
      console.error('Failed to create survey:', error)
      toast.error('Feil ved opprettelse av undersøkelse')
    } finally {
      setCreating(false)
    }
  }

  const handleEditSurvey = (survey: KtiRound, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSurvey(survey)
    setEditForm({ name: survey.name })
    setShowEditModal(true)
  }

  const handleUpdateSurvey = async () => {
    if (!editingSurvey || !editForm.name?.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }
    setUpdating(true)
    try {
      await ktiService.updateRound(editingSurvey.id, editForm)
      toast.success('Undersøkelse oppdatert')
      setShowEditModal(false)
      setEditingSurvey(null)
      loadSurveys()
    } catch (error) {
      console.error('Failed to update survey:', error)
      toast.error('Feil ved oppdatering av undersøkelse')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteSurvey = async (survey: KtiRound, e: React.MouseEvent) => {
    e.stopPropagation()

    const warningMessage = survey.status === 'DRAFT'
      ? 'Er du sikker på at du vil slette denne undersøkelsen?'
      : `ADVARSEL: Denne undersøkelsen har status "${getStatusText(survey.status)}". Sletting vil fjerne alle tilknyttede data (invitasjoner, svar, etc.). Er du helt sikker?`

    if (!confirm(warningMessage)) return

    try {
      await ktiService.deleteRound(survey.id)
      toast.success('Undersøkelse slettet')
      loadSurveys()
    } catch (error) {
      console.error('Failed to delete survey:', error)
      toast.error('Feil ved sletting av undersøkelse. Sjekk at alle tilknyttede data kan slettes.')
    }
  }

  const getStatusStyle = (status: KtiRoundStatus) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700'
      case 'OPEN': return 'bg-green-100 text-green-700'
      case 'CLOSED': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: KtiRoundStatus) => {
    switch (status) {
      case 'DRAFT': return 'Utkast'
      case 'OPEN': return 'Aktiv'
      case 'CLOSED': return 'Avsluttet'
      default: return status
    }
  }

  if (loading) {
    return <div className="text-center py-8">Laster undersøkelser...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Undersøkelser</h2>
          <p className="text-sm text-gray-500">Administrer kundetilfredshetsundersøkelser</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Import historikk
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Ny undersøkelse
          </button>
        </div>
      </div>

      {/* Surveys list */}
      {surveys.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 mb-4">Ingen undersøkelser enna</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Importer historiske data
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Opprett ny undersøkelse
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Undersøkelse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Svar
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {surveys.map((survey) => (
                <tr
                  key={survey.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectSurvey?.(survey)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{survey.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {survey.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(survey.status)}`}>
                      {getStatusText(survey.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => handleEditSurvey(survey, e)}
                      className="text-gray-600 hover:text-gray-900 mr-4"
                    >
                      Rediger
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectSurvey?.(survey)
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Se detaljer
                    </button>
                    <button
                      onClick={(e) => handleDeleteSurvey(survey, e)}
                      className="text-red-600 hover:text-red-900"
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
            <h2 className="text-xl font-bold mb-4">Ny undersøkelse</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
                <input
                  type="text"
                  value={newSurvey.name}
                  onChange={(e) => setNewSurvey({ ...newSurvey, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. KTI Var 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ar *</label>
                <input
                  type="number"
                  value={newSurvey.year}
                  onChange={(e) => setNewSurvey({ ...newSurvey, year: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="2020"
                  max="2030"
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
                onClick={handleCreateSurvey}
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
      {showEditModal && editingSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rediger undersøkelse</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. KTI Var 2025"
                />
              </div>
              <div className="text-sm text-gray-500">
                Ar: {editingSurvey.year} | Status: {getStatusText(editingSurvey.status)}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingSurvey(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateSurvey}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Lagrer...' : 'Lagre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <SurveyImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={loadSurveys}
        />
      )}
    </div>
  )
}
