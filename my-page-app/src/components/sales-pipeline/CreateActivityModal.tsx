'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  salesPipelineService,
  type CreateSalesActivity,
  type SalesStage,
  type FlowcaseConsultant,
} from '@/services/salesPipeline.service'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const STAGE_OPTIONS: { value: SalesStage; label: string }[] = [
  { value: 'INTERESTED', label: 'Interessert' },
  { value: 'SENT_TO_SUPPLIER', label: 'Sendt til leverandør' },
  { value: 'SENT_TO_CUSTOMER', label: 'Sendt til kunde' },
  { value: 'INTERVIEW', label: 'Intervju' },
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

export default function CreateActivityModal({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [consultants, setConsultants] = useState<FlowcaseConsultant[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    consultantId: undefined as number | undefined,
    title: '',
    customerName: '',
    supplierName: '',
    currentStage: 'INTERESTED' as SalesStage,
    maxPrice: undefined as number | undefined,
    offeredPrice: undefined as number | undefined,
    notes: '',
    expectedStartDate: undefined as string | undefined,
    offerDeadlineDate: '',
    offerDeadlineTime: '12:00',
    offerDeadlineAsap: false,
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
      // For now, we need to map Flowcase ID to internal user ID
      // This might require a backend lookup, but for now we store the Flowcase ID
      // and handle the mapping on the backend
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

    if (!formData.title.trim()) {
      toast.error('Du må fylle inn en tittel')
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

      // Create activity using flowcaseEmail - backend will find or create the user
      await salesPipelineService.createActivity({
        flowcaseEmail: selectedConsultant.email,
        flowcaseName: selectedConsultant.name || undefined,
        customerName: formData.customerName || undefined,
        supplierName: formData.supplierName || undefined,
        title: formData.title,
        currentStage: formData.currentStage,
        maxPrice: formData.maxPrice || undefined,
        offeredPrice: formData.offeredPrice || undefined,
        notes: formData.notes || undefined,
        expectedStartDate: formData.expectedStartDate || undefined,
        offerDeadline: offerDeadline,
        offerDeadlineAsap: formData.offerDeadlineAsap,
      })
      toast.success('Aktivitet opprettet!')
      onCreated()
    } catch (error) {
      console.error('Failed to create activity:', error)
      toast.error('Kunne ikke opprette aktiviteten')
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
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Ny salgsaktivitet</h3>

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

          {/* Customer name (free text) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Kunde</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="F.eks. 'Equinor', 'NAV', 'DNB'..."
              value={formData.customerName || ''}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>

          {/* Supplier name (free text) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Leverandør / Mellomledd</span>
              <span className="label-text-alt text-gray-500">Hvis vi er underleverandør</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="F.eks. 'Bouvet', 'Sopra Steria'..."
              value={formData.supplierName || ''}
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
              value={formData.expectedStartDate || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expectedStartDate: e.target.value || undefined,
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
                'Opprett'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
