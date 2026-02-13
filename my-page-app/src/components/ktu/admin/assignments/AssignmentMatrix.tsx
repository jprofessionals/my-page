'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  KtuAssignment,
  KtuInvitation,
  KtuConsultant,
  KtuCustomerContact,
} from '@/services/ktu.service'

interface AssignmentMatrixProps {
  roundId: number
  orgId: number
  contacts: KtuCustomerContact[]
  allConsultants: KtuConsultant[]
  assignments: KtuAssignment[]
  invitations: KtuInvitation[]
  onAssignmentCreate: (consultantId: number, contactId: number) => Promise<void>
  onAssignmentDelete: (assignmentId: number) => Promise<void>
  onContactCreate: (name: string, email: string) => Promise<void>
  onContactUpdate: (
    contactId: number,
    data: { name?: string; email?: string; active?: boolean },
  ) => Promise<void>
  disabled: boolean
  manuallyAddedIds: Set<number>
  onManuallyAddedIdsChange: (ids: Set<number>) => void
}

interface CellState {
  loading: boolean
  error: boolean
}

export default function AssignmentMatrix({
  contacts,
  allConsultants,
  assignments,
  invitations,
  onAssignmentCreate,
  onAssignmentDelete,
  onContactCreate,
  onContactUpdate,
  disabled,
  manuallyAddedIds,
  onManuallyAddedIdsChange,
}: AssignmentMatrixProps) {
  // Track loading/error state per cell
  const [cellStates, setCellStates] = useState<Record<string, CellState>>({})

  // Search state for adding consultants
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // New contact form state
  const [showNewContactForm, setShowNewContactForm] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [creatingContact, setCreatingContact] = useState(false)

  // Contact menu state
  const [activeContactMenu, setActiveContactMenu] = useState<number | null>(
    null,
  )
  const contactMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Check if contact has any sent invitations (can only be deactivated, not deleted)
  const contactHasSentInvitations = useCallback(
    (contactId: number) => {
      return invitations.some((inv) => {
        const assignment = assignments.find((a) => a.id === inv.assignmentId)
        return (
          assignment?.contact.id === contactId &&
          ['SENT', 'OPENED', 'RESPONDED', 'EXPIRED'].includes(inv.status)
        )
      })
    },
    [invitations, assignments],
  )

  const handleCreateContact = async () => {
    if (!newContactName.trim()) return
    setCreatingContact(true)
    try {
      await onContactCreate(newContactName.trim(), newContactEmail.trim())
      setNewContactName('')
      setNewContactEmail('')
      setShowNewContactForm(false)
    } finally {
      setCreatingContact(false)
    }
  }

  const handleDeactivateContact = async (contactId: number) => {
    // Find all consultants who have assignments to this contact
    const consultantsWithAssignmentsToContact = assignments
      .filter((a) => a.contact.id === contactId)
      .map((a) => a.consultant.id)

    // ALWAYS preserve existing manually added consultants + add those with assignments
    // This ensures the state is explicitly updated before triggering reload
    const next = new Set(manuallyAddedIds)
    consultantsWithAssignmentsToContact.forEach((id) => next.add(id))
    onManuallyAddedIdsChange(next)

    setActiveContactMenu(null)

    // Small delay to ensure React state update is flushed before triggering reload
    await new Promise((resolve) => setTimeout(resolve, 0))

    await onContactUpdate(contactId, { active: false })
  }

  // Build lookup maps for performance
  const assignmentMap = useMemo(() => {
    const map = new Map<string, KtuAssignment>()
    assignments.forEach((a) => {
      const key = `${a.consultant.id}-${a.contact.id}`
      map.set(key, a)
    })
    return map
  }, [assignments])

  const invitationMap = useMemo(() => {
    const map = new Map<number, KtuInvitation>()
    invitations.forEach((i) => {
      if (i.assignmentId) {
        map.set(i.assignmentId, i)
      }
    })
    return map
  }, [invitations])

  // Get consultant IDs that have assignments for this org's contacts
  const consultantIdsWithAssignments = useMemo(() => {
    const contactIds = new Set(contacts.map((c) => c.id))
    const ids = new Set<number>()
    assignments.forEach((a) => {
      if (contactIds.has(a.contact.id)) {
        ids.add(a.consultant.id)
      }
    })
    return ids
  }, [assignments, contacts])

  // Visible consultants = those with assignments + manually added
  const visibleConsultants = useMemo(() => {
    const visibleIds = new Set([
      ...consultantIdsWithAssignments,
      ...manuallyAddedIds,
    ])
    return allConsultants
      .filter((c) => visibleIds.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
  }, [allConsultants, consultantIdsWithAssignments, manuallyAddedIds])

  // Consultants available to add (not already visible)
  const availableToAdd = useMemo(() => {
    const visibleIds = new Set([
      ...consultantIdsWithAssignments,
      ...manuallyAddedIds,
    ])
    return allConsultants
      .filter((c) => !visibleIds.has(c.id))
      .filter(
        (c) =>
          searchQuery.trim() === '' ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
      .slice(0, 10) // Limit results
  }, [
    allConsultants,
    consultantIdsWithAssignments,
    manuallyAddedIds,
    searchQuery,
  ])

  const getCellKey = useCallback(
    (consultantId: number, contactId: number) => `${consultantId}-${contactId}`,
    [],
  )

  const getAssignment = useCallback(
    (consultantId: number, contactId: number) =>
      assignmentMap.get(getCellKey(consultantId, contactId)),
    [assignmentMap, getCellKey],
  )

  const getInvitation = useCallback(
    (assignmentId: number) => invitationMap.get(assignmentId),
    [invitationMap],
  )

  const handleAddConsultant = (consultant: KtuConsultant) => {
    const next = new Set(manuallyAddedIds)
    next.add(consultant.id)
    onManuallyAddedIdsChange(next)
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleRemoveConsultant = (consultantId: number) => {
    // Can only remove if no assignments exist
    const hasAssignments = contacts.some((contact) =>
      getAssignment(consultantId, contact.id),
    )
    if (!hasAssignments) {
      const next = new Set(manuallyAddedIds)
      next.delete(consultantId)
      onManuallyAddedIdsChange(next)
    }
  }

  const handleToggle = useCallback(
    async (consultant: KtuConsultant, contact: KtuCustomerContact) => {
      const cellKey = getCellKey(consultant.id, contact.id)
      const assignment = getAssignment(consultant.id, contact.id)

      // Set loading state
      setCellStates((prev) => ({
        ...prev,
        [cellKey]: { loading: true, error: false },
      }))

      try {
        if (assignment) {
          // Delete assignment
          await onAssignmentDelete(assignment.id)
        } else {
          // Create assignment
          await onAssignmentCreate(consultant.id, contact.id)
        }
        // Clear loading state on success
        setCellStates((prev) => {
          const newState = { ...prev }
          delete newState[cellKey]
          return newState
        })
      } catch {
        // Set error state
        setCellStates((prev) => ({
          ...prev,
          [cellKey]: { loading: false, error: true },
        }))
        // Clear error after 2 seconds
        setTimeout(() => {
          setCellStates((prev) => {
            const newState = { ...prev }
            delete newState[cellKey]
            return newState
          })
        }, 2000)
      }
    },
    [onAssignmentCreate, onAssignmentDelete, getAssignment, getCellKey],
  )

  const getStatusIcon = (invitation: KtuInvitation | undefined) => {
    if (!invitation) return null

    switch (invitation.status) {
      case 'SENT':
      case 'OPENED':
        return (
          <span className="text-blue-500 ml-1" title="Invitasjon sendt">
            <svg
              className="w-3 h-3 inline"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </span>
        )
      case 'RESPONDED':
        return (
          <span className="text-green-500 ml-1" title="Besvart">
            <svg
              className="w-3 h-3 inline"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="text-red-500 ml-1" title="Utløpt">
            <svg
              className="w-3 h-3 inline"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )
      default:
        return null
    }
  }

  // Check if a consultant row can be removed (no assignments)
  const canRemoveConsultant = (consultantId: number) => {
    return !contacts.some((contact) => getAssignment(consultantId, contact.id))
  }

  if (contacts.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-4 text-center">
        Ingen kontakter i denne organisasjonen
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search to add consultant + add contact button */}
      <div className="flex items-center gap-3">
        <div ref={searchRef} className="relative flex-1 max-w-xs">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Søk og legg til konsulent..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Dropdown with search results */}
          {showDropdown &&
            searchQuery.trim() !== '' &&
            availableToAdd.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {availableToAdd.map((consultant) => (
                  <button
                    key={consultant.id}
                    onClick={() => handleAddConsultant(consultant)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {consultant.name}
                  </button>
                ))}
              </div>
            )}

          {showDropdown &&
            searchQuery.trim() !== '' &&
            availableToAdd.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                Ingen konsulenter funnet
              </div>
            )}
        </div>

        {!disabled && (
          <button
            onClick={() => setShowNewContactForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Ny kontakt
          </button>
        )}
      </div>

      {/* New contact form */}
      {showNewContactForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Navn *
              </label>
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Ola Nordmann"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                E-post
              </label>
              <input
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="ola@eksempel.no"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              onClick={handleCreateContact}
              disabled={creatingContact || !newContactName.trim()}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {creatingContact ? 'Lagrer...' : 'Legg til'}
            </button>
            <button
              onClick={() => {
                setShowNewContactForm(false)
                setNewContactName('')
                setNewContactEmail('')
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Matrix table */}
      {visibleConsultants.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">
          Søk etter en konsulent for å legge til kontaktpersoner
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-r min-w-[180px]">
                  Konsulent
                </th>
                {contacts.map((contact) => (
                  <th
                    key={contact.id}
                    className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-b min-w-[120px] relative"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <span
                          className="truncate max-w-[100px]"
                          title={contact.name}
                        >
                          {contact.name}
                        </span>
                        {!disabled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveContactMenu(contact.id)
                            }}
                            className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="Fjern kontakt"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div
                        className="text-gray-400 font-normal truncate text-[10px] max-w-[110px]"
                        title={contact.email || ''}
                      >
                        {contact.email || (
                          <span className="italic">ingen e-post</span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleConsultants.map((consultant) => {
                const canRemove = canRemoveConsultant(consultant.id)
                return (
                  <tr key={consultant.id} className="hover:bg-blue-50/30">
                    <td className="sticky left-0 bg-white px-3 py-2 text-sm font-medium text-gray-900 border-r whitespace-nowrap">
                      <div className="flex items-center justify-between gap-2">
                        <span>{consultant.name}</span>
                        {canRemove && !disabled && (
                          <button
                            onClick={() =>
                              handleRemoveConsultant(consultant.id)
                            }
                            className="text-gray-400 hover:text-red-500 p-0.5"
                            title="Fjern rad"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    {contacts.map((contact) => {
                      const cellKey = getCellKey(consultant.id, contact.id)
                      const assignment = getAssignment(
                        consultant.id,
                        contact.id,
                      )
                      const invitation = assignment
                        ? getInvitation(assignment.id)
                        : undefined
                      const cellState = cellStates[cellKey]
                      const isLoading = cellState?.loading
                      const hasError = cellState?.error

                      // Can't uncheck if invitation has been sent
                      const isLocked =
                        invitation &&
                        ['SENT', 'OPENED', 'RESPONDED', 'EXPIRED'].includes(
                          invitation.status,
                        )
                      const isDisabled = disabled || isLocked || isLoading

                      return (
                        <td
                          key={contact.id}
                          className={`px-2 py-2 text-center border-b ${
                            hasError
                              ? 'bg-red-50'
                              : isLocked
                                ? 'bg-gray-50'
                                : ''
                          }`}
                        >
                          <label
                            className={`inline-flex items-center justify-center ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            title={
                              isLocked
                                ? 'Kan ikke endres - invitasjon er sendt'
                                : undefined
                            }
                          >
                            {isLoading ? (
                              <svg
                                className="animate-spin h-4 w-4 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <>
                                <input
                                  type="checkbox"
                                  checked={!!assignment}
                                  onChange={() =>
                                    handleToggle(consultant, contact)
                                  }
                                  disabled={isDisabled}
                                  className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                    isDisabled
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                  }`}
                                />
                                {getStatusIcon(invitation)}
                              </>
                            )}
                          </label>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Contact delete confirmation modal */}
      {activeContactMenu !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div
            ref={contactMenuRef}
            className="bg-white rounded-lg shadow-xl p-4 min-w-[280px]"
          >
            <h3 className="font-medium text-gray-900 mb-2">Fjern kontakt</h3>
            <p className="text-sm text-gray-600 mb-1">
              {contacts.find((c) => c.id === activeContactMenu)?.name}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {contactHasSentInvitations(activeContactMenu)
                ? 'Denne kontakten har sendte invitasjoner og vil bli deaktivert.'
                : 'Denne kontakten vil bli fjernet.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setActiveContactMenu(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleDeactivateContact(activeContactMenu)}
                className={`px-3 py-1.5 text-sm text-white rounded ${
                  contactHasSentInvitations(activeContactMenu)
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {contactHasSentInvitations(activeContactMenu)
                  ? 'Deaktiver'
                  : 'Fjern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
