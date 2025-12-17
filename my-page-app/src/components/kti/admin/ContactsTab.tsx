'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktiService, {
  KtiCustomerContact,
  KtiCustomerOrganization,
  CreateKtiContact,
  UpdateKtiContact,
} from '@/services/kti.service'

export default function ContactsTab() {
  const [contacts, setContacts] = useState<KtiCustomerContact[]>([])
  const [organizations, setOrganizations] = useState<KtiCustomerOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [filterOrgId, setFilterOrgId] = useState<number | undefined>(undefined)
  const [newContact, setNewContact] = useState<CreateKtiContact>({ name: '', organizationId: 0 })
  const [editContact, setEditContact] = useState<KtiCustomerContact | null>(null)

  useEffect(() => {
    loadOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive, filterOrgId])

  const loadOrganizations = async () => {
    try {
      const response = await ktiService.getOrganizations(false)
      setOrganizations(response.data || [])
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const loadContacts = async () => {
    setLoading(true)
    try {
      const response = await ktiService.getContacts(filterOrgId, !showInactive)
      setContacts(response.data || [])
    } catch (error) {
      console.error('Failed to load contacts:', error)
      toast.error('Feil ved lasting av kontakter')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }
    if (!newContact.organizationId) {
      toast.warning('Vennligst velg organisasjon')
      return
    }

    setCreating(true)
    try {
      await ktiService.createContact(newContact)
      toast.success('Kontakt opprettet')
      setShowCreateModal(false)
      setNewContact({ name: '', organizationId: 0 })
      loadContacts()
    } catch (error) {
      console.error('Failed to create contact:', error)
      toast.error('Feil ved opprettelse av kontakt')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateContact = async () => {
    if (!editContact) return

    try {
      const updateData: UpdateKtiContact = {
        name: editContact.name,
        email: editContact.email,
        phone: editContact.phone,
        title: editContact.title,
        organizationId: editContact.organizationId,
        active: editContact.active,
        optedOut: editContact.optedOut,
      }
      await ktiService.updateContact(editContact.id, updateData)
      toast.success('Kontakt oppdatert')
      setShowEditModal(false)
      setEditContact(null)
      loadContacts()
    } catch (error) {
      console.error('Failed to update contact:', error)
      toast.error('Feil ved oppdatering av kontakt')
    }
  }

  const openEditModal = (contact: KtiCustomerContact) => {
    setEditContact({ ...contact })
    setShowEditModal(true)
  }

  if (loading && contacts.length === 0) {
    return <div className="text-center py-8">Laster kontakter...</div>
  }

  return (
    <div>
      {/* Header with filters and actions */}
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4 items-center">
          <select
            value={filterOrgId || ''}
            onChange={(e) => setFilterOrgId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Alle organisasjoner</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Vis inaktive</span>
          </label>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Opprett ny kontakt
        </button>
      </div>

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Ingen kontakter funnet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Opprett din første kontakt
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Navn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organisasjon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`hover:bg-gray-50 ${!contact.active || contact.optedOut ? 'opacity-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                    {contact.title && <div className="text-xs text-gray-500">{contact.title}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.organizationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {contact.optedOut && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Opt-out
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contact.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {contact.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Rediger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Opprett ny kontakt</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. Ola Nordmann"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisasjon *</label>
                <select
                  value={newContact.organizationId || ''}
                  onChange={(e) =>
                    setNewContact({ ...newContact, organizationId: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Velg organisasjon</option>
                  {organizations
                    .filter((org) => org.active)
                    .map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ola@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={newContact.phone || ''}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="+47 123 45 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tittel/stilling</label>
                <input
                  type="text"
                  value={newContact.title || ''}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. Prosjektleder"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateContact}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Oppretter...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Rediger kontakt</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
                <input
                  type="text"
                  value={editContact.name}
                  onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisasjon *</label>
                <select
                  value={editContact.organizationId}
                  onChange={(e) =>
                    setEditContact({ ...editContact, organizationId: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={editContact.email || ''}
                  onChange={(e) =>
                    setEditContact({ ...editContact, email: e.target.value || undefined })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={editContact.phone || ''}
                  onChange={(e) =>
                    setEditContact({ ...editContact, phone: e.target.value || undefined })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tittel/stilling</label>
                <input
                  type="text"
                  value={editContact.title || ''}
                  onChange={(e) =>
                    setEditContact({ ...editContact, title: e.target.value || undefined })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editContact.active}
                    onChange={(e) => setEditContact({ ...editContact, active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Aktiv</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editContact.optedOut}
                    onChange={(e) => setEditContact({ ...editContact, optedOut: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Har bedt om å ikke motta undersøkelser (opt-out)</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditContact(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
