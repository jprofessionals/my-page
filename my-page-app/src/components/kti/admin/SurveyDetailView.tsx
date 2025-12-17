'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Image from 'next/image'
import ktiService, {
  KtiRound,
  KtiRoundStatus,
  KtiResponseSummary,
  KtiQuestionResponse,
  KtiInvitation,
  KtiAssignment,
  KtiConsultant,
  KtiCustomerContact,
  CreateKtiAssignment,
  KtiQuestion,
  KtiRoundQuestion,
  CreateKtiQuestion,
  KtiQuestionType,
} from '@/services/kti.service'

// Category translations from English to Norwegian
const categoryTranslations: Record<string, string> = {
  'DELIVERY': 'Leveranse',
  'COMPETENCE': 'Kompetanse',
  'COLLABORATION': 'Samarbeid',
  'KNOWLEDGE_SHARING': 'Kunnskapsdeling',
  'VALUE': 'Verdiskaping',
  'JPRO_FOLLOWUP': 'Oppfølging fra JPro',
  'ADDITIONAL': 'Tilleggsspørsmål',
}

const translateCategory = (category: string): string => {
  return categoryTranslations[category] || category
}

interface Props {
  survey: KtiRound
  onBack: () => void
  onUpdate?: () => void
}

type DetailTab = 'oversikt' | 'spørsmål' | 'tildelinger' | 'svar'

export default function SurveyDetailView({ survey, onBack, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>('oversikt')
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<KtiInvitation[]>([])
  const [responses, setResponses] = useState<KtiResponseSummary[]>([])
  const [selectedResponse, setSelectedResponse] = useState<KtiResponseSummary | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState(survey.name)
  const [updating, setUpdating] = useState(false)
  const [editingResponse, setEditingResponse] = useState<KtiQuestionResponse | null>(null)
  const [editRatingValue, setEditRatingValue] = useState<number | null>(null)
  const [editTextValue, setEditTextValue] = useState<string>('')
  const [sendingInvitations, setSendingInvitations] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)

  // Questions state
  const [roundQuestions, setRoundQuestions] = useState<KtiRoundQuestion[]>([])
  const [globalQuestions, setGlobalQuestions] = useState<KtiQuestion[]>([])
  const [initializingQuestions, setInitializingQuestions] = useState(false)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false)
  const [creatingQuestion, setCreatingQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState<CreateKtiQuestion>({
    code: '',
    textNo: '',
    textEn: '',
    questionType: 'RATING_1_6' as KtiQuestionType,
    category: 'Egendefinert',
    displayOrder: 100,
    required: true,
  })
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Assignments state
  const [assignments, setAssignments] = useState<KtiAssignment[]>([])
  const [consultants, setConsultants] = useState<KtiConsultant[]>([])
  const [contacts, setContacts] = useState<KtiCustomerContact[]>([])
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false)
  const [creatingAssignment, setCreatingAssignment] = useState(false)
  const [newAssignment, setNewAssignment] = useState<CreateKtiAssignment>({
    consultantId: 0,
    contactId: 0,
  })

  // Calculate counts from invitations
  const respondedCount = invitations.filter(i => i.status === 'RESPONDED').length
  const sentCount = invitations.filter(i => ['SENT', 'OPENED', 'RESPONDED'].includes(i.status)).length
  const waitingCount = invitations.filter(i => ['SENT', 'OPENED'].includes(i.status)).length
  const responseRate = sentCount > 0 ? (respondedCount / sentCount) * 100 : 0

  useEffect(() => {
    loadData()
  }, [survey.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [invitationsRes, responsesRes, assignmentsRes, consultantsRes, contactsRes, roundQuestionsRes, globalQuestionsRes] = await Promise.all([
        ktiService.getInvitations(survey.id),
        ktiService.getRoundResponses(survey.id),
        ktiService.getAssignments(survey.id),
        ktiService.getConsultants(),
        ktiService.getContacts(),
        ktiService.getRoundQuestions(survey.id),
        ktiService.getQuestions(false), // Get all questions including inactive
      ])

      if (invitationsRes.data) setInvitations(invitationsRes.data)
      if (responsesRes.data) setResponses(responsesRes.data)
      if (assignmentsRes.data) setAssignments(assignmentsRes.data)
      if (consultantsRes.data) setConsultants(consultantsRes.data)
      if (contactsRes.data) setContacts(contactsRes.data)
      if (roundQuestionsRes.data) setRoundQuestions(roundQuestionsRes.data)
      if (globalQuestionsRes.data) setGlobalQuestions(globalQuestionsRes.data)
    } catch (error) {
      console.error('Failed to load survey data:', error)
      toast.error('Feil ved lasting av data')
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvitations = async () => {
    if (!confirm('Er du sikker på at du vil sende ut invitasjoner til alle kontaktpersoner i denne undersøkelsen?')) return

    setSendingInvitations(true)
    try {
      const result = await ktiService.sendInvitations(survey.id)
      if (result.data) {
        toast.success(`Sendte ${result.data.sentCount ?? 0} invitasjoner`)
        loadData()
      }
    } catch (error) {
      console.error('Failed to send invitations:', error)
      toast.error('Feil ved sending av invitasjoner')
    } finally {
      setSendingInvitations(false)
    }
  }

  const handleSendReminders = async () => {
    if (!confirm('Er du sikker på at du vil sende purring til alle som ikke har svart?')) return

    setSendingReminders(true)
    try {
      const result = await ktiService.sendReminders(survey.id)
      if (result.data) {
        toast.success(`Sendte ${result.data.sentCount ?? 0} purringer`)
        loadData()
      }
    } catch (error) {
      console.error('Failed to send reminders:', error)
      toast.error('Feil ved sending av purringer')
    } finally {
      setSendingReminders(false)
    }
  }

  const handleOpenSurvey = async () => {
    if (!confirm('Er du sikker på at du vil åpne denne undersøkelsen?')) return
    try {
      await ktiService.updateRound(survey.id, { status: 'OPEN' })
      toast.success('Undersøkelsen er nå aktiv')
      onBack()
    } catch (error) {
      console.error('Failed to open survey:', error)
      toast.error('Feil ved åpning av undersøkelse')
    }
  }

  const handleCloseSurvey = async () => {
    if (!confirm('Er du sikker på at du vil avslutte denne undersøkelsen?')) return
    try {
      await ktiService.updateRound(survey.id, { status: 'CLOSED' })
      toast.success('Undersøkelsen er nå avsluttet')
      onBack()
    } catch (error) {
      console.error('Failed to close survey:', error)
      toast.error('Feil ved avslutting av undersøkelse')
    }
  }

  const handleUpdateName = async () => {
    if (!editName.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }
    setUpdating(true)
    try {
      await ktiService.updateRound(survey.id, { name: editName })
      toast.success('Navn oppdatert')
      setShowEditModal(false)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update survey name:', error)
      toast.error('Feil ved oppdatering av navn')
    } finally {
      setUpdating(false)
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
      loadData()
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
      loadData()
    } catch (error) {
      console.error('Failed to delete response:', error)
      toast.error('Feil ved sletting av svar')
    }
  }

  const handleCreateAssignment = async () => {
    if (!newAssignment.consultantId || !newAssignment.contactId) {
      toast.warning('Vennligst velg konsulent og kontakt')
      return
    }

    setCreatingAssignment(true)
    try {
      await ktiService.createAssignment(survey.id, newAssignment)
      toast.success('Tildeling opprettet')
      setShowCreateAssignmentModal(false)
      setNewAssignment({ consultantId: 0, contactId: 0 })
      loadData()
    } catch (error) {
      console.error('Failed to create assignment:', error)
      toast.error('Feil ved opprettelse av tildeling')
    } finally {
      setCreatingAssignment(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Er du sikker på at du vil slette denne tildelingen?')) return

    try {
      await ktiService.deleteAssignment(survey.id, assignmentId)
      toast.success('Tildeling slettet')
      loadData()
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      toast.error('Feil ved sletting. Tildelinger med sendte invitasjoner kan ikke slettes.')
    }
  }

  const handleInitQuestionsFromTemplate = async () => {
    if (!confirm('Vil du initialisere spørsmål fra standard mal? Dette vil legge til alle aktive globale spørsmål til denne undersøkelsen.')) return

    setInitializingQuestions(true)
    try {
      await ktiService.initRoundQuestionsFromTemplate(survey.id)
      toast.success('Spørsmål initialisert fra mal')
      loadData()
    } catch (error) {
      console.error('Failed to init questions:', error)
      toast.error('Feil ved initialisering av spørsmål. Undersøkelsen har kanskje allerede spørsmål.')
    } finally {
      setInitializingQuestions(false)
    }
  }

  const handleToggleQuestionActive = async (rq: KtiRoundQuestion) => {
    try {
      await ktiService.updateRoundQuestion(survey.id, rq.question.id, { active: !rq.active })
      toast.success(rq.active ? 'Spørsmål deaktivert' : 'Spørsmål aktivert')
      loadData()
    } catch (error) {
      console.error('Failed to toggle question:', error)
      toast.error('Feil ved oppdatering av spørsmål')
    }
  }

  const handleRemoveQuestion = async (questionId: number) => {
    if (!confirm('Er du sikker på at du vil fjerne dette spørsmålet fra undersøkelsen?')) return

    try {
      await ktiService.removeRoundQuestion(survey.id, questionId)
      toast.success('Spørsmål fjernet')
      loadData()
    } catch (error) {
      console.error('Failed to remove question:', error)
      toast.error('Feil ved fjerning av spørsmål')
    }
  }

  const handleAddQuestion = async (questionId: number) => {
    setAddingQuestion(true)
    try {
      const maxDisplayOrder = roundQuestions.length > 0
        ? Math.max(...roundQuestions.map(rq => rq.displayOrder))
        : 0
      await ktiService.addRoundQuestion(survey.id, {
        questionId,
        displayOrder: maxDisplayOrder + 1,
        active: true,
      })
      toast.success('Spørsmål lagt til')
      loadData()
    } catch (error) {
      console.error('Failed to add question:', error)
      toast.error('Feil ved tillegging av spørsmål')
    } finally {
      setAddingQuestion(false)
    }
  }

  // Get questions that are not yet added to the round
  const availableQuestions = globalQuestions.filter(
    gq => !roundQuestions.some(rq => rq.question.id === gq.id)
  )

  const handleCreateQuestion = async () => {
    if (!newQuestion.code.trim() || !newQuestion.textNo.trim()) {
      toast.warning('Vennligst fyll inn kode og spørsmåltekst')
      return
    }

    setCreatingQuestion(true)
    try {
      const result = await ktiService.createQuestion(newQuestion)
      if (result.data) {
        toast.success('Spørsmål opprettet')
        // Add the new question to the round
        await handleAddQuestion(result.data.id)
        setShowCreateQuestionModal(false)
        setNewQuestion({
          code: '',
          textNo: '',
          textEn: '',
          questionType: 'RATING_1_6' as KtiQuestionType,
          category: 'Egendefinert',
          displayOrder: 100,
          required: true,
        })
        loadData()
      }
    } catch (error) {
      console.error('Failed to create question:', error)
      toast.error('Feil ved opprettelse av spørsmål. Sjekk at koden er unik.')
    } finally {
      setCreatingQuestion(false)
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

  const getScoreStyle = (score: number) => {
    if (score >= 5) return 'bg-green-100 text-green-800'
    if (score >= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const detailTabs: { id: DetailTab; label: string }[] = [
    { id: 'oversikt', label: 'Oversikt' },
    { id: 'spørsmål', label: `Spørsmål (${roundQuestions.length})` },
    { id: 'tildelinger', label: `Tildelinger (${assignments.length})` },
    { id: 'svar', label: `Svar (${responses.length})` },
  ]

  const getInvitationStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700'
      case 'SENT': return 'bg-blue-100 text-blue-700'
      case 'OPENED': return 'bg-yellow-100 text-yellow-700'
      case 'RESPONDED': return 'bg-green-100 text-green-700'
      case 'EXPIRED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getInvitationStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Venter'
      case 'SENT': return 'Sendt'
      case 'OPENED': return 'Åpnet'
      case 'RESPONDED': return 'Besvart'
      case 'EXPIRED': return 'Utlopt'
      default: return status
    }
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tilbake til undersøkelser
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{survey.name}</h2>
              <button
                onClick={() => {
                  setEditName(survey.name)
                  setShowEditModal(true)
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Rediger navn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600">{survey.year}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-sm rounded-full ${getStatusStyle(survey.status)}`}>
              {getStatusText(survey.status)}
            </span>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              disabled={roundQuestions.filter(q => q.active).length === 0}
              title={roundQuestions.filter(q => q.active).length === 0 ? 'Legg til spørsmål først' : 'Forhåndsvis spørreskjemaet'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Forhåndsvisning
            </button>
            {survey.status === 'DRAFT' && (
              <button
                onClick={handleOpenSurvey}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Åpne undersøkelse
              </button>
            )}
            {survey.status === 'OPEN' && (
              <button
                onClick={handleCloseSurvey}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Avslutt undersøkelse
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {detailTabs.map((tab) => (
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

      {loading ? (
        <div className="text-center py-8">Laster data...</div>
      ) : (
        <>
          {/* Overview tab */}
          {activeTab === 'oversikt' && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-green-700">{respondedCount}</div>
                  <div className="text-sm text-green-600">Svar mottatt</div>
                </div>
                <div className="bg-blue-50 rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-blue-700">{sentCount}</div>
                  <div className="text-sm text-blue-600">Invitasjoner sendt</div>
                </div>
                <div className="bg-yellow-50 rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-yellow-700">{waitingCount}</div>
                  <div className="text-sm text-yellow-600">Venter på svar</div>
                </div>
                <div className="bg-purple-50 rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-purple-700">
                    {responseRate > 0 ? `${responseRate.toFixed(0)}%` : '-'}
                  </div>
                  <div className="text-sm text-purple-600">Svarprosent</div>
                </div>
              </div>

              {/* Send buttons */}
              {survey.status === 'OPEN' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Utsendelser</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendInvitations}
                      disabled={sendingInvitations}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingInvitations ? 'Sender...' : 'Send invitasjoner'}
                    </button>
                    <button
                      onClick={handleSendReminders}
                      disabled={sendingReminders || waitingCount === 0}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReminders ? 'Sender...' : `Send purring (${waitingCount})`}
                    </button>
                  </div>
                </div>
              )}

              {survey.status === 'DRAFT' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    Denne undersøkelsen er fortsatt et utkast. Åpne undersøkelsen for a sende invitasjoner.
                  </p>
                </div>
              )}

              {survey.status === 'CLOSED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    Denne undersøkelsen er avsluttet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Questions tab */}
          {activeTab === 'spørsmål' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Disse spørsmålene vil bli stilt til kundekontaktene i denne undersøkelsen.
                </p>
                {survey.status === 'DRAFT' && (
                  <div className="flex gap-2">
                    {roundQuestions.length === 0 && globalQuestions.length > 0 && (
                      <button
                        onClick={handleInitQuestionsFromTemplate}
                        disabled={initializingQuestions}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {initializingQuestions ? 'Initialiserer...' : 'Initialiser fra mal'}
                      </button>
                    )}
                    <button
                      onClick={() => availableQuestions.length > 0 ? setShowAddQuestionModal(true) : setShowCreateQuestionModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      + Legg til spørsmål
                    </button>
                  </div>
                )}
              </div>

              {/* Questions list */}
              {roundQuestions.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500 mb-4">
                    Ingen spørsmål definert for denne undersøkelsen.
                  </p>
                  {survey.status === 'DRAFT' && (
                    <p className="text-sm text-gray-400">
                      Klikk &quot;Initialiser fra mal&quot; for a legge til standard spørsmål.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {roundQuestions
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((rq, index) => (
                      <div
                        key={rq.id}
                        className={`bg-white rounded-lg shadow p-4 ${!rq.active ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {rq.question.code}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                rq.question.questionType === 'RATING_1_6'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {rq.question.questionType === 'RATING_1_6' ? 'Score 1-6' : 'Fritekst'}
                              </span>
                              {rq.question.required && (
                                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                                  Påkrevd
                                </span>
                              )}
                              {!rq.active && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600">
                                  Inaktiv i denne undersøkelsen
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 font-medium">{rq.question.textNo}</p>
                            {rq.question.textEn && (
                              <p className="text-gray-500 text-sm mt-1 italic">{rq.question.textEn}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-2">
                              Kategori: {rq.question.category}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {survey.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => handleToggleQuestionActive(rq)}
                                  className={`text-sm px-2 py-1 rounded ${
                                    rq.active
                                      ? 'text-orange-600 hover:bg-orange-50'
                                      : 'text-green-600 hover:bg-green-50'
                                  }`}
                                  title={rq.active ? 'Deaktiver for denne undersøkelsen' : 'Aktiver for denne undersøkelsen'}
                                >
                                  {rq.active ? 'Deaktiver' : 'Aktiver'}
                                </button>
                                <button
                                  onClick={() => handleRemoveQuestion(rq.question.id)}
                                  className="text-sm px-2 py-1 rounded text-red-600 hover:bg-red-50"
                                  title="Fjern fra undersøkelsen"
                                >
                                  Fjern
                                </button>
                              </>
                            )}
                            <div className="text-2xl font-bold text-gray-300">
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Info box */}
              {survey.status !== 'DRAFT' && roundQuestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Merk:</strong> Spørsmål kan kun endres når undersøkelsen er i utkast-status.
                    Dette sikrer at alle respondenter får de samme spørsmålene.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Assignments tab (combined with mailings) */}
          {activeTab === 'tildelinger' && (
            <div className="space-y-4">
              {/* Actions row */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Administrer hvem som skal motta undersøkelsen og send ut invitasjoner.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Ny tildeling
                  </button>
                  {survey.status === 'OPEN' && (
                    <>
                      <button
                        onClick={handleSendInvitations}
                        disabled={sendingInvitations}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {sendingInvitations ? 'Sender...' : 'Send invitasjoner'}
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
              </div>

              {survey.status === 'DRAFT' && assignments.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    Undersøkelsen er et utkast. Åpne den for å sende invitasjoner.
                  </p>
                </div>
              )}

              {/* Combined assignments/invitations table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {assignments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Ingen tildelinger opprettet ennå. Klikk &quot;Ny tildeling&quot; for å legge til mottakere.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konsulent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sendt</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Besvart</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assignments.map((assignment) => {
                        const invitation = invitations.find(i => i.assignmentId === assignment.id)
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {assignment.consultant?.name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {assignment.contact?.organizationName || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">{assignment.contact?.name || '-'}</div>
                              <div className="text-xs text-gray-400">{assignment.contact?.email || ''}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {invitation ? (
                                <span className={`px-2 py-1 text-xs rounded-full ${getInvitationStatusStyle(invitation.status)}`}>
                                  {getInvitationStatusText(invitation.status)}
                                  {invitation.reminderCount > 0 && ` (+${invitation.reminderCount})`}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                  Ikke sendt
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {invitation?.sentAt ? new Date(invitation.sentAt).toLocaleDateString('nb-NO') : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {invitation?.respondedAt ? new Date(invitation.respondedAt).toLocaleDateString('nb-NO') : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              {!invitation ? (
                                <button
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  title="Slett tildeling"
                                >
                                  Slett
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Responses tab */}
          {activeTab === 'svar' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {responses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Ingen svar registrert enna
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konsulent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontaktperson</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scores</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Besvart</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detaljer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {responses.map((response) => {
                      const allScores = (response.questionResponses || [])
                        .map(qr => qr.ratingValue)
                        .filter((v): v is number => v !== null && v !== undefined)

                      return (
                        <tr key={response.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{response.consultantName}</td>
                          <td className="px-6 py-4 text-sm">{response.organizationName || '-'}</td>
                          <td className="px-6 py-4 text-sm">{response.contactName || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            {allScores.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {allScores.map((score, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 text-xs rounded ${
                                      score >= 5 ? 'bg-green-100 text-green-700' :
                                      score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {score}
                                  </span>
                                ))}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {response.respondedAt ? new Date(response.respondedAt).toLocaleDateString('nb-NO') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedResponse(response)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Se svar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Svardetaljer</h3>
                  <p className="text-gray-600 mt-1">
                    {selectedResponse.consultantName} - {selectedResponse.organizationName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Response info */}
              <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 rounded-lg p-4">
                <div>
                  <div className="text-sm text-gray-500">Kontaktperson</div>
                  <div className="font-medium">{selectedResponse.contactName}</div>
                  {selectedResponse.contactEmail && (
                    <div className="text-sm text-gray-500">{selectedResponse.contactEmail}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Gjennomsnittlig score</div>
                  <div className="font-medium">
                    {selectedResponse.averageScore !== undefined && selectedResponse.averageScore !== null ? (
                      <span className={`px-2 py-1 text-sm font-medium rounded ${getScoreStyle(selectedResponse.averageScore)}`}>
                        {selectedResponse.averageScore.toFixed(1)}
                      </span>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Besvart</div>
                  <div className="font-medium">
                    {selectedResponse.respondedAt
                      ? new Date(selectedResponse.respondedAt).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Question responses */}
              <h4 className="font-semibold text-gray-900 mb-4">Svar på spørsmål</h4>
              {selectedResponse.questionResponses && selectedResponse.questionResponses.length > 0 ? (
                <div className="space-y-4">
                  {selectedResponse.questionResponses.map((qr, index) => (
                    <div key={qr.questionId || index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">{qr.questionCode}</div>
                          <div className="font-medium text-gray-900">{qr.questionText}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {qr.questionType === 'RATING_1_6' && qr.ratingValue !== undefined && qr.ratingValue !== null && (
                            <span className={`px-3 py-1 text-lg font-bold rounded ${getScoreStyle(qr.ratingValue)}`}>
                              {qr.ratingValue}
                            </span>
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
                      {qr.questionType === 'FREE_TEXT' && qr.textValue && (
                        <div className="mt-3 bg-gray-50 rounded p-3 text-gray-700 whitespace-pre-wrap">
                          {qr.textValue}
                        </div>
                      )}
                      {qr.questionType === 'RATING_1_6' && qr.textValue && (
                        <div className="mt-3 bg-blue-50 rounded p-3 text-gray-700 whitespace-pre-wrap">
                          <div className="text-xs text-blue-600 font-medium mb-1">Kommentar:</div>
                          {qr.textValue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">Ingen detaljerte svar tilgjengelig</div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit Name Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rediger undersøkelse</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. KTI Var 2025"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateName}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Lagrer...' : 'Lagre'}
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
              <div>
                <div className="text-sm text-gray-500 mb-1">{editingResponse.questionCode}</div>
                <div className="font-medium text-gray-900 mb-3">{editingResponse.questionText}</div>
              </div>

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
                            ? score >= 5
                              ? 'bg-green-600 text-white'
                              : score >= 3
                              ? 'bg-yellow-500 text-white'
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
                  placeholder={editingResponse.questionType === 'FREE_TEXT' ? 'Skriv svar...' : 'Valgfri kommentar...'}
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
                <button
                  onClick={() => setEditingResponse(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
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

      {/* Create Assignment Modal */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Opprett ny tildeling</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konsulent *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson *</label>
                <select
                  value={newAssignment.contactId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, contactId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value={0}>Velg kontakt...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.email ? ` <${c.email}>` : ''} - {c.organizationName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notater (valgfritt)</label>
                <textarea
                  value={newAssignment.notes || ''}
                  onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateAssignmentModal(false)
                  setNewAssignment({ consultantId: 0, contactId: 0 })
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={creatingAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingAssignment ? 'Oppretter...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Legg til spørsmål</h2>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Velg et spørsmål fra listen nedenfor for a legge det til undersøkelsen.
            </p>
            <div className="overflow-y-auto flex-1 space-y-3">
              {availableQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Alle tilgjengelige spørsmål er allerede lagt til.</p>
              ) : (
                availableQuestions
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((question) => (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors ${!question.active ? 'opacity-60' : ''}`}
                      onClick={() => {
                        handleAddQuestion(question.id)
                        setShowAddQuestionModal(false)
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {question.code}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              question.questionType === 'RATING_1_6'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {question.questionType === 'RATING_1_6' ? 'Score 1-6' : 'Fritekst'}
                            </span>
                            {!question.active && (
                              <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600">
                                Inaktiv i mal
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{question.textNo}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            Kategori: {question.category}
                          </div>
                        </div>
                        <button
                          disabled={addingQuestion}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddQuestion(question.id)
                            setShowAddQuestionModal(false)
                          }}
                        >
                          {addingQuestion ? '...' : 'Legg til'}
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between">
              <button
                onClick={() => {
                  setShowAddQuestionModal(false)
                  setShowCreateQuestionModal(true)
                }}
                className="px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                + Opprett nytt spørsmål
              </button>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Question Modal */}
      {showCreateQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Opprett nytt spørsmål</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
                <input
                  type="text"
                  value={newQuestion.code}
                  onChange={(e) => setNewQuestion({ ...newQuestion, code: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. Q14, CUSTOM1"
                />
                <p className="text-xs text-gray-500 mt-1">Unik identifikator for spørsmålet</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spørsmålstekst (norsk) *</label>
                <textarea
                  value={newQuestion.textNo}
                  onChange={(e) => setNewQuestion({ ...newQuestion, textNo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Skriv spørsmålet her..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spørsmålstekst (engelsk)</label>
                <textarea
                  value={newQuestion.textEn || ''}
                  onChange={(e) => setNewQuestion({ ...newQuestion, textEn: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Optional English translation..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={newQuestion.questionType}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value as KtiQuestionType })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="RATING_1_6">Score 1-6</option>
                    <option value="FREE_TEXT">Fritekst</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                  <input
                    type="text"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="f.eks. Leveranse, Kommunikasjon"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newQuestion.required ?? true}
                  onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="required" className="text-sm text-gray-700">Påkrevd spørsmål</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateQuestionModal(false)
                  setShowAddQuestionModal(true)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateQuestion}
                disabled={creatingQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingQuestion ? 'Oppretter...' : 'Opprett og legg til'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Preview Header with JPro logo */}
            <div className="bg-[#1a1a2e] shadow-sm px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/jpro-logo.svg"
                  alt="JPro"
                  width={80}
                  height={55}
                />
                <span className="text-gray-300">|</span>
                <span className="text-white">Forhåndsvisning</span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Survey Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  Kundetilfredshetsundersøkelse
                </h1>
                <p className="text-gray-600">
                  {survey.name} ({survey.year})
                </p>
              </div>

              {/* Consultant info placeholder */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8 text-center">
                <p className="text-gray-600 mb-1">Din tilbakemelding om</p>
                <p className="text-xl font-semibold text-blue-800">[Konsulentens navn]</p>
                <p className="text-gray-500 text-sm mt-1">fra [Kundens organisasjon]</p>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm text-gray-600">
                <p>
                  Vennligst vurder konsulentens arbeid på en skala fra 1 til 6, der 1 er svært misfornøyd og 6
                  er svært fornøyd. Spørsmål merket med <span className="text-red-500">*</span> er
                  obligatoriske.
                </p>
              </div>

              {/* Questions grouped by category */}
              {(() => {
                const activeQuestions = roundQuestions.filter(rq => rq.active)
                const grouped = activeQuestions.reduce((acc, rq) => {
                  const category = rq.question.category || 'Generelt'
                  if (!acc[category]) acc[category] = []
                  acc[category].push(rq)
                  return acc
                }, {} as Record<string, KtiRoundQuestion[]>)

                return Object.entries(grouped).map(([category, questions]) => (
                  <div key={category} className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                      {translateCategory(category)}
                    </h2>
                    <div className="space-y-6">
                      {questions
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((rq) => (
                        <div
                          key={rq.id}
                          className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                          <label className="block text-gray-800 font-medium mb-2">
                            {rq.question.textNo}
                            {rq.question.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {rq.question.questionType === 'FREE_TEXT' ? (
                            <textarea
                              rows={4}
                              disabled
                              className="w-full mt-3 border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 resize-none"
                              placeholder="Skriv din kommentar her..."
                            />
                          ) : (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-2">
                                <span>1 - Svært misfornøyd</span>
                                <span>6 - Svært fornøyd</span>
                              </div>
                              <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5, 6].map((value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    disabled
                                    className="w-12 h-12 rounded-lg text-lg font-medium bg-gray-100 text-gray-700 cursor-not-allowed"
                                  >
                                    {value}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}

              {/* Submit button preview */}
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled
                  className="px-8 py-4 rounded-lg text-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  Send inn svar
                </button>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Dette er en forhåndsvisning. Knappene er deaktivert.
              </p>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lukk forhåndsvisning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
