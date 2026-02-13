'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ktuService, {
  KtuCustomerOrganization,
  CreateKtuOrganization,
  UpdateKtuOrganization,
} from '@/services/ktu.service'

export default function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<KtuCustomerOrganization[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [newOrg, setNewOrg] = useState<CreateKtuOrganization>({ name: '' })
  const [editOrg, setEditOrg] = useState<KtuCustomerOrganization | null>(null)

  useEffect(() => {
    loadOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive])

  const loadOrganizations = async () => {
    setLoading(true)
    try {
      const response = await ktuService.getOrganizations(!showInactive)
      setOrganizations(response.data || [])
    } catch (error) {
      console.error('Failed to load organizations:', error)
      toast.error('Feil ved lasting av organisasjoner')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async () => {
    if (!newOrg.name.trim()) {
      toast.warning('Vennligst fyll inn navn')
      return
    }

    setCreating(true)
    try {
      await ktuService.createOrganization(newOrg)
      toast.success('Organisasjon opprettet')
      setShowCreateModal(false)
      setNewOrg({ name: '' })
      loadOrganizations()
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast.error('Feil ved opprettelse av organisasjon')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateOrganization = async () => {
    if (!editOrg) return

    try {
      const updateData: UpdateKtuOrganization = {
        name: editOrg.name,
        organizationNumber: editOrg.organizationNumber,
        active: editOrg.active,
      }
      await ktuService.updateOrganization(editOrg.id, updateData)
      toast.success('Organisasjon oppdatert')
      setShowEditModal(false)
      setEditOrg(null)
      loadOrganizations()
    } catch (error) {
      console.error('Failed to update organization:', error)
      toast.error('Feil ved oppdatering av organisasjon')
    }
  }

  const openEditModal = (org: KtuCustomerOrganization) => {
    setEditOrg({ ...org })
    setShowEditModal(true)
  }

  if (loading) {
    return <div className="text-center py-8">Laster organisasjoner...</div>
  }

  return (
    <div>
      {/* Header with actions */}
      <div className="mb-6 flex justify-between items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Vis inaktive</span>
        </label>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Opprett ny organisasjon
        </button>
      </div>

      {/* Organizations list */}
      {organizations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Ingen organisasjoner funnet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Opprett din første organisasjon
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
                  Org.nr
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakter
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
              {organizations.map((org) => (
                <tr
                  key={org.id}
                  className={`hover:bg-gray-50 ${!org.active ? 'opacity-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {org.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.organizationNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.contactCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        org.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {org.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(org)}
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
            <h2 className="text-xl font-bold mb-4">Opprett ny organisasjon</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn *
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="f.eks. Skatteetaten"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisasjonsnummer (valgfritt)
                </label>
                <input
                  type="text"
                  value={newOrg.organizationNumber || ''}
                  onChange={(e) =>
                    setNewOrg({
                      ...newOrg,
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
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateOrganization}
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
      {showEditModal && editOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rediger organisasjon</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn *
                </label>
                <input
                  type="text"
                  value={editOrg.name}
                  onChange={(e) =>
                    setEditOrg({ ...editOrg, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisasjonsnummer
                </label>
                <input
                  type="text"
                  value={editOrg.organizationNumber || ''}
                  onChange={(e) =>
                    setEditOrg({
                      ...editOrg,
                      organizationNumber: e.target.value || undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editOrg.active}
                    onChange={(e) =>
                      setEditOrg({ ...editOrg, active: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Aktiv</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditOrg(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateOrganization}
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
