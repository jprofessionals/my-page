'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  salesPipelineService,
  type FlowcaseConsultant,
  type AvailabilityStatus,
} from '@/services/salesPipeline.service'

interface Props {
  onClose: () => void
  onAdded: () => void
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Ledig' },
  { value: 'AVAILABLE_SOON', label: 'Snart ledig' },
  { value: 'OCCUPIED', label: 'Opptatt' },
]

// Searchable consultant picker component
function ConsultantPicker({
  consultants,
  selectedId,
  onSelect,
  loading,
}: {
  consultants: FlowcaseConsultant[]
  selectedId: string | null
  onSelect: (consultant: FlowcaseConsultant | null) => void
  loading: boolean
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedConsultant = consultants.find((c) => c.id === selectedId)

  const filteredConsultants = consultants.filter((consultant) => {
    const searchLower = search.toLowerCase()
    return (
      consultant.name?.toLowerCase().includes(searchLower) ||
      consultant.email?.toLowerCase().includes(searchLower)
    )
  })

  useEffect(() => {
    setHighlightedIndex(0)
  }, [search])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsOpen(true)
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, filteredConsultants.length - 1)
          )
          e.preventDefault()
          break
        case 'ArrowUp':
          setHighlightedIndex((prev) => Math.max(prev - 1, 0))
          e.preventDefault()
          break
        case 'Enter':
          if (filteredConsultants[highlightedIndex]) {
            onSelect(filteredConsultants[highlightedIndex])
            setSearch('')
            setIsOpen(false)
          }
          e.preventDefault()
          break
        case 'Escape':
          setIsOpen(false)
          setSearch('')
          break
      }
    },
    [isOpen, filteredConsultants, highlightedIndex, onSelect]
  )

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            className="input input-bordered w-full"
            placeholder={selectedConsultant ? '' : 'Søk etter konsulent...'}
            value={isOpen ? search : selectedConsultant?.name || ''}
            onChange={(e) => {
              setSearch(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => {
              setIsOpen(true)
              if (selectedConsultant) {
                setSearch('')
              }
            }}
            onBlur={() => {
              // Delay to allow click on list item
              setTimeout(() => setIsOpen(false), 200)
            }}
            onKeyDown={handleKeyDown}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          )}
        </div>
        {selectedConsultant && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onSelect(null)
              inputRef.current?.focus()
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && !loading && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredConsultants.length === 0 ? (
            <li className="p-3 text-gray-500">
              {search ? 'Ingen treff' : 'Ingen konsulenter funnet'}
            </li>
          ) : (
            filteredConsultants.map((consultant, index) => (
              <li
                key={consultant.id}
                className={`p-3 cursor-pointer hover:bg-base-200 flex items-center gap-3 ${
                  index === highlightedIndex ? 'bg-base-200' : ''
                } ${consultant.id === selectedId ? 'bg-primary/10' : ''}`}
                onClick={() => {
                  onSelect(consultant)
                  setSearch('')
                  setIsOpen(false)
                }}
              >
                {consultant.imageUrl ? (
                  <img
                    src={consultant.imageUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {consultant.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{consultant.name}</span>
                  {consultant.email && (
                    <span className="text-xs text-gray-500">{consultant.email}</span>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default function AddConsultantModal({ onClose, onAdded }: Props) {
  const [loading, setLoading] = useState(false)
  const [consultants, setConsultants] = useState<FlowcaseConsultant[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    availabilityStatus: 'AVAILABLE' as AvailabilityStatus,
    notes: '',
  })

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    setLoadingData(true)
    try {
      const consultantsData = await salesPipelineService.getFlowcaseConsultants()
      setConsultants(consultantsData ?? [])
    } catch (error) {
      console.error('Failed to load form data:', error)
      toast.error('Kunne ikke laste data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleConsultantSelect = (consultant: FlowcaseConsultant | null) => {
    if (consultant) {
      setSelectedConsultantId(consultant.id)
    } else {
      setSelectedConsultantId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedConsultantId) {
      toast.error('Du må velge en konsulent')
      return
    }

    setLoading(true)
    try {
      // Find the selected consultant to get their email for lookup
      const selectedConsultant = consultants.find(c => c.id === selectedConsultantId)

      if (!selectedConsultant?.email) {
        toast.error('Konsulenten mangler e-post')
        setLoading(false)
        return
      }

      await salesPipelineService.addConsultantToBoard({
        flowcaseEmail: selectedConsultant.email,
        availabilityStatus: formData.availabilityStatus,
        notes: formData.notes || undefined,
      })
      toast.success('Konsulent lagt til!')
      onAdded()
    } catch (error) {
      console.error('Failed to add consultant:', error)
      toast.error('Kunne ikke legge til konsulenten. Er konsulenten allerede på tavlen?')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>
    )
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Legg til konsulent</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Consultant picker (searchable) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Konsulent *</span>
              <span className="label-text-alt text-gray-500">
                {consultants.length} konsulenter fra Flowcase
              </span>
            </label>
            <ConsultantPicker
              consultants={consultants}
              selectedId={selectedConsultantId}
              onSelect={handleConsultantSelect}
              loading={loadingData}
            />
          </div>

          {/* Availability status */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tilgjengelighet</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={formData.availabilityStatus}
              onChange={(e) =>
                setFormData({ ...formData, availabilityStatus: e.target.value as AvailabilityStatus })
              }
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Notater</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Eventuelle notater..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

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
                'Legg til'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
