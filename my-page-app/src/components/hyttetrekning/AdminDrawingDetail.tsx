// components/hyttetrekning/AdminDrawingDetail.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import cabinLotteryService from '@/services/cabinLottery.service'
import type {
  Drawing,
  Period,
  Wish,
  Allocation,
  Execution,
  PeriodFormState,
  BulkPeriodFormState,
  ImportResult,
  WishesViewMode,
  ActiveTab,
} from '@/types/cabinLottery.types'
import DrawingHeader from './admin/DrawingHeader'
import PeriodsTab from './admin/PeriodsTab/PeriodsTab'
import WishesTab from './admin/WishesTab/WishesTab'
import DrawTab from './admin/DrawTab'
import ResultsTab from './admin/ResultsTab'
import ExecutionsTab from './admin/ExecutionsTab'

export default function AdminDrawingDetail({
  drawingId,
}: {
  drawingId: string
}) {
  const router = useRouter()
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const [wishes, setWishes] = useState<Wish[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [auditLog, setAuditLog] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('periods')
  const [loading, setLoading] = useState<boolean>(true)

  // Executions state
  const [executions, setExecutions] = useState<Execution[]>([])
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null,
  )

  // Booking warnings (persistent across tab changes)
  const [bookingWarnings, setBookingWarnings] = useState<string[]>([])

  // Period form
  const [showPeriodForm, setShowPeriodForm] = useState<boolean>(false)
  const [showBulkPeriodForm, setShowBulkPeriodForm] = useState<boolean>(false)
  const [newPeriod, setNewPeriod] = useState<PeriodFormState>({
    startDate: '',
    endDate: '',
    description: '',
    comment: '',
    sortOrder: 0,
  })
  const [bulkPeriod, setBulkPeriod] = useState<BulkPeriodFormState>({
    startDate: '',
    endDate: '',
  })
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null)
  const [editPeriod, setEditPeriod] = useState<PeriodFormState>({
    startDate: '',
    endDate: '',
    description: '',
    comment: '',
    sortOrder: 0,
  })

  // Import
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState<boolean>(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Draw
  const [drawSeed, setDrawSeed] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState<boolean>(false)

  // Wishes view mode
  const [wishesViewMode, setWishesViewMode] =
    useState<WishesViewMode>('by-user')

  useEffect(() => {
    if (drawingId) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [drawingRes, periodsRes] = await Promise.all([
        cabinLotteryService.adminGetDrawing(drawingId),
        cabinLotteryService.adminGetPeriods(drawingId),
      ])
      setDrawing(drawingRes.data ?? null)
      setPeriods(periodsRes.data ?? [])

      // Determine which execution to use for allocations
      let executionIdToUse = selectedExecutionId

      // Load executions from drawing
      if (
        drawingRes.data &&
        drawingRes.data.executions &&
        drawingRes.data.executions.length > 0
      ) {
        setExecutions(drawingRes.data.executions)
        // Auto-select the most recent execution if none is selected
        if (!selectedExecutionId && drawingRes.data.executions.length > 0) {
          const latestExecution =
            drawingRes.data.executions[drawingRes.data.executions.length - 1]
          executionIdToUse = latestExecution.id
          setSelectedExecutionId(latestExecution.id)
        }
      }

      if (
        drawingRes.data &&
        ['OPEN', 'LOCKED', 'DRAWN', 'PUBLISHED'].includes(
          drawingRes.data.status,
        )
      ) {
        const wishesRes = await cabinLotteryService.adminGetAllWishes(drawingId)
        setWishes(wishesRes.data ?? [])
      }

      if (
        drawingRes.data &&
        ['DRAWN', 'PUBLISHED'].includes(drawingRes.data.status)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allocsRes = await cabinLotteryService.adminGetAllocations(
          drawingId,
          executionIdToUse as any,
        )
        setAllocations(allocsRes.data ?? [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Feil ved lasting av data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPeriod = async (): Promise<void> => {
    if (!newPeriod.startDate || !newPeriod.endDate || !newPeriod.description) {
      toast.warning('Vennligst fyll ut alle felt')
      return
    }

    try {
      await cabinLotteryService.adminAddPeriod(drawingId, newPeriod)
      setShowPeriodForm(false)
      setNewPeriod({
        startDate: '',
        endDate: '',
        description: '',
        comment: '',
        sortOrder: 0,
      })
      await loadData()
      toast.success('Periode lagt til!')
    } catch (error) {
      console.error('Failed to add period:', error)
      toast.error('Feil ved tillegg av periode')
    }
  }

  const handleEditPeriod = (period: Period): void => {
    setEditingPeriodId(period.id)
    setEditPeriod({
      startDate: period.startDate,
      endDate: period.endDate,
      description: period.description,
      comment: period.comment || '',
      sortOrder: period.sortOrder,
    })
  }

  const handleUpdatePeriod = async (): Promise<void> => {
    if (
      !editPeriod.startDate ||
      !editPeriod.endDate ||
      !editPeriod.description
    ) {
      toast.warning('Vennligst fyll ut alle felt')
      return
    }

    try {
      await cabinLotteryService.adminUpdatePeriod(
        drawingId,
        editingPeriodId!,
        editPeriod,
      )
      setEditingPeriodId(null)
      setEditPeriod({
        startDate: '',
        endDate: '',
        description: '',
        comment: '',
        sortOrder: 0,
      })
      await loadData()
      toast.success('Periode oppdatert!')
    } catch (error) {
      console.error('Failed to update period:', error)
      toast.error('Feil ved oppdatering av periode')
    }
  }

  const handleCancelEdit = (): void => {
    setEditingPeriodId(null)
    setEditPeriod({
      startDate: '',
      endDate: '',
      description: '',
      comment: '',
      sortOrder: 0,
    })
  }

  const handleDeletePeriod = async (periodId: string): Promise<void> => {
    if (!confirm('Er du sikker på at du vil slette denne perioden?')) return

    try {
      await cabinLotteryService.adminDeletePeriod(drawingId, periodId)
      await loadData()
      toast.success('Periode slettet!')
    } catch (error) {
      console.error('Failed to delete period:', error)
      toast.error('Feil ved sletting av periode')
    }
  }

  const handleBulkAddPeriods = async () => {
    if (!bulkPeriod.startDate || !bulkPeriod.endDate) {
      toast.warning('Vennligst fyll ut både startdato og sluttdato')
      return
    }

    try {
      const response = await cabinLotteryService.adminBulkCreatePeriods(
        drawingId,
        bulkPeriod.startDate,
        bulkPeriod.endDate,
      )
      setShowBulkPeriodForm(false)
      setBulkPeriod({ startDate: '', endDate: '' })
      await loadData()
      toast.success(`${response.data?.periodsCreated ?? 0} perioder opprettet!`)
    } catch (error) {
      console.error('Failed to bulk add periods:', error)
      toast.error('Feil ved oppretting av perioder')
    }
  }

  const handleLockDrawing = async () => {
    if (!confirm('Er du sikker på at du vil låse trekningen?')) return

    try {
      await cabinLotteryService.adminLockDrawing(drawingId)
      await loadData()
      toast.success('Trekning låst!')
    } catch (error) {
      console.error('Failed to lock drawing:', error)
      toast.error('Feil ved låsing')
    }
  }

  const handleUnlockDrawing = async () => {
    if (!confirm('Er du sikker på at du vil låse opp trekningen?')) return

    try {
      await cabinLotteryService.adminUnlockDrawing(drawingId)
      await loadData()
      toast.success('Trekning låst opp!')
    } catch (error) {
      console.error('Failed to unlock drawing:', error)
      toast.error('Feil ved opplåsing')
    }
  }

  const handleOpenDrawing = async () => {
    if (!confirm('Er du sikker på at du vil åpne trekningen for brukere?'))
      return

    try {
      await cabinLotteryService.adminOpenDrawing(drawingId)
      await loadData()
      toast.success('Trekning åpnet!')
    } catch (error) {
      console.error('Failed to open drawing:', error)
      toast.error('Feil ved åpning av trekning')
    }
  }

  const handleRevertToDraft = async () => {
    if (
      !confirm('Er du sikker på at du vil sette trekningen tilbake til utkast?')
    )
      return

    try {
      await cabinLotteryService.adminRevertToDraft(drawingId)
      await loadData()
      toast.success('Trekning satt tilbake til utkast!')
    } catch (error) {
      console.error('Failed to revert drawing:', error)
      toast.error('Feil ved tilbakestilling til utkast')
    }
  }

  const handleRevertToLocked = async () => {
    if (
      !confirm('Er du sikker på at du vil sette trekningen tilbake til låst?')
    )
      return

    try {
      await cabinLotteryService.adminRevertToLocked(drawingId)
      await loadData()
      toast.success('Trekning satt tilbake til låst!')
    } catch (error) {
      console.error('Failed to revert drawing:', error)
      toast.error('Feil ved tilbakestilling til låst')
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.warning('Velg en fil først')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const response = await cabinLotteryService.adminImportWishes(
        drawingId,
        importFile,
      )
      setImportResult((response.data as unknown as ImportResult) ?? null)
      await loadData()

      if (response.data && response.data.errorCount === 0) {
        toast.success(
          `Import vellykket! ${response.data.successCount} brukere importert.`,
        )
      } else if (response.data) {
        toast.warning(
          `Import delvis vellykket. ${response.data.successCount} brukere importert, ${response.data.errorCount} feil.`,
        )
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Import feilet')
    } finally {
      setImporting(false)
    }
  }

  const handlePerformDraw = async () => {
    if (!confirm('Er du sikker på at du vil kjøre trekningen?')) return

    setIsDrawing(true)
    try {
      const seed = drawSeed ? parseInt(drawSeed) : null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await cabinLotteryService.adminPerformDraw(
        drawingId,
        seed as any,
      )

      // Lagre audit log og allocations fra resultatet
      if (result.data && result.data.auditLog) {
        setAuditLog(result.data.auditLog)
      }
      if (result.data && result.data.allocations) {
        setAllocations(result.data.allocations)
      }

      // Auto-select the newly created execution
      if (result.data && result.data.executionId) {
        setSelectedExecutionId(result.data.executionId)
      }

      await loadData()
      setActiveTab('executions')
      toast.success('Trekning gjennomført!')
    } catch (error) {
      console.error('Draw failed:', error)
      toast.error('Trekning feilet')
    } finally {
      setIsDrawing(false)
    }
  }

  const handlePublish = async (executionId: string) => {
    if (!executionId) {
      toast.error('Velg en trekning først')
      return
    }

    if (
      !confirm(
        'Er du sikker på at du vil publisere? Dette oppretter faktiske bookings.',
      )
    )
      return

    try {
      const result = await cabinLotteryService.adminPublishDrawing(
        drawingId,
        executionId,
      )
      await loadData()

      // Check if there were any booking warnings
      console.log('Publish result:', result.data)
      if (
        result?.data?.bookingWarnings &&
        result.data.bookingWarnings.length > 0
      ) {
        setBookingWarnings(result.data.bookingWarnings)
        toast.warning(
          `Trekning publisert, men ${result.data.bookingWarnings.length} booking(s) feilet. Se advarsler under.`,
        )
      } else {
        setBookingWarnings([])
        toast.success('Trekning publisert! Alle bookings er opprettet.')
      }
    } catch (error) {
      console.error('Publish failed:', error)
      toast.error('Publisering feilet')
    }
  }

  const handleDeleteDrawing = async () => {
    if (
      !confirm(
        'Er du sikker på at du vil slette denne trekningen? Dette kan ikke angres.',
      )
    )
      return

    try {
      await cabinLotteryService.adminDeleteDrawing(drawingId)
      router.push('/admin/hyttetrekning')
      toast.success('Trekning slettet')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error(
        'Feil ved sletting av trekning. Trekningen kan være gjennomført eller publisert.',
      )
    }
  }

  const togglePeriodForm = () => {
    setShowPeriodForm(!showPeriodForm)
    setShowBulkPeriodForm(false)
  }

  const toggleBulkPeriodForm = () => {
    setShowBulkPeriodForm(!showBulkPeriodForm)
    setShowPeriodForm(false)
  }

  const updateNewPeriod = (
    field: keyof PeriodFormState,
    value: string | number,
  ): void => {
    setNewPeriod({ ...newPeriod, [field]: value })
  }

  const updateBulkPeriod = (
    field: keyof BulkPeriodFormState,
    value: string,
  ): void => {
    setBulkPeriod({ ...bulkPeriod, [field]: value })
  }

  const updateEditPeriod = (
    field: keyof PeriodFormState,
    value: string | number,
  ): void => {
    setEditPeriod({ ...editPeriod, [field]: value })
  }

  if (loading || !drawing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laster...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DrawingHeader
          drawing={drawing}
          periodsCount={periods.length}
          onDeleteDrawing={handleDeleteDrawing}
          onOpenDrawing={handleOpenDrawing}
          onRevertToDraft={handleRevertToDraft}
          onRevertToLocked={handleRevertToLocked}
          onLockDrawing={handleLockDrawing}
          onUnlockDrawing={handleUnlockDrawing}
          onGoToDraw={() => setActiveTab('draw')}
        />

        {/* Booking Warnings - persistent across tab changes */}
        {bookingWarnings.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg shadow">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Advarsler ved publisering ({bookingWarnings.length} booking(s)
                  feilet)
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {bookingWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setBookingWarnings([])}
                    className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                  >
                    <span className="sr-only">Lukk</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                {
                  id: 'periods' as const,
                  label: 'Perioder',
                  count: periods.length,
                },
                {
                  id: 'wishes' as const,
                  label: 'Ønsker',
                  count: wishes.length,
                },
                { id: 'draw' as const, label: 'Trekning', count: undefined },
                {
                  id: 'results' as const,
                  label: 'Oversikt',
                  count: allocations.length,
                  showOnlyWhen: ['DRAWN', 'PUBLISHED'].includes(drawing.status),
                },
                {
                  id: 'executions' as const,
                  label: 'Trekningshistorikk',
                  count: executions.length,
                },
              ]
                .filter(
                  (tab) => tab.showOnlyWhen === undefined || tab.showOnlyWhen,
                )
                .map((tab) => (
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
                      <span className="ml-2 text-xs text-gray-400">
                        ({tab.count})
                      </span>
                    )}
                  </button>
                ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'periods' && (
              <PeriodsTab
                periods={periods}
                drawingStatus={drawing.status}
                showPeriodForm={showPeriodForm}
                showBulkPeriodForm={showBulkPeriodForm}
                newPeriod={newPeriod}
                bulkPeriod={bulkPeriod}
                editingPeriodId={editingPeriodId}
                editPeriod={editPeriod}
                onTogglePeriodForm={togglePeriodForm}
                onToggleBulkPeriodForm={toggleBulkPeriodForm}
                onUpdateNewPeriod={updateNewPeriod}
                onUpdateBulkPeriod={updateBulkPeriod}
                onUpdateEditPeriod={updateEditPeriod}
                onAddPeriod={handleAddPeriod}
                onBulkAddPeriods={handleBulkAddPeriods}
                onEditPeriod={handleEditPeriod}
                onUpdatePeriod={handleUpdatePeriod}
                onCancelEdit={handleCancelEdit}
                onDeletePeriod={handleDeletePeriod}
              />
            )}

            {activeTab === 'wishes' && (
              <WishesTab
                wishes={wishes}
                drawingStatus={drawing.status}
                wishesViewMode={wishesViewMode}
                importFile={importFile}
                importing={importing}
                importResult={importResult}
                onSetWishesViewMode={setWishesViewMode}
                onSetImportFile={setImportFile}
                onImport={handleImport}
              />
            )}

            {activeTab === 'draw' && (
              <DrawTab
                drawingStatus={drawing.status}
                drawSeed={drawSeed}
                isDrawing={isDrawing}
                onSetDrawSeed={setDrawSeed}
                onPerformDraw={handlePerformDraw}
              />
            )}

            {activeTab === 'results' && (
              <ResultsTab
                periods={periods}
                allocations={allocations}
                auditLog={auditLog}
              />
            )}

            {activeTab === 'executions' && (
              <ExecutionsTab
                executions={executions}
                publishedExecutionId={drawing.publishedExecutionId}
                publishedByName={drawing.publishedByName}
                drawingStatus={drawing.status}
                onPublishExecution={handlePublish}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
