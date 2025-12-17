'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktiService, {
  KtiRound,
  KtiRoundStatus,
  KtiAssignment,
  KtiConsultant,
  KtiCustomerContact,
  KtiInvitation,
  KtiInvitationStatus,
  KtiResponseSummary,
  KtiQuestionResponse,
  CreateKtiAssignment,
} from '@/services/kti.service'

type FilterStatus = 'all' | KtiRoundStatus

export default function AssignmentsTab() {
  const [surveys, setSurveys] = useState<KtiRound[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSurvey, setSelectedSurvey] = useState<KtiRound | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  // Data
  const [assignments, setAssignments] = useState<KtiAssignment[]>([])
  const [invitations, setInvitations] = useState<KtiInvitation[]>([])
  const [responses, setResponses] = useState<KtiResponseSummary[]>([])
  const [consultants, setConsultants] = useState<KtiConsultant[]>([])
  const [contacts, setContacts] = useState<KtiCustomerContact[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Actions
  const [sendingInvitations, setSendingInvitations] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [invitationFilter, setInvitationFilter] = useState<'all' | KtiInvitationStatus>('all')

  // Create assignment
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newAssignment, setNewAssignment] = useState<CreateKtiAssignment>({
    consultantId: 0,
    contactId: 0,
  })

  // Edit states
  const [editingInvitation, setEditingInvitation] = useState<KtiInvitation | null>(null)
  const [editInvitationStatus, setEditInvitationStatus] = useState<KtiInvitationStatus>('PENDING')
  const [updating, setUpdating] = useState(false)
  const [selectedResponseDetail, setSelectedResponseDetail] = useState<KtiResponseSummary | null>(null)
  const [editingResponse, setEditingResponse] = useState<KtiQuestionResponse | null>(null)
  const [editRatingValue, setEditRatingValue] = useState<number | null>(null)
  const [editTextValue, setEditTextValue] = useState<string>('')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedSurvey) {
      loadSurveyDetails(selectedSurvey.id)
    }
  }, [selectedSurvey?.id])

  const loadInitialData = async () => {
    try {
      const [roundsRes, consultantsRes, contactsRes] = await Promise.all([
        ktiService.getRounds(),
        ktiService.getConsultants(),
        ktiService.getContacts(),
      ])

      const sorted = (roundsRes.data || []).sort((a, b) => b.year - a.year)
      setSurveys(sorted)
      setConsultants(consultantsRes.data || [])
      setContacts(contactsRes.data || [])

      // Auto-select first open survey
      const openSurvey = sorted.find(s => s.status === 'OPEN')
      if (openSurvey) {
        setSelectedSurvey(openSurvey)
      } else if (sorted.length > 0) {
        setSelectedSurvey(sorted[0])
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
      toast.error('Feil ved lasting av data')
    } finally {
      setLoading(false)
    }
  }

  const loadSurveyDetails = async (surveyId: number) => {
    setLoadingDetails(true)
    try {
      const [assignmentsRes, invitationsRes, responsesRes] = await Promise.all([
        ktiService.getAssignments(surveyId),
        ktiService.getInvitations(surveyId),
        ktiService.getRoundResponses(surveyId),
      ])

      setAssignments(assignmentsRes.data || [])
      setInvitations(invitationsRes.data || [])
      setResponses(responsesRes.data || [])
    } catch (error) {
      console.error('Failed to load survey details:', error)
      toast.error('Feil ved lasting av detaljer')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Assignment actions
  const handleCreateAssignment = async () => {
    if (!selectedSurvey || !newAssignment.consultantId || !newAssignment.contactId) {
      toast.warning('Vennligst velg konsulent og kontakt')
      return
    }

    setCreating(true)
    try {
      await ktiService.createAssignment(selectedSurvey.id, newAssignment)
      toast.success('Tildeling opprettet')
      setShowCreateModal(false)
      setNewAssignment({ consultantId: 0, contactId: 0 })
      loadSurveyDetails(selectedSurvey.id)
    } catch (error) {
      console.error('Failed to create assignment:', error)
      toast.error('Feil ved opprettelse av tildeling')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!selectedSurvey) return
    if (!confirm('Er du sikker på at du vil slette denne tildelingen?')) return

    try {
      await ktiService.deleteAssignment(selectedSurvey.id, assignmentId)
      toast.success('Tildeling slettet')
      loadSurveyDetails(selectedSurvey.id)
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      toast.error('Feil ved sletting. Tildelinger med sendte invitasjoner kan ikke slettes.')
    }
  }

  // Invitation actions
  const handleSendInvitations = async () => {
    if (!selectedSurvey) return
    if (!confirm('Vil du sende invitasjoner til alle tildelinger uten aktive invitasjoner?')) return

    setSendingInvitations(true)
    try {
      const result = await ktiService.sendInvitations(selectedSurvey.id)
      if (result.data) {
        toast.success(`${result.data.sentCount ?? 0} invitasjoner sendt`)
        loadSurveyDetails(selectedSurvey.id)
      }
    } catch (error) {
      console.error('Failed to send invitations:', error)
      toast.error('Feil ved sending av invitasjoner')
    } finally {
      setSendingInvitations(false)
    }
  }

  const handleSendReminders = async () => {
    if (!selectedSurvey) return
    if (!confirm('Vil du sende purring til alle som ikke har svart?')) return

    setSendingReminders(true)
    try {
      const result = await ktiService.sendReminders(selectedSurvey.id)
      if (result.data) {
        toast.success(`${result.data.sentCount ?? 0} purringer sendt`)
        loadSurveyDetails(selectedSurvey.id)
      }
    } catch (error) {
      console.error('Failed to send reminders:', error)
      toast.error('Feil ved sending av purringer')
    } finally {
      setSendingReminders(false)
    }
  }

  // Edit invitation
  const openEditInvitation = (invitation: KtiInvitation) => {
    setEditingInvitation(invitation)
    setEditInvitationStatus(invitation.status)
  }

  const handleUpdateInvitation = async () => {
    if (!editingInvitation?.id) return

    setUpdating(true)
    try {
      await ktiService.updateInvitation(editingInvitation.id, {
        status: editInvitationStatus,
      })
      toast.success('Invitasjon oppdatert')
      setEditingInvitation(null)
      if (selectedSurvey) loadSurveyDetails(selectedSurvey.id)
    } catch (error) {
      console.error('Failed to update invitation:', error)
      toast.error('Feil ved oppdatering av invitasjon')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteInvitation = async (invitationId: number) => {
    if (!confirm('Er du sikker på at du vil slette denne invitasjonen og alle tilhørende svar?')) return

    try {
      await ktiService.deleteInvitation(invitationId)
      toast.success('Invitasjon slettet')
      setEditingInvitation(null)
      if (selectedSurvey) loadSurveyDetails(selectedSurvey.id)
    } catch (error) {
      console.error('Failed to delete invitation:', error)
      toast.error('Feil ved sletting av invitasjon')
    }
  }

  // Response handling
  const getResponseForInvitation = (invitationId: number) => {
    return responses.find(r => r.id === invitationId)
  }

  const openResponseDetail = (invitation: KtiInvitation) => {
    const response = getResponseForInvitation(invitation.id)
    if (response) {
      setSelectedResponseDetail(response)
    }
  }

  const openEditResponse = (qr: KtiQuestionResponse) => {
    setEditingResponse(qr)
    setEditRatingValue(qr.ratingValue ?? null)
    setEditTextValue(qr.textValue ?? '')
  }

  const handleUpdateResponse = async () => {
    if (!editingResponse?.id) return

    setUpdating(true)
    try {
      await ktiService.updateResponse(editingResponse.id, {
        ratingValue: editRatingValue ?? undefined,
        textValue: editTextValue || undefined,
      })
      toast.success('Svar oppdatert')
      setEditingResponse(null)
      if (selectedSurvey) loadSurveyDetails(selectedSurvey.id)
    } catch (error) {
      console.error('Failed to update response:', error)
      toast.error('Feil ved oppdatering av svar')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteResponse = async (responseId: number) => {
    if (!confirm('Er du sikker på at du vil slette dette svaret?')) return

    try {
      await ktiService.deleteResponse(responseId)
      toast.success('Svar slettet')
      if (selectedSurvey) loadSurveyDetails(selectedSurvey.id)
    } catch (error) {
      console.error('Failed to delete response:', error)
      toast.error('Feil ved sletting av svar')
    }
  }

  // Styling helpers
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

  const getInvitationStatusStyle = (status: KtiInvitationStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700'
      case 'SENT': return 'bg-blue-100 text-blue-700'
      case 'OPENED': return 'bg-yellow-100 text-yellow-700'
      case 'RESPONDED': return 'bg-green-100 text-green-700'
      case 'EXPIRED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getInvitationStatusText = (status: KtiInvitationStatus) => {
    switch (status) {
      case 'PENDING': return 'Venter'
      case 'SENT': return 'Sendt'
      case 'OPENED': return 'Åpnet'
      case 'RESPONDED': return 'Besvart'
      case 'EXPIRED': return 'Utløpt'
      default: return status
    }
  }

  const getScoreStyle = (score: number) => {
    if (score >= 5) return 'bg-green-100 text-green-800'
    if (score >= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  // Filtering
  const filteredSurveys = filterStatus === 'all'
    ? surveys
    : surveys.filter(s => s.status === filterStatus)

  // Build combined list: assignments with their invitations
  const combinedList = assignments.map(assignment => {
    const invitation = invitations.find(i => i.assignmentId === assignment.id)
    return { assignment, invitation }
  })

  const filteredList = invitationFilter === 'all'
    ? combinedList
    : combinedList.filter(item => {
        if (invitationFilter === 'PENDING') {
          return !item.invitation || item.invitation.status === 'PENDING'
        }
        return item.invitation?.status === invitationFilter
      })

  // Stats
  const respondedCount = invitations.filter(i => i.status === 'RESPONDED').length
  const sentCount = invitations.filter(i => ['SENT', 'OPENED', 'RESPONDED'].includes(i.status)).length
  const waitingCount = invitations.filter(i => ['SENT', 'OPENED'].includes(i.status)).length
  const notSentCount = assignments.length - sentCount

  const isRoundOpen = selectedSurvey?.status === 'OPEN'
  const isRoundDraft = selectedSurvey?.status === 'DRAFT'

  if (loading) {
    return <div className="text-center py-8">Laster data...</div>
  }

  return (
    <div className="flex gap-6">
      {/* Left: Survey selector */}
      <div className="w-1/3">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Velg undersøkelse</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="mt-2 w-full border rounded px-3 py-2 text-sm"
            >
              <option value="all">Alle statuser</option>
              <option value="DRAFT">Utkast</option>
              <option value="OPEN">Aktive</option>
              <option value="CLOSED">Avsluttede</option>
            </select>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filteredSurveys.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">Ingen undersøkelser</div>
            ) : (
              filteredSurveys.map((survey) => (
                <button
                  key={survey.id}
                  onClick={() => setSelectedSurvey(survey)}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${
                    selectedSurvey?.id === survey.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{survey.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(survey.status)}`}>
                      {getStatusText(survey.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{survey.year}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Details */}
      <div className="flex-1">
        {selectedSurvey ? (
          <div className="space-y-6">
            {/* Survey info & actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedSurvey.name}</h2>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusStyle(selectedSurvey.status)}`}>
                  {getStatusText(selectedSurvey.status)}
                </span>
              </div>

              {loadingDetails ? (
                <div className="text-center py-4 text-gray-500">Laster...</div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-2xl font-bold text-gray-700">{assignments.length}</div>
                      <div className="text-sm text-gray-600">Tildelinger</div>
                    </div>
                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-2xl font-bold text-blue-700">{sentCount}</div>
                      <div className="text-sm text-blue-600">Sendt</div>
                    </div>
                    <div className="bg-green-50 rounded p-3">
                      <div className="text-2xl font-bold text-green-700">{respondedCount}</div>
                      <div className="text-sm text-green-600">Besvart</div>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <div className="text-2xl font-bold text-purple-700">
                        {assignments.length > 0 ? Math.round((respondedCount / assignments.length) * 100) : 0}%
                      </div>
                      <div className="text-sm text-purple-600">Svarprosent</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      + Ny tildeling
                    </button>
                    {isRoundOpen && (
                      <>
                        <button
                          onClick={handleSendInvitations}
                          disabled={sendingInvitations || notSentCount === 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {sendingInvitations ? 'Sender...' : `Send invitasjoner (${notSentCount})`}
                        </button>
                        <button
                          onClick={handleSendReminders}
                          disabled={sendingReminders || waitingCount === 0}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                          {sendingReminders ? 'Sender...' : `Send purring (${waitingCount})`}
                        </button>
                      </>
                    )}
                  </div>

                  {isRoundDraft && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        Undersøkelsen er et utkast. Åpne den for å sende invitasjoner.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Assignments/Invitations table */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tildelinger og svarstatus</h3>
                <select
                  value={invitationFilter}
                  onChange={(e) => setInvitationFilter(e.target.value as 'all' | KtiInvitationStatus)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">Alle ({assignments.length})</option>
                  <option value="PENDING">Ikke sendt ({notSentCount})</option>
                  <option value="SENT">Sendt ({invitations.filter(i => i.status === 'SENT').length})</option>
                  <option value="OPENED">Åpnet ({invitations.filter(i => i.status === 'OPENED').length})</option>
                  <option value="RESPONDED">Besvart ({respondedCount})</option>
                  <option value="EXPIRED">Utløpt ({invitations.filter(i => i.status === 'EXPIRED').length})</option>
                </select>
              </div>

              {loadingDetails ? (
                <div className="p-8 text-center text-gray-500">Laster...</div>
              ) : assignments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Ingen tildelinger for denne undersøkelsen</p>
                  <p className="text-sm mt-2">Klikk &quot;Ny tildeling&quot; for å legge til.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konsulent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sendt</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Besvart</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredList.map(({ assignment, invitation }) => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {assignment.consultant.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {assignment.contact.organizationName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>{assignment.contact.name}</div>
                            <div className="text-xs text-gray-400">{assignment.contact.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            {invitation ? (
                              <span className={`px-2 py-1 text-xs rounded-full ${getInvitationStatusStyle(invitation.status)}`}>
                                {getInvitationStatusText(invitation.status)}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                Ikke sendt
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {invitation?.sentAt ? new Date(invitation.sentAt).toLocaleDateString('nb-NO') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {invitation?.respondedAt ? new Date(invitation.respondedAt).toLocaleDateString('nb-NO') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              {invitation ? (
                                <>
                                  <button
                                    onClick={() => openEditInvitation(invitation)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Rediger"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  {invitation.status === 'RESPONDED' && (
                                    <button
                                      onClick={() => openResponseDetail(invitation)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Se svar"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Slett tildeling"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <p className="text-lg">Velg en undersøkelse for å administrere tildelinger</p>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Opprett ny tildeling</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konsulent</label>
                <select
                  value={newAssignment.consultantId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, consultantId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value={0}>Velg konsulent...</option>
                  {consultants.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt</label>
                <select
                  value={newAssignment.contactId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, contactId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value={0}>Velg kontakt...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.organizationName})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Avbryt
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Oppretter...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invitation Modal */}
      {editingInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rediger invitasjon</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-500">Konsulent</div>
                <div className="font-medium">{editingInvitation.consultant?.name || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-500">Kunde</div>
                <div className="font-medium">{editingInvitation.organization?.name || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editInvitationStatus}
                  onChange={(e) => setEditInvitationStatus(e.target.value as KtiInvitationStatus)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="PENDING">Venter</option>
                  <option value="SENT">Sendt</option>
                  <option value="OPENED">Åpnet</option>
                  <option value="RESPONDED">Besvart</option>
                  <option value="EXPIRED">Utløpt</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => handleDeleteInvitation(editingInvitation.id)}
                className="px-4 py-2 text-red-600 hover:text-red-800"
              >
                Slett invitasjon
              </button>
              <div className="flex gap-3">
                <button onClick={() => setEditingInvitation(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Avbryt
                </button>
                <button
                  onClick={handleUpdateInvitation}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Lagrer...' : 'Lagre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Detail Modal */}
      {selectedResponseDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Svardetaljer</h3>
                  <p className="text-gray-600 mt-1">
                    {selectedResponseDetail.consultantName} - {selectedResponseDetail.organizationName}
                  </p>
                </div>
                <button onClick={() => setSelectedResponseDetail(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 rounded-lg p-4">
                <div>
                  <div className="text-sm text-gray-500">Kontaktperson</div>
                  <div className="font-medium">{selectedResponseDetail.contactName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Besvart</div>
                  <div className="font-medium">
                    {selectedResponseDetail.respondedAt
                      ? new Date(selectedResponseDetail.respondedAt).toLocaleDateString('nb-NO')
                      : '-'}
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-4">Svar på spørsmål</h4>
              {selectedResponseDetail.questionResponses && selectedResponseDetail.questionResponses.length > 0 ? (
                <div className="space-y-4">
                  {selectedResponseDetail.questionResponses.map((qr, index) => (
                    <div key={qr.id || qr.questionId || index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{qr.questionText}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {qr.questionType === 'RATING_1_6' && qr.ratingValue != null && (
                            <span className={`px-3 py-1 text-lg font-bold rounded ${getScoreStyle(qr.ratingValue)}`}>
                              {qr.ratingValue}
                            </span>
                          )}
                          {qr.questionType === 'RATING_1_6' && qr.ratingValue == null && (
                            <span className="px-3 py-1 text-lg font-bold rounded bg-gray-100 text-gray-400">-</span>
                          )}
                          <button
                            onClick={() => openEditResponse(qr)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="Rediger svar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {qr.textValue && (
                        <div className="mt-3 bg-gray-50 rounded p-3 text-gray-700 whitespace-pre-wrap">
                          {qr.textValue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">Ingen svar</div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedResponseDetail(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Response Modal */}
      {editingResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rediger svar</h2>
            <div className="space-y-4">
              <div className="font-medium text-gray-900 mb-3">{editingResponse.questionText}</div>

              {editingResponse.questionType === 'RATING_1_6' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Score (1-6)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map((score) => (
                      <button
                        key={score}
                        onClick={() => setEditRatingValue(score)}
                        className={`w-10 h-10 rounded-lg font-bold text-lg transition-colors ${
                          editRatingValue === score
                            ? score >= 5 ? 'bg-green-600 text-white'
                              : score >= 3 ? 'bg-yellow-500 text-white'
                              : 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingResponse.questionType === 'FREE_TEXT' ? 'Svar' : 'Kommentar'}
                </label>
                <textarea
                  value={editTextValue}
                  onChange={(e) => setEditTextValue(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => editingResponse.id && handleDeleteResponse(editingResponse.id)}
                className="px-4 py-2 text-red-600 hover:text-red-800"
              >
                Slett svar
              </button>
              <div className="flex gap-3">
                <button onClick={() => setEditingResponse(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Avbryt
                </button>
                <button
                  onClick={handleUpdateResponse}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Lagrer...' : 'Lagre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
