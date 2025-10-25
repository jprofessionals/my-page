// components/hyttetrekning/AdminDrawingDetail.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import cabinLotteryService from '@/services/cabinLottery.service'

export default function AdminDrawingDetail({ drawingId }: { drawingId: string }) {
  const router = useRouter()
  const [drawing, setDrawing] = useState(null)
  const [periods, setPeriods] = useState([])
  const [wishes, setWishes] = useState([])
  const [allocations, setAllocations] = useState([])
  const [activeTab, setActiveTab] = useState('periods')
  const [loading, setLoading] = useState(true)

  // Period form
  const [showPeriodForm, setShowPeriodForm] = useState(false)
  const [showBulkPeriodForm, setShowBulkPeriodForm] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    startDate: '',
    endDate: '',
    description: '',
    comment: '',
    sortOrder: 0,
  })
  const [bulkPeriod, setBulkPeriod] = useState({
    startDate: '',
    endDate: '',
  })
  const [editingPeriodId, setEditingPeriodId] = useState(null)
  const [editPeriod, setEditPeriod] = useState({
    startDate: '',
    endDate: '',
    description: '',
    comment: '',
    sortOrder: 0,
  })

  // Import
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // Draw
  const [drawSeed, setDrawSeed] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)

  // Wishes view mode
  const [wishesViewMode, setWishesViewMode] = useState('by-user') // 'by-user' or 'by-period'

  useEffect(() => {
    if (drawingId) {
      loadData()
    }
  }, [drawingId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [drawingRes, periodsRes] = await Promise.all([
        cabinLotteryService.adminGetDrawing(drawingId),
        cabinLotteryService.adminGetPeriods(drawingId),
      ])
      setDrawing(drawingRes.data)
      setPeriods(periodsRes.data)

      if (['OPEN', 'LOCKED', 'DRAWN', 'PUBLISHED'].includes(drawingRes.data.status)) {
        const wishesRes = await cabinLotteryService.adminGetAllWishes(drawingId)
        setWishes(wishesRes.data)
      }

      if (['DRAWN', 'PUBLISHED'].includes(drawingRes.data.status)) {
        const allocsRes = await cabinLotteryService.adminGetAllocations(drawingId)
        setAllocations(allocsRes.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Feil ved lasting av data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPeriod = async () => {
    if (!newPeriod.startDate || !newPeriod.endDate || !newPeriod.description) {
      alert('Vennligst fyll ut alle felt')
      return
    }

    try {
      await cabinLotteryService.adminAddPeriod(drawingId, newPeriod)
      setShowPeriodForm(false)
      setNewPeriod({ startDate: '', endDate: '', description: '', sortOrder: 0 })
      await loadData()
      alert('Periode lagt til!')
    } catch (error) {
      console.error('Failed to add period:', error)
      alert('Feil ved tillegg av periode')
    }
  }

  const handleEditPeriod = (period) => {
    setEditingPeriodId(period.id)
    setEditPeriod({
      startDate: period.startDate,
      endDate: period.endDate,
      description: period.description,
      comment: period.comment || '',
      sortOrder: period.sortOrder,
    })
  }

  const handleUpdatePeriod = async () => {
    if (!editPeriod.startDate || !editPeriod.endDate || !editPeriod.description) {
      alert('Vennligst fyll ut alle felt')
      return
    }

    try {
      await cabinLotteryService.adminUpdatePeriod(drawingId, editingPeriodId, editPeriod)
      setEditingPeriodId(null)
      setEditPeriod({ startDate: '', endDate: '', description: '', sortOrder: 0 })
      await loadData()
      alert('Periode oppdatert!')
    } catch (error) {
      console.error('Failed to update period:', error)
      alert('Feil ved oppdatering av periode')
    }
  }

  const handleCancelEdit = () => {
    setEditingPeriodId(null)
    setEditPeriod({ startDate: '', endDate: '', description: '', sortOrder: 0 })
  }

  const handleDeletePeriod = async (periodId) => {
    if (!confirm('Er du sikker på at du vil slette denne perioden?')) return

    try {
      await cabinLotteryService.adminDeletePeriod(drawingId, periodId)
      await loadData()
      alert('Periode slettet!')
    } catch (error) {
      console.error('Failed to delete period:', error)
      alert('Feil ved sletting av periode')
    }
  }

  const handleBulkAddPeriods = async () => {
    if (!bulkPeriod.startDate || !bulkPeriod.endDate) {
      alert('Vennligst fyll ut både startdato og sluttdato')
      return
    }

    try {
      const response = await cabinLotteryService.adminBulkCreatePeriods(
        drawingId,
        bulkPeriod.startDate,
        bulkPeriod.endDate
      )
      setShowBulkPeriodForm(false)
      setBulkPeriod({ startDate: '', endDate: '' })
      await loadData()
      alert(`${response.data.periodsCreated} perioder opprettet!`)
    } catch (error) {
      console.error('Failed to bulk add periods:', error)
      alert('Feil ved oppretting av perioder')
    }
  }

  const handleLockDrawing = async () => {
    if (!confirm('Er du sikker på at du vil låse trekningen?')) return

    try {
      await cabinLotteryService.adminLockDrawing(drawingId)
      await loadData()
      alert('Trekning låst!')
    } catch (error) {
      console.error('Failed to lock drawing:', error)
      alert('Feil ved låsing')
    }
  }

  const handleUnlockDrawing = async () => {
    if (!confirm('Er du sikker på at du vil låse opp trekningen?')) return

    try {
      await cabinLotteryService.adminUnlockDrawing(drawingId)
      await loadData()
      alert('Trekning låst opp!')
    } catch (error) {
      console.error('Failed to unlock drawing:', error)
      alert('Feil ved opplåsing')
    }
  }

  const handleOpenDrawing = async () => {
    if (!confirm('Er du sikker på at du vil åpne trekningen for brukere?')) return

    try {
      await cabinLotteryService.adminOpenDrawing(drawingId)
      await loadData()
      alert('Trekning åpnet!')
    } catch (error) {
      console.error('Failed to open drawing:', error)
      alert('Feil ved åpning av trekning')
    }
  }

  const handleRevertToDraft = async () => {
    if (!confirm('Er du sikker på at du vil sette trekningen tilbake til utkast?')) return

    try {
      await cabinLotteryService.adminRevertToDraft(drawingId)
      await loadData()
      alert('Trekning satt tilbake til utkast!')
    } catch (error) {
      console.error('Failed to revert drawing:', error)
      alert('Feil ved tilbakestilling til utkast')
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      alert('Velg en fil først')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const response = await cabinLotteryService.adminImportWishes(drawingId, importFile)
      setImportResult(response.data)
      await loadData()

      if (response.data.errorCount === 0) {
        alert(`Import vellykket! ${response.data.successCount} brukere importert.`)
      } else {
        alert(`Import delvis vellykket. ${response.data.successCount} brukere importert, ${response.data.errorCount} feil.`)
      }
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import feilet')
    } finally {
      setImporting(false)
    }
  }

  const handlePerformDraw = async () => {
    if (!confirm('Er du sikker på at du vil kjøre trekningen?')) return

    setIsDrawing(true)
    try {
      const seed = drawSeed ? parseInt(drawSeed) : null
      await cabinLotteryService.adminPerformDraw(drawingId, seed)
      await loadData()
      setActiveTab('results')
      alert('Trekning gjennomført!')
    } catch (error) {
      console.error('Draw failed:', error)
      alert('Trekning feilet')
    } finally {
      setIsDrawing(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Er du sikker på at du vil publisere? Dette oppretter faktiske bookings.')) return

    try {
      await cabinLotteryService.adminPublishDrawing(drawingId)
      await loadData()
      alert('Trekning publisert! Bookings er opprettet.')
    } catch (error) {
      console.error('Publish failed:', error)
      alert('Publisering feilet')
    }
  }

  const handleDeleteDrawing = async () => {
    if (!confirm('Er du sikker på at du vil slette denne trekningen? Dette kan ikke angres.')) return

    try {
      await cabinLotteryService.adminDeleteDrawing(drawingId)
      router.push('/admin/hyttetrekning')
      alert('Trekning slettet')
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Feil ved sletting av trekning. Trekningen kan være gjennomført eller publisert.')
    }
  }

  if (loading || !drawing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laster...</div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'text-gray-600',
      OPEN: 'text-green-600',
      LOCKED: 'text-yellow-600',
      DRAWN: 'text-blue-600',
      PUBLISHED: 'text-purple-600',
    }
    return colors[status] || 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/hyttetrekning')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Tilbake til oversikt
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{drawing.season}</h1>
              <p className={`mt-2 text-lg font-medium ${getStatusColor(drawing.status)}`}>
                Status: {drawing.status}
              </p>
            </div>
            <div className="flex gap-3">
              {(drawing.status === 'DRAFT' || drawing.status === 'OPEN' || drawing.status === 'LOCKED') && (
                <button
                  onClick={handleDeleteDrawing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Slett trekning
                </button>
              )}
              {drawing.status === 'DRAFT' && periods.length > 0 && (
                <button
                  onClick={handleOpenDrawing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Åpne trekning
                </button>
              )}
              {(drawing.status === 'OPEN' || drawing.status === 'LOCKED') && (
                <button
                  onClick={handleRevertToDraft}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Tilbake til utkast
                </button>
              )}
              {drawing.status === 'OPEN' && periods.length > 0 && (
                <button
                  onClick={handleLockDrawing}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Lås trekning
                </button>
              )}
              {drawing.status === 'LOCKED' && (
                <>
                  <button
                    onClick={handleUnlockDrawing}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    Lås opp trekning
                  </button>
                  <button
                    onClick={() => setActiveTab('draw')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Kjør trekning
                  </button>
                </>
              )}
              {drawing.status === 'DRAWN' && (
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Publiser resultater
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'periods', label: 'Perioder', count: periods.length },
                { id: 'wishes', label: 'Ønsker', count: wishes.length },
                { id: 'draw', label: 'Trekning' },
                { id: 'results', label: 'Resultater', count: allocations.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 text-xs text-gray-400">({tab.count})</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Periods tab */}
            {activeTab === 'periods' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Perioder</h2>
                  {(drawing.status === 'DRAFT' || drawing.status === 'OPEN') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowBulkPeriodForm(!showBulkPeriodForm)
                          setShowPeriodForm(false)
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        {showBulkPeriodForm ? 'Avbryt' : 'Legg til flere perioder'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPeriodForm(!showPeriodForm)
                          setShowBulkPeriodForm(false)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {showPeriodForm ? 'Avbryt' : 'Legg til enkeltperiode'}
                      </button>
                    </div>
                  )}
                </div>

                {showPeriodForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Startdato</label>
                        <input
                          type="date"
                          value={newPeriod.startDate}
                          onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Sluttdato</label>
                        <input
                          type="date"
                          value={newPeriod.endDate}
                          onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Beskrivelse</label>
                        <input
                          type="text"
                          value={newPeriod.description}
                          onChange={(e) => setNewPeriod({ ...newPeriod, description: e.target.value })}
                          placeholder="F.eks. Påske, Vinterferie Oslo"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Sortering</label>
                        <input
                          type="number"
                          value={newPeriod.sortOrder}
                          onChange={(e) => setNewPeriod({ ...newPeriod, sortOrder: parseInt(e.target.value) })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Kommentar (valgfritt)</label>
                        <input
                          type="text"
                          value={newPeriod.comment}
                          onChange={(e) => setNewPeriod({ ...newPeriod, comment: e.target.value })}
                          placeholder="F.eks. Vinterferie, Påske, JPro julebord"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddPeriod}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Lagre periode
                    </button>
                  </div>
                )}

                {showBulkPeriodForm && (
                  <div className="bg-purple-50 p-4 rounded-lg mb-6 border-2 border-purple-200">
                    <h3 className="font-medium mb-3">Legg til flere perioder (onsdag til onsdag)</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Alle perioder blir automatisk opprettet som uke-perioder fra onsdag til onsdag.
                      Beskrivelser genereres automatisk basert på datoene.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Første onsdag (startdato)
                        </label>
                        <input
                          type="date"
                          value={bulkPeriod.startDate}
                          onChange={(e) => setBulkPeriod({ ...bulkPeriod, startDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Siste onsdag (sluttdato)
                        </label>
                        <input
                          type="date"
                          value={bulkPeriod.endDate}
                          onChange={(e) => setBulkPeriod({ ...bulkPeriod, endDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleBulkAddPeriods}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Opprett perioder
                    </button>
                  </div>
                )}

                {periods.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Ingen perioder lagt til ennå
                  </div>
                ) : (
                  <div className="space-y-3">
                    {periods.map((period) => (
                      <div key={period.id} className="border border-gray-200 rounded-lg p-4">
                        {editingPeriodId === period.id ? (
                          // Edit form
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium mb-4">Rediger periode</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Startdato</label>
                                <input
                                  type="date"
                                  value={editPeriod.startDate}
                                  onChange={(e) => setEditPeriod({ ...editPeriod, startDate: e.target.value })}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Sluttdato</label>
                                <input
                                  type="date"
                                  value={editPeriod.endDate}
                                  onChange={(e) => setEditPeriod({ ...editPeriod, endDate: e.target.value })}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Beskrivelse</label>
                                <input
                                  type="text"
                                  value={editPeriod.description}
                                  onChange={(e) => setEditPeriod({ ...editPeriod, description: e.target.value })}
                                  placeholder="F.eks. Påske, Vinterferie Oslo"
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Sortering</label>
                                <input
                                  type="number"
                                  value={editPeriod.sortOrder}
                                  onChange={(e) => setEditPeriod({ ...editPeriod, sortOrder: parseInt(e.target.value) })}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-sm font-medium mb-2">Kommentar (valgfritt)</label>
                                <input
                                  type="text"
                                  value={editPeriod.comment}
                                  onChange={(e) => setEditPeriod({ ...editPeriod, comment: e.target.value })}
                                  placeholder="F.eks. Vinterferie, Påske, JPro julebord"
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={handleUpdatePeriod}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                              >
                                Lagre endringer
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                              >
                                Avbryt
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Normal view
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-lg">{period.description}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(period.startDate).toLocaleDateString('nb-NO')} -{' '}
                                {new Date(period.endDate).toLocaleDateString('nb-NO')}
                              </p>
                              {period.comment && (
                                <p className="text-sm text-gray-600 mt-1 italic">{period.comment}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">Sort: {period.sortOrder}</span>
                              {(drawing.status === 'DRAFT' || drawing.status === 'OPEN') && (
                                <>
                                  <button
                                    onClick={() => handleEditPeriod(period)}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                                  >
                                    Rediger
                                  </button>
                                  <button
                                    onClick={() => handleDeletePeriod(period.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                                  >
                                    Slett
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishes tab */}
            {activeTab === 'wishes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Ønsker</h2>
                  {drawing.status === 'OPEN' && (
                    <div className="flex gap-3">
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      <button
                        onClick={handleImport}
                        disabled={!importFile || importing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {importing ? 'Importerer...' : 'Importer CSV'}
                      </button>
                    </div>
                  )}
                </div>

                {importResult && (
                  <div className={`p-4 rounded-lg mb-6 ${importResult.errorCount === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <p className="font-medium">Import resultat:</p>
                    <p>Totalt linjer: {importResult.totalLines}</p>
                    <p>Vellykkede: {importResult.successCount}</p>
                    <p>Feil: {importResult.errorCount}</p>
                  </div>
                )}

                {wishes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Ingen ønsker registrert ennå
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-sm text-gray-600">
                        <p>Totalt ønsker: {wishes.length} fra {(() => {
                          const uniqueUsers = new Set(wishes.map(w => w.userId))
                          return uniqueUsers.size
                        })()} brukere</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setWishesViewMode('by-user')}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            wishesViewMode === 'by-user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Per bruker
                        </button>
                        <button
                          onClick={() => setWishesViewMode('by-period')}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            wishesViewMode === 'by-period'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Per periode
                        </button>
                      </div>
                    </div>

                    {/* By User View */}
                    {wishesViewMode === 'by-user' && (
                      <div className="overflow-x-auto">
                        {(() => {
                          // Group wishes by user
                          const wishesByUser = wishes.reduce((acc, wish) => {
                            if (!acc[wish.userId]) {
                              acc[wish.userId] = {
                                userName: wish.userName || 'Ukjent',
                                userEmail: wish.userEmail || '',
                                wishes: []
                              }
                            }
                            acc[wish.userId].wishes.push(wish)
                            return acc
                          }, {})

                          const users = Object.entries(wishesByUser).sort((a, b) =>
                            a[1].userName.localeCompare(b[1].userName)
                          )

                          return (
                            <table className="min-w-full divide-y divide-gray-200 bg-white">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bruker
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Antall ønsker
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ønsker (prioritert)
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(([userId, userData]) => (
                                  <tr key={userId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{userData.userName}</div>
                                      <div className="text-xs text-gray-500">{userData.userEmail}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {userData.wishes.length}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="space-y-2">
                                        {userData.wishes
                                          .sort((a, b) => a.priority - b.priority)
                                          .map((wish) => (
                                            <div key={wish.id} className="text-sm">
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs mr-2">
                                                {wish.priority}
                                              </span>
                                              <span className="font-medium text-gray-900">{wish.periodDescription}</span>
                                              <span className="text-gray-600"> → {wish.desiredApartmentNames.join(', ')}</span>
                                              {wish.comment && (
                                                <div className="ml-7 text-xs text-gray-500 italic mt-1">&ldquo;{wish.comment}&rdquo;</div>
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        })()}
                      </div>
                    )}

                    {/* By Period View */}
                    {wishesViewMode === 'by-period' && (
                      <div className="space-y-6">
                        {(() => {
                          // Group wishes by period
                          const wishesByPeriod = wishes.reduce((acc, wish) => {
                            if (!acc[wish.periodId]) {
                              acc[wish.periodId] = {
                                periodDescription: wish.periodDescription,
                                wishes: []
                              }
                            }
                            acc[wish.periodId].wishes.push(wish)
                            return acc
                          }, {})

                          return Object.entries(wishesByPeriod).map(([periodId, periodData]) => {
                            // Count unique users for this period
                            const uniqueUsers = new Set(periodData.wishes.map(w => w.userId))

                            // Count apartment preferences
                            const apartmentCounts = {}
                            periodData.wishes.forEach(wish => {
                              wish.desiredApartmentNames.forEach(aptName => {
                                apartmentCounts[aptName] = (apartmentCounts[aptName] || 0) + 1
                              })
                            })

                            // Group by user
                            const userWishes = {}
                            periodData.wishes.forEach(wish => {
                              if (!userWishes[wish.userId]) {
                                userWishes[wish.userId] = {
                                  userName: wish.userName || 'Ukjent',
                                  userEmail: wish.userEmail || '',
                                  priority: wish.priority,
                                  apartments: wish.desiredApartmentNames,
                                  comment: wish.comment
                                }
                              }
                            })

                            const sortedUsers = Object.entries(userWishes).sort((a, b) =>
                              a[1].priority - b[1].priority
                            )

                            return (
                              <div key={periodId} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                  <h3 className="text-lg font-semibold text-gray-900">{periodData.periodDescription}</h3>
                                  <div className="flex items-center gap-4 mt-2">
                                    <p className="text-sm text-gray-600">
                                      👥 {uniqueUsers.size} {uniqueUsers.size === 1 ? 'bruker' : 'brukere'}
                                    </p>
                                    {Object.keys(apartmentCounts).length > 0 && (
                                      <div className="flex gap-3 text-xs">
                                        {Object.entries(apartmentCounts)
                                          .sort((a, b) => b[1] - a[1])
                                          .map(([aptName, count]) => (
                                            <span key={aptName} className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                              {aptName}: {count}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Pri
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Bruker
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Ønskede enheter
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Kommentar
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {sortedUsers.map(([userId, userWish]) => (
                                        <tr key={userId} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 whitespace-nowrap">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                                              {userWish.priority}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{userWish.userName}</div>
                                            <div className="text-xs text-gray-500">{userWish.userEmail}</div>
                                          </td>
                                          <td className="px-4 py-2">
                                            <div className="text-sm text-gray-900">{userWish.apartments.join(', ')}</div>
                                          </td>
                                          <td className="px-4 py-2">
                                            {userWish.comment && (
                                              <div className="text-xs text-gray-500 italic">&ldquo;{userWish.comment}&rdquo;</div>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Draw tab */}
            {activeTab === 'draw' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Kjør trekning</h2>

                {drawing.status !== 'LOCKED' ? (
                  <div className="text-center py-12 text-gray-500">
                    Trekningen må være låst før den kan kjøres
                  </div>
                ) : (
                  <div className="max-w-md">
                    <p className="mb-6 text-gray-600">
                      Når du kjører trekningen vil snake draft-algoritmen fordele hyttene.
                    </p>

                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        Seed (valgfritt - kun for testing)
                      </label>
                      <input
                        type="number"
                        value={drawSeed}
                        onChange={(e) => setDrawSeed(e.target.value)}
                        placeholder="La stå tom for tilfeldig trekning"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Ikke nødvendig å fylle ut.</strong> Når feltet er tomt genereres en helt tilfeldig trekning.
                        Seed brukes kun for å reprodusere eksakt samme trekning i testing.
                      </p>
                    </div>

                    <button
                      onClick={handlePerformDraw}
                      disabled={isDrawing}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                    >
                      {isDrawing ? 'Kjører trekning...' : 'Kjør trekning nå'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Results tab */}
            {activeTab === 'results' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Resultater</h2>

                {allocations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Trekning ikke gjennomført ennå
                  </div>
                ) : (
                  <div className="space-y-6">
                    {periods.map((period) => {
                      const periodAllocs = allocations.filter((a) => a.periodId === period.id)
                      return (
                        <div key={period.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-lg mb-3">{period.description}</h3>
                          {periodAllocs.length === 0 ? (
                            <p className="text-sm text-gray-500">Ingen tildelinger</p>
                          ) : (
                            <div className="space-y-2">
                              {periodAllocs.map((allocation) => (
                                <div
                                  key={allocation.id}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="font-medium">{allocation.apartmentName}</span>
                                  <span className="text-gray-600">{allocation.userName}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
