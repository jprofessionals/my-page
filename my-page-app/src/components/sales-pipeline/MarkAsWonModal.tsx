'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { salesPipelineService, type SalesActivity, type KeyFactor } from '@/services/salesPipeline.service'

const KEY_FACTOR_OPTIONS: { value: KeyFactor; label: string }[] = [
  { value: 'PRICE', label: 'Pris' },
  { value: 'EXPERIENCE', label: 'Erfaring' },
  { value: 'AVAILABILITY', label: 'Tilgjengelighet' },
  { value: 'CUSTOMER_FIT', label: 'Kundematch' },
  { value: 'TECHNICAL_MATCH', label: 'Teknisk match' },
  { value: 'REFERENCES', label: 'Referanser' },
  { value: 'OTHER', label: 'Annet' },
]

interface Props {
  activity: SalesActivity
  onClose: () => void
  onSuccess: () => void
}

export default function MarkAsWonModal({ activity, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [actualStartDate, setActualStartDate] = useState<string>(
    activity.expectedStartDate || ''
  )
  const [matchRating, setMatchRating] = useState<number | undefined>(undefined)
  const [keyFactors, setKeyFactors] = useState<KeyFactor[]>([])
  const [evaluationNotes, setEvaluationNotes] = useState('')
  const [evaluationDocumentUrl, setEvaluationDocumentUrl] = useState('')

  const toggleKeyFactor = (factor: KeyFactor) => {
    setKeyFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          `Aktivitet markert som vunnet! Konsulenten har status TILDELT frem til ${formatDate(actualStartDate)}.`
        )
      } else {
        toast.success('Aktivitet markert som vunnet!')
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to mark as won:', error)
      toast.error('Kunne ikke markere som vunnet')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const consultantName = activity.consultant.name || activity.consultant.email || 'Konsulent'
  const customerName = activity.customerName || activity.customer?.name || 'ukjent kunde'

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Marker som vunnet</h3>

        <div className="alert alert-info mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold">{consultantName}</p>
            <p className="text-sm">
              Vant oppdrag hos {customerName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Evaluation section */}
          <div className="divider text-sm text-gray-500">Evaluering (valgfritt)</div>

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
                  onClick={() => setMatchRating(star === matchRating ? undefined : star)}
                  title={`${star} av 5`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={matchRating && star <= matchRating ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={matchRating && star <= matchRating ? 0 : 1.5}
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </button>
              ))}
              {matchRating && (
                <span className="text-sm text-gray-500 ml-2 self-center">{matchRating}/5</span>
              )}
            </div>
          </div>

          {/* Key factors (multi-select checkboxes) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Nøkkelfaktorer</span>
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
              <span className="label-text font-medium">Evalueringsnotater</span>
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
            <span>Andre aktive prosesser for konsulenten vil bli lukket.</span>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Bekreft vunnet'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
