'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import {
  previewContactsCsv,
  importContacts,
  getKtuUsers,
  createConsultantAlias,
} from '@/data/types'
import type {
  KtuContactsCsvPreview,
  KtuContactsImportResult,
  KtuImportField,
  UnmatchedConsultant,
  SuggestedMatch,
  KtuUser,
} from '@/data/types'
import '@/services/openapi-client'

type Step = 'upload' | 'mapping' | 'result'
type ColumnMapping = Record<string, number | null>

interface Props {
  onClose: () => void
  onImportComplete: () => void
}

export default function ContactsImportModal({ onClose, onImportComplete }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<KtuContactsCsvPreview | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<KtuContactsImportResult | null>(null)
  const [creatingAlias, setCreatingAlias] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)
  // allUsers loaded for potential future use (manual alias assignment dropdown)
  const [, setAllUsers] = useState<KtuUser[]>([])

  const loadUsers = async () => {
    try {
      const response = await getKtuUsers()
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
        if (file) await handleValidate()
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
      const response = await createConsultantAlias({ body: { aliasName } })
      if (response.data) {
        toast.success(`"${aliasName}" vil bli ignorert`)
        if (file) await handleValidate()
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
    if (!file) return
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
      }
    } catch (error) {
      console.error('Preview failed:', error)
      toast.error('Feil ved lesing av fil')
    } finally {
      setImporting(false)
    }
  }

  const handleMappingChange = (fieldKey: string, columnIndex: number | null) => {
    setColumnMapping((prev) => ({ ...prev, [fieldKey]: columnIndex }))
  }

  const getRequiredFieldsMissing = (): string[] => {
    if (!preview?.requiredFields) return []
    return preview.requiredFields
      .filter((field) => field.required && columnMapping[field.key] === null)
      .map((field) => field.label)
  }

  const handleValidate = async () => {
    if (!file || getRequiredFieldsMissing().length > 0) return
    setImporting(true)
    try {
      const response = await importContacts({
        query: { dryRun: true, year: year ?? undefined },
        body: { file, columnMapping: JSON.stringify(columnMapping) },
      })
      setResult(response.data || null)
      setStep('result')
    } catch (error) {
      console.error('Validation failed:', error)
      toast.error('Feil ved validering')
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!file || !result?.valid) return
    if (!confirm('Er du sikker på at du vil importere kontaktpersonene?')) return
    setImporting(true)
    try {
      const response = await importContacts({
        query: { dryRun: false, year: year ?? undefined },
        body: { file, columnMapping: JSON.stringify(columnMapping) },
      })
      setResult(response.data || null)
      if (response.data && !response.data.dryRun) {
        toast.success(`Import fullført! ${response.data.createdContacts ?? 0} kontaktpersoner opprettet.`)
        onImportComplete()
        onClose()
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Feil ved import')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Import kontaktpersoner</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Last opp en CSV-fil med kontaktpersoner. Forventede kolonner: Konsulent, Kunde, Kontaktperson, E-post.
              </p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && <p className="text-sm text-gray-600">Valgt: {file.name}</p>}
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && preview && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {preview.totalRows} rader funnet (separator: {preview.delimiter})
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      {preview.columns.map((col, idx) => (
                        <th key={idx} className="px-2 py-1 border-r text-left">{col || `(${idx})`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.slice(0, 2).map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {preview.columns.map((_, colIdx) => (
                          <td key={colIdx} className="px-2 py-1 border-r truncate max-w-[150px]">{row[colIdx] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mapping */}
              <div className="grid grid-cols-2 gap-4">
                {preview.requiredFields?.map((field: KtuImportField) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={columnMapping[field.key] ?? ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value === '' ? null : parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="">{field.required ? '-- Velg --' : '-- Ingen --'}</option>
                      {preview.columns.map((col, idx) => (
                        <option key={idx} value={idx}>{idx}: {col || '(tom)'}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Year input */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  År for undersøkelse (valgfritt)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Hvis du angir et år, vil kontaktpersonene bli koblet til konsulentene for den undersøkelsen.
                </p>
                <input
                  type="number"
                  value={year ?? ''}
                  onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-32 border rounded px-3 py-2 text-sm"
                  placeholder="f.eks. 2024"
                  min="2020"
                  max="2030"
                />
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-2xl font-bold">{result.totalRows}</div>
                  <div className="text-sm text-gray-600">Totalt</div>
                </div>
                <div className="bg-green-50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{result.validRows}</div>
                  <div className="text-sm text-green-600">Gyldige</div>
                </div>
                <div className="bg-blue-50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{result.createdOrganizations ?? 0}</div>
                  <div className="text-sm text-blue-600">Nye kunder</div>
                </div>
                <div className="bg-purple-50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{result.createdContacts ?? 0}</div>
                  <div className="text-sm text-purple-600">Nye kontakter</div>
                </div>
                <div className="bg-indigo-50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-700">{result.createdAssignments ?? 0}</div>
                  <div className="text-sm text-indigo-600">Nye koblinger</div>
                </div>
              </div>

              {/* Unmatched consultants */}
              {result.unmatchedConsultants && result.unmatchedConsultants.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">
                    Konsulenter ikke funnet ({result.unmatchedConsultants.length})
                  </h4>
                  <div className="space-y-2">
                    {result.unmatchedConsultants.map((unmatched: UnmatchedConsultant) => (
                      <div key={unmatched.name} className="flex items-center justify-between bg-white rounded p-2">
                        <span>{unmatched.name} <span className="text-gray-500 text-sm">({unmatched.rowCount} rader)</span></span>
                        <div className="flex gap-2">
                          {unmatched.suggestions?.slice(0, 2).map((s: SuggestedMatch) => (
                            <button
                              key={s.userId}
                              onClick={() => handleCreateAlias(unmatched.name, s.userId)}
                              disabled={creatingAlias === unmatched.name}
                              className="text-xs px-2 py-1 bg-orange-100 rounded hover:bg-orange-200 disabled:opacity-50"
                            >
                              {s.userName}
                            </button>
                          ))}
                          <button
                            onClick={() => handleIgnoreConsultant(unmatched.name)}
                            disabled={creatingAlias === unmatched.name}
                            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            Ignorer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <div>
            {result && (
              <span className={`px-3 py-1 rounded-full text-sm ${result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {result.valid ? 'Klar for import' : 'Feil må løses'}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              {result && !result.dryRun ? 'Lukk' : 'Avbryt'}
            </button>
            {step === 'upload' && (
              <button
                onClick={handlePreview}
                disabled={!file || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Leser...' : 'Neste'}
              </button>
            )}
            {step === 'mapping' && (
              <button
                onClick={handleValidate}
                disabled={importing || getRequiredFieldsMissing().length > 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Validerer...' : 'Valider'}
              </button>
            )}
            {step === 'result' && result?.valid && result.dryRun && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {importing ? 'Importerer...' : 'Importer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
