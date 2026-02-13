'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktuService, {
  KtuCustomerOrganization,
  KtuCustomerContact,
  CreateKtuOrganization,
  UpdateKtuOrganization,
  CreateKtuContact,
  UpdateKtuContact,
  KtuRound,
  KtuUser,
} from '@/services/ktu.service'
import ContactsImportModal from './ContactsImportModal'

export default function CustomersTab() {
  const [customers, setCustomers] = useState<KtuCustomerOrganization[]>([])
  const [contacts, setContacts] = useState<KtuCustomerContact[]>([])
  const [selectedCustomer, setSelectedCustomer] =
    useState<KtuCustomerOrganization | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [showInactiveContacts, setShowInactiveContacts] = useState(false)

  // Modals
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [showCreateContactModal, setShowCreateContactModal] = useState(false)
  const [showEditContactModal, setShowEditContactModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)

  // Link modal state
  const [linkContact, setLinkContact] = useState<KtuCustomerContact | null>(
    null,
  )
  const [rounds, setRounds] = useState<KtuRound[]>([])
  const [consultants, setConsultants] = useState<KtuUser[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)
  const [selectedConsultantId, setSelectedConsultantId] = useState<
    number | null
  >(null)

  // Form state
  const [newCustomer, setNewCustomer] = useState<CreateKtuOrganization>({
    name: '',
  })
  const [editCustomer, setEditCustomer] =
    useState<KtuCustomerOrganization | null>(null)
  const [newContact, setNewContact] = useState<CreateKtuContact>({
    name: '',
    organizationId: 0,
  })
  const [editContact, setEditContact] = useState<KtuCustomerContact | null>(
    null,
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [showInactive])

  useEffect(() => {
    if (selectedCustomer) {
      loadContacts(selectedCustomer.id)
    }
  }, [selectedCustomer, showInactiveContacts])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const response = await ktuService.getOrganizations(!showInactive)
      setCustomers(response.data || [])
    } catch (error) {
      console.error('Failed to load customers:', error)
      toast.error('Feil ved lasting av kunder')
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async (customerId: number) => {
    setLoadingContacts(true)
    try {
      const response = await ktuService.getContacts(
        customerId,
        !showInactiveContacts,
      )
      setContacts(response.data || [])
    } catch (error) {
      console.error('Failed to load contacts:', error)
      toast.error('Feil ved lasting av kontaktpersoner')
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }
    setSaving(true)
    try {
      await ktuService.createOrganization(newCustomer)
      toast.success('Kunde opprettet')
      setShowCreateCustomerModal(false)
      setNewCustomer({ name: '' })
      loadCustomers()
    } catch (error) {
      console.error('Failed to create customer:', error)
      toast.error('Feil ved opprettelse av kunde')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCustomer = async () => {
    if (!editCustomer) return
    setSaving(true)
    try {
      const updateData: UpdateKtuOrganization = {
        name: editCustomer.name,
        organizationNumber: editCustomer.organizationNumber,
        active: editCustomer.active,
      }
      await ktuService.updateOrganization(editCustomer.id, updateData)
      toast.success('Kunde oppdatert')
      setShowEditCustomerModal(false)
      setEditCustomer(null)
      loadCustomers()
      if (selectedCustomer?.id === editCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, ...updateData })
      }
    } catch (error) {
      console.error('Failed to update customer:', error)
      toast.error('Feil ved oppdatering av kunde')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }
    setSaving(true)
    try {
      await ktuService.createContact(newContact)
      toast.success('Kontaktperson opprettet')
      setShowCreateContactModal(false)
      setNewContact({ name: '', organizationId: selectedCustomer?.id || 0 })
      if (selectedCustomer) {
        loadContacts(selectedCustomer.id)
        loadCustomers() // Update contact count
      }
    } catch (error) {
      console.error('Failed to create contact:', error)
      toast.error('Feil ved opprettelse av kontaktperson')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateContact = async () => {
    if (!editContact) return
    setSaving(true)
    try {
      const updateData: UpdateKtuContact = {
        name: editContact.name,
        email: editContact.email,
        phone: editContact.phone,
        title: editContact.title,
        organizationId: editContact.organizationId,
        active: editContact.active,
        optedOut: editContact.optedOut,
      }
      await ktuService.updateContact(editContact.id, updateData)
      toast.success('Kontaktperson oppdatert')
      setShowEditContactModal(false)
      setEditContact(null)
      if (selectedCustomer) {
        loadContacts(selectedCustomer.id)
      }
    } catch (error) {
      console.error('Failed to update contact:', error)
      toast.error('Feil ved oppdatering av kontaktperson')
    } finally {
      setSaving(false)
    }
  }

  const openEditCustomer = (customer: KtuCustomerOrganization) => {
    setEditCustomer({ ...customer })
    setShowEditCustomerModal(true)
  }

  const openEditContact = (contact: KtuCustomerContact) => {
    setEditContact({ ...contact })
    setShowEditContactModal(true)
  }

  const handleDeactivateCustomer = async (
    customer: KtuCustomerOrganization,
  ) => {
    if (
      !confirm(
        `Er du sikker på at du vil deaktivere "${customer.name}"? Kunden vil ikke bli brukt i nye undersøkelser.`,
      )
    )
      return
    setSaving(true)
    try {
      await ktuService.updateOrganization(customer.id, {
        name: customer.name,
        organizationNumber: customer.organizationNumber,
        active: false,
      })
      toast.success('Kunde deaktivert')
      loadCustomers()
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null)
        setContacts([])
      }
    } catch (error) {
      console.error('Failed to deactivate customer:', error)
      toast.error('Feil ved deaktivering av kunde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateContact = async (contact: KtuCustomerContact) => {
    if (
      !confirm(
        `Er du sikker på at du vil deaktivere "${contact.name}"? Kontaktpersonen vil ikke bli brukt i nye undersøkelser.`,
      )
    )
      return
    setSaving(true)
    try {
      await ktuService.updateContact(contact.id, {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        organizationId: contact.organizationId,
        active: false,
        optedOut: contact.optedOut,
      })
      toast.success('Kontaktperson deaktivert')
      if (selectedCustomer) {
        loadContacts(selectedCustomer.id)
        loadCustomers() // Update contact count
      }
    } catch (error) {
      console.error('Failed to deactivate contact:', error)
      toast.error('Feil ved deaktivering av kontaktperson')
    } finally {
      setSaving(false)
    }
  }

  const openCreateContact = () => {
    setNewContact({ name: '', organizationId: selectedCustomer?.id || 0 })
    setShowCreateContactModal(true)
  }

  const openLinkModal = async (contact: KtuCustomerContact) => {
    setLinkContact(contact)
    setSelectedRoundId(null)
    setSelectedConsultantId(null)
    setShowLinkModal(true)

    // Load rounds and consultants
    try {
      const [roundsRes, usersRes] = await Promise.all([
        ktuService.getRounds(),
        ktuService.getKtuUsers(),
      ])
      setRounds(roundsRes.data || [])
      setConsultants(usersRes.data || [])
    } catch (error) {
      console.error('Failed to load data for link modal:', error)
      toast.error('Feil ved lasting av data')
    }
  }

  const handleCreateLink = async () => {
    if (!linkContact || !selectedRoundId || !selectedConsultantId) {
      toast.warning('Velg både undersøkelse og konsulent')
      return
    }
    setSaving(true)
    try {
      await ktuService.createAssignment(selectedRoundId, {
        consultantId: selectedConsultantId,
        contactId: linkContact.id,
      })
      toast.success('Kobling opprettet')
      setShowLinkModal(false)
      setLinkContact(null)
    } catch (error) {
      console.error('Failed to create link:', error)
      toast.error('Feil ved opprettelse av kobling')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Laster kunder...</div>
  }

  return (
    <div className="flex gap-6">
      {/* Left: Customers list */}
      <div className="w-1/3 min-w-[300px]">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Kunder</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
                >
                  Import
                </button>
                <button
                  onClick={() => setShowCreateCustomerModal(true)}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Ny
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-600">Vis inaktive</span>
            </label>
          </div>

          {/* Customer list */}
          <div className="max-h-[600px] overflow-y-auto">
            {customers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Ingen kunder funnet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <li
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : ''
                    } ${!customer.active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.contactCount || 0} kontaktperson
                          {customer.contactCount !== 1 ? 'er' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditCustomer(customer)
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Rediger"
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
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        {customer.active && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeactivateCustomer(customer)
                            }}
                            className="text-gray-400 hover:text-red-600"
                            title="Deaktiver"
                            disabled={saving}
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Right: Contact persons */}
      <div className="flex-1">
        {selectedCustomer ? (
          <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.organizationNumber &&
                      `Org.nr: ${selectedCustomer.organizationNumber}`}
                  </p>
                </div>
                <button
                  onClick={openCreateContact}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Ny kontaktperson
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInactiveContacts}
                  onChange={(e) => setShowInactiveContacts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-600">
                  Vis inaktive kontaktpersoner
                </span>
              </label>
            </div>

            {/* Contacts list */}
            <div className="p-4">
              {loadingContacts ? (
                <div className="text-center py-4 text-gray-500">
                  Laster kontaktpersoner...
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Ingen kontaktpersoner registrert</p>
                  <button
                    onClick={openCreateContact}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Legg til kontaktperson
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-4 border rounded-lg ${
                        !contact.active || contact.optedOut
                          ? 'bg-gray-50 opacity-60'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {contact.name}
                          </div>
                          {contact.title && (
                            <div className="text-sm text-gray-500">
                              {contact.title}
                            </div>
                          )}
                          <div className="mt-1 text-sm space-y-0.5">
                            {contact.email && (
                              <div className="text-gray-600">
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="text-gray-600">
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 flex-wrap justify-end">
                            {contact.optedOut && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Opt-out
                              </span>
                            )}
                            {!contact.active && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                Inaktiv
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openLinkModal(contact)}
                              className="text-gray-400 hover:text-green-600"
                              title="Knytt til undersøkelse"
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
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openEditContact(contact)}
                              className="text-gray-400 hover:text-blue-600"
                              title="Rediger"
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
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            {contact.active && (
                              <button
                                onClick={() => handleDeactivateContact(contact)}
                                className="text-gray-400 hover:text-red-600"
                                title="Deaktiver"
                                disabled={saving}
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p>Velg en kunde fra listen for å se kontaktpersoner</p>
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ny kunde</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. Skatteetaten"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Org.nr (valgfritt)
                </label>
                <input
                  type="text"
                  value={newCustomer.organizationNumber || ''}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      organizationNumber: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. 974761076"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateCustomerModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Lagrer...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && editCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rediger kunde</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn *
                </label>
                <input
                  type="text"
                  value={editCustomer.name}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Org.nr
                </label>
                <input
                  type="text"
                  value={editCustomer.organizationNumber || ''}
                  onChange={(e) =>
                    setEditCustomer({
                      ...editCustomer,
                      organizationNumber: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editCustomer.active}
                  onChange={(e) =>
                    setEditCustomer({
                      ...editCustomer,
                      active: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Aktiv</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditCustomerModal(false)
                  setEditCustomer(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateCustomer}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Lagrer...' : 'Lagre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreateContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ny kontaktperson</h2>
            <p className="text-sm text-gray-500 mb-4">
              For {selectedCustomer?.name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn *
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ola Nordmann"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-post
                </label>
                <input
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      email: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ola@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={newContact.phone || ''}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      phone: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="+47 123 45 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tittel/stilling
                </label>
                <input
                  type="text"
                  value={newContact.title || ''}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      title: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Prosjektleder"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateContactModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateContact}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Lagrer...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditContactModal && editContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Rediger kontaktperson</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn *
                </label>
                <input
                  type="text"
                  value={editContact.name}
                  onChange={(e) =>
                    setEditContact({ ...editContact, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-post
                </label>
                <input
                  type="email"
                  value={editContact.email || ''}
                  onChange={(e) =>
                    setEditContact({
                      ...editContact,
                      email: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={editContact.phone || ''}
                  onChange={(e) =>
                    setEditContact({
                      ...editContact,
                      phone: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tittel/stilling
                </label>
                <input
                  type="text"
                  value={editContact.title || ''}
                  onChange={(e) =>
                    setEditContact({
                      ...editContact,
                      title: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editContact.active}
                    onChange={(e) =>
                      setEditContact({
                        ...editContact,
                        active: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Aktiv</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editContact.optedOut}
                    onChange={(e) =>
                      setEditContact({
                        ...editContact,
                        optedOut: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Har bedt om ikke motta undersøkelser (opt-out)
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditContactModal(false)
                  setEditContact(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateContact}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Lagrer...' : 'Lagre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ContactsImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            loadCustomers()
            if (selectedCustomer) {
              loadContacts(selectedCustomer.id)
            }
          }}
        />
      )}

      {/* Link Contact Modal */}
      {showLinkModal && linkContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Knytt kontakt til undersøkelse
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Kobler <strong>{linkContact.name}</strong> til en konsulent for en
              undersøkelse
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Undersøkelse (år) *
                </label>
                <select
                  value={selectedRoundId ?? ''}
                  onChange={(e) =>
                    setSelectedRoundId(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Velg undersøkelse --</option>
                  {rounds
                    .sort((a, b) => b.year - a.year)
                    .map((round) => (
                      <option key={round.id} value={round.id}>
                        {round.name} ({round.year})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konsulent *
                </label>
                <select
                  value={selectedConsultantId ?? ''}
                  onChange={(e) =>
                    setSelectedConsultantId(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Velg konsulent --</option>
                  {consultants
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setLinkContact(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateLink}
                disabled={saving || !selectedRoundId || !selectedConsultantId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Lagrer...' : 'Opprett kobling'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
