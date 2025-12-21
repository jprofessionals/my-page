'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { salesPipelineService, type SalesActivity } from '@/services/salesPipeline.service'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await salesPipelineService.markAsWon(activity.id, {
        actualStartDate: actualStartDate || undefined,
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
