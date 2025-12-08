'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import {
  salesPipelineService,
  type ConsultantWithActivities,
  type AvailabilityStatus,
} from '@/services/salesPipeline.service'

interface Props {
  consultant: ConsultantWithActivities
  onClose: () => void
  onUpdated: () => void
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; description: string }[] = [
  { value: 'AVAILABLE', label: 'Ledig nå', description: 'Konsulenten er tilgjengelig for nye oppdrag' },
  { value: 'AVAILABLE_SOON', label: 'Blir ledig', description: 'Konsulenten blir ledig på en gitt dato' },
  { value: 'OCCUPIED', label: 'Opptatt', description: 'Konsulenten er i et oppdrag og ikke tilgjengelig' },
]

export default function EditAvailabilityModal({ consultant, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const { consultant: user, availability } = consultant

  const [formData, setFormData] = useState({
    status: availability?.status || 'AVAILABLE' as AvailabilityStatus,
    availableFrom: availability?.availableFrom || '',
    notes: availability?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.status === 'AVAILABLE_SOON' && !formData.availableFrom) {
      toast.error('Du må velge en dato for når konsulenten blir ledig')
      return
    }

    setLoading(true)
    try {
      await salesPipelineService.updateAvailability(user.id!, {
        status: formData.status,
        availableFrom: formData.status === 'AVAILABLE_SOON' ? formData.availableFrom : undefined,
        notes: formData.notes || undefined,
      })
      toast.success('Tilgjengelighet oppdatert!')
      onUpdated()
    } catch (error) {
      console.error('Failed to update availability:', error)
      toast.error('Kunne ikke oppdatere tilgjengelighet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">
          Rediger tilgjengelighet for {user.name || user.email}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.status === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-base-content/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    className="radio radio-primary mt-0.5"
                    checked={formData.status === option.value}
                    onChange={() => setFormData({ ...formData, status: option.value })}
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Available from date (only shown for AVAILABLE_SOON) */}
          {formData.status === 'AVAILABLE_SOON' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Ledig fra dato *</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.availableFrom}
                onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                required
              />
            </div>
          )}

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Notater</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="F.eks. 'Ønsker kun remote-oppdrag' eller 'Prefererer fintech-bransjen'"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Current customer info (read-only) */}
          {availability?.currentCustomer && (
            <div className="alert alert-info">
              <span>
                Nåværende kunde: <strong>{availability.currentCustomer.name}</strong>
              </span>
            </div>
          )}

          {/* Buttons */}
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
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
