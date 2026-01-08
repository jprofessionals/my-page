'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'react-toastify'
import ktuService, {
  KtuAssignment,
  KtuInvitation,
  KtuConsultant,
  KtuCustomerOrganization,
  KtuCustomerContact,
} from '@/services/ktu.service'
import OrganizationAccordion from './OrganizationAccordion'

interface AssignmentGridProps {
  roundId: number
  assignments: KtuAssignment[]
  invitations: KtuInvitation[]
  consultants: KtuConsultant[]
  organizations: KtuCustomerOrganization[]
  contacts: KtuCustomerContact[]
  onDataChange: () => void
  disabled: boolean
  openOrgIds: Set<number>
  onOpenOrgIdsChange: (ids: Set<number>) => void
  manuallyAddedConsultants: Map<number, Set<number>>
  onManuallyAddedConsultantsChange: (map: Map<number, Set<number>>) => void
}

export default function AssignmentGrid({
  roundId,
  assignments,
  invitations,
  consultants,
  organizations,
  contacts,
  onDataChange,
  disabled,
  openOrgIds,
  onOpenOrgIdsChange,
  manuallyAddedConsultants,
  onManuallyAddedConsultantsChange,
}: AssignmentGridProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggleOrg = useCallback((orgId: number) => {
    const next = new Set(openOrgIds)
    if (next.has(orgId)) {
      next.delete(orgId)
    } else {
      next.add(orgId)
    }
    onOpenOrgIdsChange(next)
  }, [openOrgIds, onOpenOrgIdsChange])

  // Filter organizations that have at least one active contact
  const orgsWithContacts = useMemo(() => {
    return organizations
      .filter((org) => contacts.some((c) => c.organizationId === org.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
  }, [organizations, contacts])

  // Filter based on search
  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return orgsWithContacts

    const query = searchQuery.toLowerCase()
    return orgsWithContacts.filter((org) => {
      // Match org name
      if (org.name.toLowerCase().includes(query)) return true

      // Match any contact in the org
      const orgContacts = contacts.filter((c) => c.organizationId === org.id)
      return orgContacts.some(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query)
      )
    })
  }, [orgsWithContacts, contacts, searchQuery])

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalAssignments = assignments.length
    const sent = invitations.filter((i) =>
      ['SENT', 'OPENED', 'RESPONDED'].includes(i.status)
    ).length
    const responded = invitations.filter((i) => i.status === 'RESPONDED').length
    const pending = totalAssignments - sent

    return { totalAssignments, sent, responded, pending }
  }, [assignments, invitations])

  const handleAssignmentCreate = useCallback(
    async (consultantId: number, contactId: number) => {
      await ktuService.createAssignment(roundId, {
        consultantId,
        contactId,
      })
      toast.success('Kontaktperson koblet')
      onDataChange()
    },
    [roundId, onDataChange]
  )

  const handleAssignmentDelete = useCallback(
    async (assignmentId: number) => {
      await ktuService.deleteAssignment(roundId, assignmentId)
      toast.success('Kontaktperson frakoblet')
      onDataChange()
    },
    [roundId, onDataChange]
  )

  const handleContactCreate = useCallback(
    async (orgId: number, name: string, email: string) => {
      await ktuService.createContact({
        name,
        email: email || undefined,
        organizationId: orgId,
      })
      toast.success('Kontakt opprettet')
      onDataChange()
    },
    [onDataChange]
  )

  const handleContactUpdate = useCallback(
    async (contactId: number, data: { name?: string; email?: string; active?: boolean }) => {
      await ktuService.updateContact(contactId, data)
      if (data.active === false) {
        toast.success('Kontakt deaktivert')
      } else {
        toast.success('Kontakt oppdatert')
      }
      onDataChange()
    },
    [onDataChange]
  )

  return (
    <div className="space-y-4">
      {/* Header with search and stats */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sok etter organisasjon eller kontakt..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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

        {/* Stats summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="px-3 py-1 bg-gray-100 rounded-full">
            <span className="font-medium">{stats.totalAssignments}</span>
            <span className="text-gray-600 ml-1">tildelinger</span>
          </div>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            <span className="font-medium">{stats.pending}</span>
            <span className="ml-1">venter</span>
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            <span className="font-medium">{stats.sent}</span>
            <span className="ml-1">sendt</span>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <span className="font-medium">{stats.responded}</span>
            <span className="ml-1">besvart</span>
          </div>
        </div>
      </div>

      {/* Organizations list */}
      {filteredOrgs.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          {searchQuery ? (
            <>
              <p>Ingen organisasjoner matcher søket</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-blue-600 hover:underline"
              >
                Nullstill søk
              </button>
            </>
          ) : (
            <p>Ingen organisasjoner med kontakter</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrgs.map((org) => (
            <OrganizationAccordion
              key={org.id}
              roundId={roundId}
              organization={org}
              contacts={contacts}
              allConsultants={consultants}
              assignments={assignments}
              invitations={invitations}
              onAssignmentCreate={handleAssignmentCreate}
              onAssignmentDelete={handleAssignmentDelete}
              onContactCreate={handleContactCreate}
              onContactUpdate={handleContactUpdate}
              disabled={disabled}
              isOpen={openOrgIds.has(org.id)}
              onToggle={() => handleToggleOrg(org.id)}
              manuallyAddedIds={manuallyAddedConsultants.get(org.id) || new Set()}
              onManuallyAddedIdsChange={(ids) => {
                const next = new Map(manuallyAddedConsultants)
                next.set(org.id, ids)
                onManuallyAddedConsultantsChange(next)
              }}
            />
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Slik tildeler du kontaktpersoner:</p>
            <ul className="mt-1 list-disc list-inside space-y-1 text-blue-700">
              <li>Klikk på en organisasjon for å ekspandere</li>
              <li>Søk etter en konsulent og legg til som rad</li>
              <li>Kryss av for å koble konsulenten til en kontaktperson</li>
              <li>Koblinger med sendte invitasjoner kan ikke fjernes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
