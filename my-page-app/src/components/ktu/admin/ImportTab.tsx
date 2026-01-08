'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import ktuService, {
  KtuImportResult,
  KtuImportError,
  KtuCsvPreview,
  KtuImportField,
  UserSyncResult,
  UnmatchedConsultant,
  SuggestedMatch,
  KtuUser,
  ConsultantAlias,
} from '@/services/ktu.service'

type Step = 'upload' | 'mapping' | 'result'

type ColumnMapping = Record<string, number | null>

export default function ImportTab() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<KtuCsvPreview | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<KtuImportResult | null>(null)
  const [skipUnmatched, setSkipUnmatched] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<UserSyncResult | null>(null)
  const [creatingAlias, setCreatingAlias] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<KtuUser[]>([])
  const [aliases, setAliases] = useState<ConsultantAlias[]>([])

  const loadUsersAndAliases = async () => {
    try {
      const [usersRes, aliasesRes] = await Promise.all([
        ktuService.getKtuUsers(),
        ktuService.getConsultantAliases(),
      ])
      if (usersRes.data) setAllUsers(usersRes.data)
      if (aliasesRes.data) setAliases(aliasesRes.data)
    } catch (error) {
      console.error('Failed to load users/aliases:', error)
    }
  }

  const handleCreateAlias = async (aliasName: string, userId: number) => {
    setCreatingAlias(aliasName)
    try {
      const response = await ktuService.createConsultantAlias({ aliasName, userId })
      if (response.data) {
        setAliases((prev) => [...prev, response.data!])
        toast.success(`Alias opprettet: "${aliasName}" -> bruker`)
        // Re-validate to update the unmatched list
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
      const response = await ktuService.createConsultantAlias({ aliasName })
      if (response.data) {
        setAliases((prev) => [...prev, response.data!])
        toast.success(`"${aliasName}" vil bli ignorert (tidligere ansatt)`)
        // Re-validate to update the unmatched list
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

  const handleDeleteAlias = async (aliasId: number) => {
    try {
      await ktuService.deleteConsultantAlias(aliasId)
      setAliases((prev) => prev.filter((a) => a.id !== aliasId))
      toast.success('Alias slettet')
    } catch (error) {
      console.error('Failed to delete alias:', error)
      toast.error('Feil ved sletting av alias')
    }
  }

  const handleSyncUsers = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await ktuService.syncUsersFromFlowcase()
      if (response.data) {
        setSyncResult(response.data)
        if ((response.data.created ?? 0) > 0 || (response.data.updated ?? 0) > 0) {
          toast.success(
            `Synkronisering fullført: ${response.data.created ?? 0} nye, ${response.data.updated ?? 0} oppdatert`
          )
        } else {
          toast.info('Ingen endringer - alle brukere er allerede oppdatert')
        }
      }
    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Feil ved synkronisering av brukere')
    } finally {
      setSyncing(false)
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
      // Load users and aliases for suggestions
      await loadUsersAndAliases()

      const response = await ktuService.previewCsv(file)
      if (response.data) {
        setPreview(response.data)
        // Initialize mapping with null values
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
      const response = await ktuService.importHistorical(file, true, skipUnmatched, columnMapping)
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
    if (!file) {
      toast.warning('Vennligst velg en fil først')
      return
    }

    if (!result?.valid) {
      toast.warning('Valider filen først og løs eventuelle feil')
      return
    }

    if (!confirm('Er du sikker på at du vil importere dataene? Dette kan ikke angres.')) {
      return
    }

    setImporting(true)
    try {
      const response = await ktuService.importHistorical(file, false, skipUnmatched, columnMapping)
      setResult(response.data || null)
      if (response.data && !response.data.dryRun) {
        toast.success(`Import fullført! ${response.data.importedResponses} svar importert.`)
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
      {/* Sync Users from Flowcase */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Synkroniser brukere fra Flowcase</h3>
            <p className="text-sm text-gray-600 mb-4">
              Før du importerer KTU-data, bør du synkronisere konsulent-listen fra Flowcase.
              Dette sikrer at alle konsulenter i CSV-filen blir matchet korrekt.
            </p>
          </div>
          <button
            onClick={handleSyncUsers}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
          >
            {syncing ? 'Synkroniserer...' : 'Synkroniser brukere'}
          </button>
        </div>

        {syncResult && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Fra Flowcase:</span>
                <span className="ml-2 font-medium">{syncResult.totalFromFlowcase}</span>
              </div>
              <div>
                <span className="text-gray-500">Nye:</span>
                <span className="ml-2 font-medium text-green-600">{syncResult.created}</span>
              </div>
              <div>
                <span className="text-gray-500">Oppdatert:</span>
                <span className="ml-2 font-medium text-blue-600">{syncResult.updated}</span>
              </div>
              <div>
                <span className="text-gray-500">Uendret:</span>
                <span className="ml-2 font-medium text-gray-600">{syncResult.skipped}</span>
              </div>
            </div>
            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="mt-3 text-sm text-red-600">
                <p className="font-medium">Feil:</p>
                <ul className="list-disc list-inside">
                  {syncResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {syncResult.errors.length > 5 && (
                    <li>... og {syncResult.errors.length - 5} flere</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Importere historiske KTU-data</h3>
        <p className="text-sm text-blue-800 mb-2">
          Last opp en CSV-fil og velg hvilke kolonner som tilsvarer hvilke felt.
        </p>
        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
          <li>Last opp CSV-filen</li>
          <li>Se preview og velg kolonne-mapping</li>
          <li>Valider dataene</li>
          <li>Kjør import</li>
        </ol>
      </div>

      {/* Step 1: File upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 mb-4">1. Last opp CSV-fil</h3>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv"
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
          </div>

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
              {preview.totalRows} rader funnet (separator: {preview.delimiter})
            </span>
          </div>

          {/* Preview table */}
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
                      <td key={colIdx} className="px-2 py-1 border text-gray-700 max-w-xs truncate">
                        {row[colIdx] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Field mapping */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {preview.requiredFields?.map((field: KtuImportField) => {
              const selectedIdx = columnMapping[field.key]
              const hasSelection = typeof selectedIdx === 'number'
              const selectedColName = hasSelection ? preview.columns[selectedIdx] : null
              return (
                <div key={field.key} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {hasSelection && (
                    <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded break-words">
                      {selectedColName || '(tom header)'}
                    </p>
                  )}
                  <select
                    value={columnMapping[field.key] ?? ''}
                    onChange={(e) =>
                      handleMappingChange(
                        field.key,
                        e.target.value === '' ? null : parseInt(e.target.value)
                      )
                    }
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                      field.required && !hasSelection
                        ? 'border-red-300 bg-red-50'
                        : !hasSelection
                          ? 'border-gray-300 bg-gray-50 text-gray-500'
                          : 'border-green-300 bg-green-50'
                    }`}
                  >
                    <option value="">
                      {field.required ? '-- Velg kolonne (påkrevd) --' : '-- Finnes ikke i CSV --'}
                    </option>
                    {preview.columns.map((col, idx) => (
                      <option key={idx} value={idx}>
                        [{idx}] {col || `(tom header)`}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={skipUnmatched}
              onChange={(e) => setSkipUnmatched(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">
              Hopp over rader der konsulent ikke finnes i systemet
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleValidate}
              disabled={importing || getRequiredFieldsMissing().length > 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {importing ? 'Validerer...' : 'Valider data'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
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

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{result.totalRows}</div>
              <div className="text-sm text-gray-600">Totalt rader</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{result.validRows}</div>
              <div className="text-sm text-green-600">Gyldige rader</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-700">{result.skippedRows || 0}</div>
              <div className="text-sm text-yellow-600">Hoppet over</div>
            </div>
            {!result.dryRun && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">
                  {result.importedResponses || 0}
                </div>
                <div className="text-sm text-blue-600">Importert</div>
              </div>
            )}
          </div>

          {/* What will be created */}
          {result.dryRun && (
            <div className="mb-6 space-y-2">
              <h4 className="font-medium text-gray-700">Vil opprette:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {result.roundsToCreate && result.roundsToCreate.length > 0 && (
                  <li>
                    {result.roundsToCreate.length} runde(r): {result.roundsToCreate.join(', ')}
                  </li>
                )}
                {result.newOrganizations !== undefined && result.newOrganizations > 0 && (
                  <li>{result.newOrganizations} nye organisasjoner</li>
                )}
                {result.newContacts !== undefined && result.newContacts > 0 && (
                  <li>{result.newContacts} nye kontakter</li>
                )}
              </ul>
            </div>
          )}

          {/* What was created */}
          {!result.dryRun && (
            <div className="mb-6 space-y-2">
              <h4 className="font-medium text-gray-700">Opprettet:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {result.createdRounds !== undefined && result.createdRounds > 0 && (
                  <li>{result.createdRounds} runde(r)</li>
                )}
                {result.newOrganizations !== undefined && result.newOrganizations > 0 && (
                  <li>{result.newOrganizations} organisasjoner</li>
                )}
                {result.newContacts !== undefined && result.newContacts > 0 && (
                  <li>{result.newContacts} kontakter</li>
                )}
              </ul>
            </div>
          )}

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-red-700 mb-2">Feil ({result.errors.length})</h4>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-red-800">Rad</th>
                      <th className="px-3 py-2 text-left text-red-800">Felt</th>
                      <th className="px-3 py-2 text-left text-red-800">Verdi</th>
                      <th className="px-3 py-2 text-left text-red-800">Feil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {result.errors.map((error: KtuImportError, index: number) => (
                      <tr key={index} className="bg-red-25">
                        <td className="px-3 py-2 text-gray-900">{error.row}</td>
                        <td className="px-3 py-2 text-gray-700">{error.field}</td>
                        <td className="px-3 py-2 text-gray-500 truncate max-w-xs">
                          {error.value || '-'}
                        </td>
                        <td className="px-3 py-2 text-red-700">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unmatched Consultants with Suggestions */}
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
                            title={`Likhet: ${Math.round(suggestion.similarity * 100)}%`}
                          >
                            {suggestion.userName}
                            <span className="text-xs text-gray-400 ml-1">
                              ({Math.round(suggestion.similarity * 100)}%)
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Ingen forslag.</span>
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Aliases */}
          {aliases.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Aktive aliaser ({aliases.length})</h4>
              <div className="flex flex-wrap gap-2">
                {aliases.map((alias) => (
                  <div
                    key={alias.id}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      alias.ignored ? 'bg-gray-200 text-gray-500' : 'bg-gray-100'
                    }`}
                  >
                    <span className={alias.ignored ? 'line-through' : 'text-gray-600'}>
                      {alias.aliasName}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={alias.ignored ? 'text-gray-500 italic' : 'text-gray-900'}>
                      {alias.ignored ? '(ignorert)' : alias.userName}
                    </span>
                    <button
                      onClick={() => handleDeleteAlias(alias.id)}
                      className="ml-1 text-gray-400 hover:text-red-600"
                      title="Slett alias"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status badge and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {result.valid ? 'Klar for import' : 'Feil må løses'}
              </span>
              {result.dryRun && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Kun validering (dry run)
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Start på nytt
              </button>
              {result.dryRun && result.valid && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? 'Importerer...' : 'Importer data'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
