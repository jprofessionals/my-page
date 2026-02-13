'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import {
  salesPipelineService,
  type SalesActivity,
  type SalesStage,
  type ClosedReason,
  type InterviewRound,
  type KeyFactor,
} from '@/services/salesPipeline.service'

interface Props {
  activity: SalesActivity
  onClose: () => void
  onUpdated: () => void
}

const STAGE_OPTIONS: { value: SalesStage; label: string }[] = [
  { value: 'INTERESTED', label: 'Interessert' },
  { value: 'SENT_TO_SUPPLIER', label: 'Sendt til leverandør' },
  { value: 'SENT_TO_CUSTOMER', label: 'Sendt til kunde' },
  { value: 'INTERVIEW', label: 'Intervju' },
]

const CLOSED_REASON_OPTIONS: { value: ClosedReason; label: string }[] = [
  { value: 'REJECTED_BY_SUPPLIER', label: 'Avvist av leverandør' },
  { value: 'REJECTED_BY_CUSTOMER', label: 'Avvist av kunde' },
  { value: 'MISSING_REQUIREMENTS', label: 'Manglende krav' },
  { value: 'LOST_AT_SUPPLIER', label: 'Tapt i leverandørvurdering' },
  { value: 'LOST_AT_CUSTOMER', label: 'Tapt hos kunde' },
  { value: 'ASSIGNMENT_CANCELLED', label: 'Oppdrag kansellert' },
  { value: 'CONSULTANT_UNAVAILABLE', label: 'Konsulent utilgjengelig' },
  { value: 'CONSULTANT_WON_OTHER', label: 'Konsulent vant annet' },
  { value: 'OTHER', label: 'Annet' },
]

const KEY_FACTOR_OPTIONS: { value: KeyFactor; label: string }[] = [
  { value: 'PRICE', label: 'Pris' },
  { value: 'EXPERIENCE', label: 'Erfaring' },
  { value: 'AVAILABILITY', label: 'Tilgjengelighet' },
  { value: 'CUSTOMER_FIT', label: 'Kundematch' },
  { value: 'TECHNICAL_MATCH', label: 'Teknisk match' },
  { value: 'REFERENCES', label: 'Referanser' },
  { value: 'OTHER', label: 'Annet' },
]

export default function EditActivityModal({
  activity,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showWonDialog, setShowWonDialog] = useState(false)
  const [actualStartDate, setActualStartDate] = useState<string>(
    activity.expectedStartDate || '',
  )
  const [closeReason, setCloseReason] =
    useState<ClosedReason>('LOST_AT_CUSTOMER')
  const [closeReasonNote, setCloseReasonNote] = useState('')
  // Evaluation fields for won/close dialogs
  const [matchRating, setMatchRating] = useState<number | undefined>(undefined)
  const [keyFactors, setKeyFactors] = useState<KeyFactor[]>([])
  const [evaluationNotes, setEvaluationNotes] = useState('')
  const [evaluationDocumentUrl, setEvaluationDocumentUrl] = useState('')
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>(
    activity.interviewRounds || [],
  )
  const [newInterviewDate, setNewInterviewDate] = useState('')
  const [newInterviewTime, setNewInterviewTime] = useState('10:00')
  const [newInterviewNotes, setNewInterviewNotes] = useState('')
  const [addingRound, setAddingRound] = useState(false)

  const toggleKeyFactor = (factor: KeyFactor) => {
    setKeyFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor],
    )
  }

  // Parse datetime for form input (round to nearest 5 minutes)
  const parseDateTime = (
    dateTimeStr: string | undefined | null,
    defaultTime: string,
  ) => {
    if (!dateTimeStr) return { date: '', time: defaultTime }
    const dt = new Date(dateTimeStr)
    const date = dt.toISOString().split('T')[0]
    const hours = dt.getHours()
    const minutes = dt.getMinutes()
    // Round to nearest 5 minutes
    const roundedMinutes = Math.round(minutes / 5) * 5
    const adjustedHours = roundedMinutes === 60 ? hours + 1 : hours
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes
    const time = `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`
    return { date, time }
  }

  const { date: initialDeadlineDate, time: initialDeadlineTime } =
    parseDateTime(activity.offerDeadline, '12:00')
  const { date: initialInterviewDate, time: initialInterviewTime } =
    parseDateTime(activity.interviewDate, '10:00')

  const [formData, setFormData] = useState({
    title: activity.title,
    customerName: activity.customerName || activity.customer?.name || '',
    supplierName: activity.supplierName || '',
    currentStage: activity.currentStage,
    maxPrice: activity.maxPrice || undefined,
    offeredPrice: activity.offeredPrice || undefined,
    notes: activity.notes || '',
    expectedStartDate: activity.expectedStartDate || '',
    offerDeadlineDate: initialDeadlineDate,
    offerDeadlineTime: initialDeadlineTime || '12:00',
    offerDeadlineAsap: activity.offerDeadlineAsap || false,
    interviewDate: initialInterviewDate,
    interviewTime: initialInterviewTime || '10:00',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Du må fylle inn en tittel')
      return
    }

    setLoading(true)
    try {
      // Combine date and time for offerDeadline (if not ASAP)
      // Use ISO format with timezone offset to preserve local time
      let offerDeadline: string | undefined = undefined
      if (!formData.offerDeadlineAsap && formData.offerDeadlineDate) {
        const dateTime = `${formData.offerDeadlineDate}T${formData.offerDeadlineTime || '12:00'}:00`
        const date = new Date(dateTime)
        // Get timezone offset in minutes and convert to hours:minutes format
        const tzOffset = -date.getTimezoneOffset()
        const tzHours = Math.floor(Math.abs(tzOffset) / 60)
          .toString()
          .padStart(2, '0')
        const tzMins = (Math.abs(tzOffset) % 60).toString().padStart(2, '0')
        const tzSign = tzOffset >= 0 ? '+' : '-'
        offerDeadline = `${formData.offerDeadlineDate}T${formData.offerDeadlineTime || '12:00'}:00${tzSign}${tzHours}:${tzMins}`
      }

      // Combine date and time for interviewDate
      let interviewDate: string | undefined = undefined
      if (formData.interviewDate) {
        const dateTime = `${formData.interviewDate}T${formData.interviewTime || '10:00'}:00`
        const date = new Date(dateTime)
        const tzOffset = -date.getTimezoneOffset()
        const tzHours = Math.floor(Math.abs(tzOffset) / 60)
          .toString()
          .padStart(2, '0')
        const tzMins = (Math.abs(tzOffset) % 60).toString().padStart(2, '0')
        const tzSign = tzOffset >= 0 ? '+' : '-'
        interviewDate = `${formData.interviewDate}T${formData.interviewTime || '10:00'}:00${tzSign}${tzHours}:${tzMins}`
      }

      // Update activity details
      await salesPipelineService.updateActivity(activity.id, {
        title: formData.title,
        customerName: formData.customerName || undefined,
        supplierName: formData.supplierName || undefined,
        maxPrice: formData.maxPrice || undefined,
        offeredPrice: formData.offeredPrice || undefined,
        notes: formData.notes || undefined,
        expectedStartDate: formData.expectedStartDate || undefined,
        offerDeadline: offerDeadline,
        offerDeadlineAsap: formData.offerDeadlineAsap,
        interviewDate: interviewDate,
      })

      // Update stage separately if it changed
      if (formData.currentStage !== activity.currentStage) {
        await salesPipelineService.updateStage(activity.id, {
          stage: formData.currentStage,
        })
      }

      toast.success('Aktivitet oppdatert!')
      onUpdated()
    } catch (error) {
      console.error('Failed to update activity:', error)
      toast.error('Kunne ikke oppdatere aktiviteten')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsWon = async () => {
    setLoading(true)
    try {
      await salesPipelineService.markAsWon(activity.id, {
        actualStartDate: actualStartDate || undefined,
        matchRating: matchRating || undefined,
        evaluationNotes: evaluationNotes || undefined,
        evaluationDocumentUrl: evaluationDocumentUrl || undefined,
        keyFactors: keyFactors.length > 0 ? keyFactors : undefined,
      })

      const today = new Date().toISOString().split('T')[0]
      if (actualStartDate && actualStartDate > today) {
        toast.success(
          `Aktivitet markert som vunnet! Konsulenten har status TILDELT frem til oppstart.`,
        )
      } else {
        toast.success('Aktivitet markert som vunnet!')
      }
      onUpdated()
    } catch (error) {
      console.error('Failed to mark as won:', error)
      toast.error('Kunne ikke markere som vunnet')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    setLoading(true)
    try {
      await salesPipelineService.closeActivity(activity.id, {
        reason: closeReason,
        note: closeReasonNote || undefined,
        matchRating: matchRating || undefined,
        evaluationNotes: evaluationNotes || undefined,
        evaluationDocumentUrl: evaluationDocumentUrl || undefined,
        keyFactors: keyFactors.length > 0 ? keyFactors : undefined,
      })
      toast.success('Aktivitet lukket')
      onUpdated()
    } catch (error) {
      console.error('Failed to close activity:', error)
      toast.error('Kunne ikke lukke aktiviteten')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Er du sikker på at du vil slette denne aktiviteten? Dette kan ikke angres.',
      )
    ) {
      return
    }
    setLoading(true)
    try {
      await salesPipelineService.deleteActivity(activity.id)
      toast.success('Aktivitet slettet')
      onUpdated()
    } catch (error) {
      console.error('Failed to delete activity:', error)
      toast.error('Kunne ikke slette aktiviteten')
    } finally {
      setLoading(false)
    }
  }

  const handleAddInterviewRound = async () => {
    setAddingRound(true)
    try {
      let interviewDate: string | undefined = undefined
      if (newInterviewDate) {
        const dateTime = `${newInterviewDate}T${newInterviewTime || '10:00'}:00`
        const date = new Date(dateTime)
        const tzOffset = -date.getTimezoneOffset()
        const tzHours = Math.floor(Math.abs(tzOffset) / 60)
          .toString()
          .padStart(2, '0')
        const tzMins = (Math.abs(tzOffset) % 60).toString().padStart(2, '0')
        const tzSign = tzOffset >= 0 ? '+' : '-'
        interviewDate = `${newInterviewDate}T${newInterviewTime || '10:00'}:00${tzSign}${tzHours}:${tzMins}`
      }

      const round = await salesPipelineService.addInterviewRound(activity.id, {
        interviewDate,
        notes: newInterviewNotes || undefined,
      })
      if (round) {
        setInterviewRounds([...interviewRounds, round])
      }
      setNewInterviewDate('')
      setNewInterviewTime('10:00')
      setNewInterviewNotes('')
      toast.success('Intervjurunde lagt til')
    } catch (error) {
      console.error('Failed to add interview round:', error)
      toast.error('Kunne ikke legge til intervjurunde')
    } finally {
      setAddingRound(false)
    }
  }

  const handleDeleteInterviewRound = async (roundId: number) => {
    if (!confirm('Er du sikker på at du vil slette denne intervjurunden?')) {
      return
    }
    try {
      await salesPipelineService.deleteInterviewRound(activity.id, roundId)
      setInterviewRounds(interviewRounds.filter((r) => r.id !== roundId))
      toast.success('Intervjurunde slettet')
    } catch (error) {
      console.error('Failed to delete interview round:', error)
      toast.error('Kunne ikke slette intervjurunde')
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Rediger aktivitet</h3>

        {/* Mark as won dialog */}
        {showWonDialog ? (
          <div className="space-y-4">
            <div className="alert alert-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Marker aktiviteten som vunnet</span>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Når starter konsulenten?
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={actualStartDate}
                onChange={(e) => setActualStartDate(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  Hvis tom eller i dag/fortid: Status settes til OPPTATT
                  umiddelbart.
                  <br />
                  Hvis fremtidig dato: Status settes til TILDELT frem til
                  oppstart.
                </span>
              </label>
            </div>

            {/* Evaluation section */}
            <div className="divider text-sm text-gray-500">
              Evaluering (valgfritt)
            </div>

            {/* Match rating (1-5 stars) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Match-rating</span>
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`btn btn-sm btn-circle ${
                      matchRating && star <= matchRating
                        ? 'btn-warning text-warning-content'
                        : 'btn-ghost'
                    }`}
                    onClick={() =>
                      setMatchRating(star === matchRating ? undefined : star)
                    }
                    title={`${star} av 5`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={
                        matchRating && star <= matchRating
                          ? 'currentColor'
                          : 'none'
                      }
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={
                          matchRating && star <= matchRating ? 0 : 1.5
                        }
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                ))}
                {matchRating && (
                  <span className="text-sm text-gray-500 ml-2 self-center">
                    {matchRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Key factors */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nokkelfaktorer</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {KEY_FACTOR_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      keyFactors.includes(option.value)
                        ? 'bg-primary text-primary-content border-primary'
                        : 'bg-base-100 border-base-300 hover:border-primary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={keyFactors.includes(option.value)}
                      onChange={() => toggleKeyFactor(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Evaluation notes */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Evalueringsnotater
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Notater om hvorfor vi vant..."
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Document link */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Dokumentlenke</span>
              </label>
              <input
                type="url"
                className="input input-bordered w-full"
                placeholder="https://..."
                value={evaluationDocumentUrl}
                onChange={(e) => setEvaluationDocumentUrl(e.target.value)}
              />
            </div>

            <div className="alert alert-warning text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                Andre aktive prosesser for konsulenten vil bli lukket.
              </span>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowWonDialog(false)}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleMarkAsWon}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Bekreft vunnet'
                )}
              </button>
            </div>
          </div>
        ) : showCloseDialog ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Velg årsak for å lukke aktiviteten:
            </p>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Årsak</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value as ClosedReason)}
              >
                {CLOSED_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Notat (valgfritt)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="F.eks. 'Tapte på pris' eller 'Kunde valgte annen leverandør'"
                value={closeReasonNote}
                onChange={(e) => setCloseReasonNote(e.target.value)}
                rows={2}
              />
            </div>

            {/* Evaluation section */}
            <div className="divider text-sm text-gray-500">
              Evaluering (valgfritt)
            </div>

            {/* Match rating (1-5 stars) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Match-rating</span>
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`btn btn-sm btn-circle ${
                      matchRating && star <= matchRating
                        ? 'btn-warning text-warning-content'
                        : 'btn-ghost'
                    }`}
                    onClick={() =>
                      setMatchRating(star === matchRating ? undefined : star)
                    }
                    title={`${star} av 5`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={
                        matchRating && star <= matchRating
                          ? 'currentColor'
                          : 'none'
                      }
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={
                          matchRating && star <= matchRating ? 0 : 1.5
                        }
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                ))}
                {matchRating && (
                  <span className="text-sm text-gray-500 ml-2 self-center">
                    {matchRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Key factors */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nokkelfaktorer</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {KEY_FACTOR_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      keyFactors.includes(option.value)
                        ? 'bg-primary text-primary-content border-primary'
                        : 'bg-base-100 border-base-300 hover:border-primary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={keyFactors.includes(option.value)}
                      onChange={() => toggleKeyFactor(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Evaluation notes */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Evalueringsnotater
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Notater om utfallet..."
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Document link */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Dokumentlenke</span>
              </label>
              <input
                type="url"
                className="input input-bordered w-full"
                placeholder="https://..."
                value={evaluationDocumentUrl}
                onChange={(e) => setEvaluationDocumentUrl(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCloseDialog(false)}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleClose}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Lukk aktivitet'
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Consultant (read-only) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Konsulent</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-base-200"
                value={
                  activity.consultant.name || activity.consultant.email || ''
                }
                disabled
              />
            </div>

            {/* Customer name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Kunde</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="F.eks. 'Equinor', 'NAV', 'DNB'..."
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
              />
            </div>

            {/* Supplier name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Leverandør / Mellomledd</span>
                <span className="label-text-alt text-gray-500">
                  Hvis vi er underleverandør
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="F.eks. 'Bouvet', 'Sopra Steria'..."
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
              />
            </div>

            {/* Title */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Tittel / Beskrivelse *</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="F.eks. 'Prosjekt hos Kunde X'"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Stage select */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Steg i prosessen</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.currentStage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentStage: e.target.value as SalesStage,
                  })
                }
              >
                {STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Makspris (kr/t)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="F.eks. 1500"
                  value={formData.maxPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tilbudt pris (kr/t)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="F.eks. 1350"
                  value={formData.offeredPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      offeredPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Expected start date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Forventet oppstart</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.expectedStartDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedStartDate: e.target.value || '',
                  })
                }
              />
            </div>

            {/* Offer deadline */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Tilbudsfrist</span>
                <span className="label-text-alt text-gray-500">
                  Slack-varsel 24t før
                </span>
              </label>

              {/* ASAP checkbox */}
              <label className="label cursor-pointer justify-start gap-2 py-1">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={formData.offerDeadlineAsap}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      offerDeadlineAsap: e.target.checked,
                    })
                  }
                />
                <span className="label-text">ASAP (snarest mulig)</span>
              </label>

              {/* Date and time inputs (hidden if ASAP) */}
              {!formData.offerDeadlineAsap && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input input-bordered flex-1"
                    value={formData.offerDeadlineDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        offerDeadlineDate: e.target.value || '',
                      })
                    }
                  />
                  <select
                    className="select select-bordered w-28"
                    value={formData.offerDeadlineTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        offerDeadlineTime: e.target.value,
                      })
                    }
                  >
                    {Array.from({ length: 24 }, (_, hour) => [
                      `${hour.toString().padStart(2, '0')}:00`,
                      `${hour.toString().padStart(2, '0')}:30`,
                    ])
                      .flat()
                      .map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Interview rounds */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Intervjurunder</span>
              </label>

              {/* Existing interview rounds */}
              {interviewRounds.length > 0 && (
                <div className="space-y-2 mb-3">
                  {interviewRounds.map((round) => (
                    <div
                      key={round.id}
                      className="flex items-center gap-2 bg-base-200 p-2 rounded"
                    >
                      <span className="badge badge-primary">
                        #{round.roundNumber}
                      </span>
                      <span className="flex-1 text-sm">
                        {round.interviewDate
                          ? new Date(round.interviewDate).toLocaleDateString(
                              'nb-NO',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )
                          : 'Dato ikke satt'}
                        {round.notes && (
                          <span className="text-gray-500 ml-2">
                            - {round.notes}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleDeleteInterviewRound(round.id)}
                        title="Slett intervjurunde"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new interview round */}
              <div className="bg-base-200 p-3 rounded space-y-2">
                <div className="text-sm font-medium">
                  Legg til intervjurunde #{interviewRounds.length + 1}
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input input-bordered input-sm flex-1"
                    value={newInterviewDate}
                    onChange={(e) => setNewInterviewDate(e.target.value)}
                    placeholder="Dato"
                  />
                  <select
                    className="select select-bordered select-sm w-24"
                    value={newInterviewTime}
                    onChange={(e) => setNewInterviewTime(e.target.value)}
                  >
                    {Array.from({ length: 24 * 4 }, (_, i) => {
                      const hour = Math.floor(i / 4)
                      const minute = (i % 4) * 15
                      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                    }).map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="Notater (valgfritt)"
                  value={newInterviewNotes}
                  onChange={(e) => setNewInterviewNotes(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-primary w-full"
                  onClick={handleAddInterviewRound}
                  disabled={addingRound}
                >
                  {addingRound ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    '+ Legg til intervjurunde'
                  )}
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Notater</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Eventuelle notater..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="divider"></div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => setShowWonDialog(true)}
                disabled={loading}
              >
                Marker som vunnet
              </button>
              <button
                type="button"
                className="btn btn-warning btn-sm"
                onClick={() => setShowCloseDialog(true)}
                disabled={loading}
              >
                Lukk / Tapt
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm btn-outline"
                onClick={handleDelete}
                disabled={loading}
              >
                Slett
              </button>
            </div>

            {/* Submit buttons */}
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Avbryt
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Lagre'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
