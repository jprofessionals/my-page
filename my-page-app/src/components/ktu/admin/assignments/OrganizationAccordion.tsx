'use client'

import { useMemo } from 'react'
import {
  KtuAssignment,
  KtuInvitation,
  KtuConsultant,
  KtuCustomerOrganization,
  KtuCustomerContact,
} from '@/services/ktu.service'
import AssignmentMatrix from './AssignmentMatrix'

interface OrganizationAccordionProps {
  roundId: number
  organization: KtuCustomerOrganization
  contacts: KtuCustomerContact[]
  allConsultants: KtuConsultant[]
  assignments: KtuAssignment[]
  invitations: KtuInvitation[]
  onAssignmentCreate: (consultantId: number, contactId: number) => Promise<void>
  onAssignmentDelete: (assignmentId: number) => Promise<void>
  onContactCreate: (orgId: number, name: string, email: string) => Promise<void>
  onContactUpdate: (
    contactId: number,
    data: { name?: string; email?: string; active?: boolean },
  ) => Promise<void>
  disabled: boolean
  isOpen: boolean
  onToggle: () => void
  manuallyAddedIds: Set<number>
  onManuallyAddedIdsChange: (ids: Set<number>) => void
}

export default function OrganizationAccordion({
  roundId,
  organization,
  contacts,
  allConsultants,
  assignments,
  invitations,
  onAssignmentCreate,
  onAssignmentDelete,
  onContactCreate,
  onContactUpdate,
  disabled,
  isOpen,
  onToggle,
  manuallyAddedIds,
  onManuallyAddedIdsChange,
}: OrganizationAccordionProps) {
  // Filter contacts for this organization
  const orgContacts = useMemo(
    () => contacts.filter((c) => c.organizationId === organization.id),
    [contacts, organization.id],
  )

  // Filter assignments for this organization's contacts
  const orgAssignments = useMemo(
    () =>
      assignments.filter((a) => a.contact.organizationId === organization.id),
    [assignments, organization.id],
  )

  // Count statistics
  const stats = useMemo(() => {
    const total = orgAssignments.length
    const sentOrResponded = orgAssignments.filter((a) => {
      const inv = invitations.find((i) => i.assignmentId === a.id)
      return inv && ['SENT', 'OPENED', 'RESPONDED'].includes(inv.status)
    }).length
    const responded = orgAssignments.filter((a) => {
      const inv = invitations.find((i) => i.assignmentId === a.id)
      return inv && inv.status === 'RESPONDED'
    }).length

    return { total, sentOrResponded, responded }
  }, [orgAssignments, invitations])

  if (orgContacts.length === 0) {
    return null // Don't show organizations without contacts
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header - clickable */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
      >
        <div className="flex items-center gap-3">
          {/* Chevron */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>

          {/* Organization name */}
          <span className="font-medium text-gray-900">{organization.name}</span>

          {/* Contact count badge */}
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
            {orgContacts.length}{' '}
            {orgContacts.length === 1 ? 'kontakt' : 'kontakter'}
          </span>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 text-sm">
          {stats.total > 0 && (
            <>
              <span className="text-gray-600">
                <span className="font-medium">{stats.total}</span> tildelinger
              </span>
              {stats.sentOrResponded > 0 && (
                <span className="text-blue-600">
                  <span className="font-medium">{stats.sentOrResponded}</span>{' '}
                  sendt
                </span>
              )}
              {stats.responded > 0 && (
                <span className="text-green-600">
                  <span className="font-medium">{stats.responded}</span> besvart
                </span>
              )}
            </>
          )}
          {stats.total === 0 && (
            <span className="text-gray-400 italic">Ingen tildelinger</span>
          )}
        </div>
      </button>

      {/* Content - collapsible */}
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          <AssignmentMatrix
            roundId={roundId}
            orgId={organization.id}
            contacts={orgContacts}
            allConsultants={allConsultants}
            assignments={orgAssignments}
            invitations={invitations}
            onAssignmentCreate={onAssignmentCreate}
            onAssignmentDelete={onAssignmentDelete}
            onContactCreate={(name, email) =>
              onContactCreate(organization.id, name, email)
            }
            onContactUpdate={onContactUpdate}
            disabled={disabled}
            manuallyAddedIds={manuallyAddedIds}
            onManuallyAddedIdsChange={onManuallyAddedIdsChange}
          />
        </div>
      )}
    </div>
  )
}
