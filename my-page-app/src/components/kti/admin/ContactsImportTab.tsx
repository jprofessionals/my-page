'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import {
  previewContactsCsv,
  importContacts,
  getKtiUsers,
  createConsultantAlias,
} from '@/data/types'
import type {
  KtiContactsCsvPreview,
  KtiContactsImportResult,
  KtiImportField,
  KtiImportError,
  UnmatchedConsultant,
  SuggestedMatch,
  KtiUser,
} from '@/data/types'
import '@/services/openapi-client'

type Step = 'upload' | 'mapping' | 'result'
type ColumnMapping = Record<string, number | null>

export default function ContactsImportTab() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<KtiContactsCsvPreview | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<KtiContactsImportResult | null>(null)
  const [creatingAlias, setCreatingAlias] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<KtiUser[]>([])

  const loadUsers = async () => {
    try {
      const response = await getKtiUsers()
      if (response.data) setAllUsers(response.data)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleCreateAlias = async (aliasName: string, userId: number) => {
    setCreatingAlias(aliasName)
    try {
      const response = await createConsultantAlias({ body: { aliasName, userId } })
      if (response.data) {
        toast.success(`Alias opprettet: "${aliasName}"`)
        if (file) {
          await handleValidate()
        }
      }
    } catch (error) {
      console.error('Failed to create alias:', error)
      toast.error('Feil ved opprettelse av alias')
    } finally {
      setCreatingAlias(null)
    }
  }

  const handleIgnoreConsultant = async (aliasName: string) => {
    setCreatingAlias(aliasName)
    try {
      // Create an alias without userId = ignore this consultant (former employee)
      const response = await createConsultantAlias({ body: { aliasName } })
      if (response.data) {
        toast.success(`"${aliasName}" vil bli ignorert (tidligere ansatt)`)
        if (file) {
          await handleValidate()
        }
      }
    } catch (error) {
      console.error('Failed to create ignore alias:', error)
      toast.error('Feil ved opprettelse av ignorer-alias')
    } finally {
      setCreatingAlias(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(null)
      setResult(null)
      setColumnMapping({})
      setStep('upload')
    }
  }

  const handlePreview = async () => {
    if (!file) {
      toast.warning('Vennligst velg en fil først')
      return
    }

    setImporting(true)
    try {
      await loadUsers()
      const response = await previewContactsCsv({ body: { file } })
      if (response.data) {
        setPreview(response.data)
        const initialMapping: ColumnMapping = {}
        response.data.requiredFields?.forEach((field) => {
          initialMapping[field.key] = null
        })
        setColumnMapping(initialMapping)
        setStep('mapping')
        toast.success('CSV-fil lastet - velg kolonne-mapping')
      }
    } catch (error) {
      console.error('Preview failed:', error)
      toast.error('Feil ved lesing av fil')
    } finally {
      setImporting(false)
    }
  }

  const handleMappingChange = (fieldKey: string, columnIndex: number | null) => {
    setColumnMapping((prev) => ({
      ...prev,
      [fieldKey]: columnIndex,
    }))
  }

  const getRequiredFieldsMissing = (): string[] => {
    if (!preview?.requiredFields) return []
    return preview.requiredFields
      .filter((field) => field.required && columnMapping[field.key] === null)
      .map((field) => field.label)
  }

  const handleValidate = async () => {
    const missingFields = getRequiredFieldsMissing()
    if (missingFields.length > 0) {
      toast.warning(`Mangler mapping for: ${missingFields.join(', ')}`)
      return
    }

    if (!file) {
      toast.warning('Vennligst velg en fil først')
      return
    }

    setImporting(true)
    try {
      const response = await importContacts({
        query: { dryRun: true },
        body: { file, columnMapping: JSON.stringify(columnMapping) },
      })
      setResult(response.data || null)
      setStep('result')
      if (response.data?.valid) {
        toast.success('Validering fullført - klar for import')
      } else {
        toast.warning('Feil funnet i CSV-filen')
      }
    } catch (error) {
      console.error('Validation failed:', error)
      toast.error('Feil ved validering av fil')
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!file || !result?.valid) return

    if (!confirm('Er du sikker på at du vil importere kontaktene?')) return

    setImporting(true)
    try {
      const response = await importContacts({
        query: { dryRun: false },
        body: { file, columnMapping: JSON.stringify(columnMapping) },
      })
      setResult(response.data || null)
      if (response.data && !response.data.dryRun) {
        toast.success(
          `Import fullført! ${response.data.createdContacts ?? 0} kontakter opprettet, ${response.data.createdOrganizations ?? 0} organisasjoner.`
        )
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Feil ved import')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setColumnMapping({})
    setResult(null)
    setStep('upload')
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Importere kontaktpersoner</h3>
        <p className="text-sm text-blue-800 mb-2">
          Last opp en CSV-fil med kontaktpersoner og deres tilknytning til konsulenter/kunder.
        </p>
        <p className="text-sm text-blue-700">
          Forventede kolonner: Konsulent, Kunde, Kontaktperson, E-post
        </p>
      </div>

      {/* Step 1: File upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 mb-4">1. Last opp CSV-fil</h3>
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Valgt fil: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}

          {step === 'upload' && (
            <button
              onClick={handlePreview}
              disabled={!file || importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Leser fil...' : 'Les fil og vis preview'}
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Column mapping */}
      {preview && step !== 'upload' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">2. Kolonne-mapping</h3>
            <span className="text-sm text-gray-500">
              {preview.totalRows} rader (separator: {preview.delimiter})
            </span>
          </div>

          <div className="mb-6 overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border text-left text-gray-600">#</th>
                  {preview.columns.map((col, idx) => (
                    <th key={idx} className="px-2 py-1 border text-left text-gray-600">
                      <div className="font-medium">{col || `(kolonne ${idx})`}</div>
                      <div className="text-gray-400 font-normal">Index: {idx}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 border text-gray-400">{rowIdx + 1}</td>
                    {preview.columns.map((_, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-2 py-1 border text-gray-700 max-w-xs truncate"
                      >
                        {row[colIdx] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {preview.requiredFields?.map((field: KtiImportField) => (
              <div key={field.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={columnMapping[field.key] ?? ''}
                  onChange={(e) =>
                    handleMappingChange(
                      field.key,
                      e.target.value === '' ? null : parseInt(e.target.value)
                    )
                  }
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${
                    field.required && columnMapping[field.key] === null
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">
                    {field.required ? '-- Velg kolonne --' : '-- Finnes ikke --'}
                  </option>
                  {preview.columns.map((col, idx) => (
                    <option key={idx} value={idx}>
                      {idx}: {col || '(tom)'}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleValidate}
              disabled={importing || getRequiredFieldsMissing().length > 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {importing ? 'Validerer...' : 'Valider data'}
            </button>
            <button onClick={handleReset} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Start på nytt
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {result && step === 'result' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-900 mb-4">
            {result.dryRun ? '3. Valideringsresultat' : '3. Importresultat'}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{result.totalRows}</div>
              <div className="text-sm text-gray-600">Totalt rader</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{result.validRows}</div>
              <div className="text-sm text-green-600">Gyldige</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-700">
                {result.createdOrganizations ?? 0}
              </div>
              <div className="text-sm text-blue-600">Organisasjoner</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-700">
                {result.createdContacts ?? 0}
              </div>
              <div className="text-sm text-purple-600">Kontakter</div>
            </div>
          </div>

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-red-700 mb-2">Feil ({result.errors.length})</h4>
              <div className="max-h-40 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-red-800">Rad</th>
                      <th className="px-3 py-2 text-left text-red-800">Felt</th>
                      <th className="px-3 py-2 text-left text-red-800">Feil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((error: KtiImportError, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{error.row}</td>
                        <td className="px-3 py-2">{error.field}</td>
                        <td className="px-3 py-2 text-red-700">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unmatched Consultants */}
          {result.unmatchedConsultants && result.unmatchedConsultants.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-orange-700 mb-2">
                Konsulenter som ikke ble funnet ({result.unmatchedConsultants.length})
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Velg en bruker fra forslagene for å opprette et alias, velg manuelt fra listen, eller
                klikk &quot;Ignorer&quot; for tidligere ansatte som ikke lenger er i systemet.
              </p>
              <div className="space-y-3">
                {result.unmatchedConsultants.map((unmatched: UnmatchedConsultant) => (
                  <div key={unmatched.name} className="bg-orange-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{unmatched.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({unmatched.rowCount} rad{unmatched.rowCount !== 1 ? 'er' : ''})
                        </span>
                      </div>
                      <button
                        onClick={() => handleIgnoreConsultant(unmatched.name)}
                        disabled={creatingAlias === unmatched.name}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50"
                        title="Marker som tidligere ansatt - rader med dette navnet vil bli ignorert"
                      >
                        Ignorer (sluttet)
                      </button>
                    </div>
                    {unmatched.suggestions && unmatched.suggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600">Forslag:</span>
                        {unmatched.suggestions.map((suggestion: SuggestedMatch) => (
                          <button
                            key={suggestion.userId}
                            onClick={() => handleCreateAlias(unmatched.name, suggestion.userId)}
                            disabled={creatingAlias === unmatched.name}
                            className="px-3 py-1 text-sm bg-white border border-orange-300 rounded-full hover:bg-orange-100 disabled:opacity-50"
                          >
                            {suggestion.userName}
                            <span className="text-xs text-gray-400 ml-1">
                              ({Math.round(suggestion.similarity * 100)}%)
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleCreateAlias(unmatched.name, parseInt(e.target.value))
                          }
                        }}
                        disabled={creatingAlias === unmatched.name}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        defaultValue=""
                      >
                        <option value="">Velg bruker manuelt...</option>
                        {allUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {result.valid ? 'Klar for import' : 'Feil må løses'}
            </span>

            <div className="flex gap-3">
              <button onClick={handleReset} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Start på nytt
              </button>
              {result.dryRun && result.valid && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? 'Importerer...' : 'Importer kontakter'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
