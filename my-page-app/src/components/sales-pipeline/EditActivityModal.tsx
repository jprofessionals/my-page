'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import {
  salesPipelineService,
  type SalesActivity,
  type SalesStage,
  type ClosedReason,
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
  { value: 'OTHER_CANDIDATE_CHOSEN', label: 'Annen kandidat valgt' },
  { value: 'ASSIGNMENT_CANCELLED', label: 'Oppdrag kansellert' },
  { value: 'CONSULTANT_UNAVAILABLE', label: 'Konsulent utilgjengelig' },
  { value: 'CONSULTANT_WON_OTHER', label: 'Konsulent vant annet' },
  { value: 'OTHER', label: 'Annet' },
]

export default function EditActivityModal({ activity, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showWonDialog, setShowWonDialog] = useState(false)
  const [actualStartDate, setActualStartDate] = useState<string>(activity.expectedStartDate || '')
  const [closeReason, setCloseReason] = useState<ClosedReason>('OTHER_CANDIDATE_CHOSEN')
  const [closeReasonNote, setCloseReasonNote] = useState('')

  // Parse datetime for form input (round to nearest 5 minutes)
  const parseDateTime = (dateTimeStr: string | undefined | null, defaultTime: string) => {
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

  const { date: initialDeadlineDate, time: initialDeadlineTime } = parseDateTime(activity.offerDeadline, '12:00')
  const { date: initialInterviewDate, time: initialInterviewTime } = parseDateTime(activity.interviewDate, '10:00')

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
        const tzHours = Math.floor(Math.abs(tzOffset) / 60).toString().padStart(2, '0')
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
        const tzHours = Math.floor(Math.abs(tzOffset) / 60).toString().padStart(2, '0')
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
        await salesPipelineService.updateStage(activity.id, { stage: formData.currentStage })
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
      })

      const today = new Date().toISOString().split('T')[0]
      if (actualStartDate && actualStartDate > today) {
        toast.success(
          `Aktivitet markert som vunnet! Konsulenten har status TILDELT frem til oppstart.`
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
    if (!confirm('Er du sikker på at du vil slette denne aktiviteten? Dette kan ikke angres.')) {
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
                <span className="label-text font-medium">Når starter konsulenten?</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={actualStartDate}
                onChange={(e) => setActualStartDate(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  Hvis tom eller i dag/fortid: Status settes til OPPTATT umiddelbart.
                  <br />
                  Hvis fremtidig dato: Status settes til TILDELT frem til oppstart.
                </span>
              </label>
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
              <span>Andre aktive prosesser for konsulenten vil bli lukket.</span>
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
                value={activity.consultant.name || activity.consultant.email || ''}
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
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            {/* Supplier name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Leverandør / Mellomledd</span>
                <span className="label-text-alt text-gray-500">Hvis vi er underleverandør</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="F.eks. 'Bouvet', 'Sopra Steria'..."
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  setFormData({ ...formData, currentStage: e.target.value as SalesStage })
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
                      maxPrice: e.target.value ? Number(e.target.value) : undefined,
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
                      offeredPrice: e.target.value ? Number(e.target.value) : undefined,
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

            {/* Interview date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Intervjudato</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="input input-bordered flex-1"
                  value={formData.interviewDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interviewDate: e.target.value || '',
                    })
                  }
                />
                <select
                  className="select select-bordered w-28"
                  value={formData.interviewTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interviewTime: e.target.value,
                    })
                  }
                >
                  {Array.from({ length: 24 * 12 }, (_, i) => {
                    const hour = Math.floor(i / 12)
                    const minute = (i % 12) * 5
                    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                  }).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
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
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
