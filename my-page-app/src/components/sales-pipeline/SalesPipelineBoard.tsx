'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  salesPipelineService,
  type SalesPipelineBoard,
  type SalesStage,
  type SalesActivity,
  type ClosedReason,
} from '@/services/salesPipeline.service'
import SalesPipelineConsultantRow from './SalesPipelineConsultantRow'
import SalesPipelineCard from './SalesPipelineCard'
import CreateActivityModal from './CreateActivityModal'
import EditActivityModal from './EditActivityModal'
import EditAvailabilityModal from './EditAvailabilityModal'
import AddConsultantModal from './AddConsultantModal'
import MarkAsWonModal from './MarkAsWonModal'
import { useAuthContext } from '@/providers/AuthProvider'
import { type ConsultantWithActivities } from '@/services/salesPipeline.service'
import Link from 'next/link'

// Active stages shown as columns on the board (LOST is not shown as a column)
const STAGE_ORDER: SalesStage[] = [
  'INTERESTED',
  'SENT_TO_SUPPLIER',
  'SENT_TO_CUSTOMER',
  'INTERVIEW',
]

const STAGE_LABELS: Record<SalesStage, string> = {
  INTERESTED: 'Interessert',
  SENT_TO_SUPPLIER: 'Sendt til leverandør',
  SENT_TO_CUSTOMER: 'Sendt til kunde',
  INTERVIEW: 'Intervju',
  LOST: 'Tapt',
}

// Helper to check if an ID is a stage cell (format: "consultantId-STAGE")
const isStageCellId = (id: string | number): boolean => {
  const str = String(id)
  return STAGE_ORDER.some((stage) => str.endsWith(`-${stage}`))
}

// Custom collision detection that prioritizes stage cells over consultant rows
// when dragging activity cards
const customCollisionDetection: CollisionDetection = (args) => {
  const { active } = args
  const isActivityDrag = !String(active.id).startsWith('consultant-')

  // Get all collisions using rectIntersection
  const collisions = rectIntersection(args)

  if (isActivityDrag && collisions.length > 0) {
    // When dragging an activity, prioritize stage droppables over consultant sortables
    const stageCollision = collisions.find((collision) =>
      isStageCellId(collision.id),
    )
    if (stageCollision) {
      return [stageCollision]
    }
  }

  return collisions
}

export default function SalesPipelineBoardComponent() {
  const { user } = useAuthContext()
  const [board, setBoard] = useState<SalesPipelineBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddConsultantModal, setShowAddConsultantModal] = useState(false)
  const [activeActivity, setActiveActivity] = useState<SalesActivity | null>(
    null,
  )
  const [editingActivity, setEditingActivity] = useState<SalesActivity | null>(
    null,
  )
  const [editingConsultant, setEditingConsultant] =
    useState<ConsultantWithActivities | null>(null)
  const [activeConsultantId, setActiveConsultantId] = useState<number | null>(
    null,
  )
  const [markAsWonActivity, setMarkAsWonActivity] =
    useState<SalesActivity | null>(null)

  const isAdmin = user?.admin ?? false

  // DnD sensors with activation constraint to allow clicking
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    loadBoard()
  }, [])

  const loadBoard = async () => {
    setLoading(true)
    try {
      const data = await salesPipelineService.getBoard()
      console.log('Board data received:', data)
      if (data) {
        setBoard(data)
      } else {
        console.warn('No board data returned from API')
        setBoard(null)
      }
    } catch (error) {
      console.error('Failed to load pipeline board:', error)
      toast.error('Kunne ikke laste salgstavlen')
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (
    activityId: number,
    newStage: SalesStage,
  ) => {
    try {
      await salesPipelineService.updateStage(activityId, { stage: newStage })
      toast.success('Steg oppdatert')
      loadBoard()
    } catch (error) {
      console.error('Failed to update stage:', error)
      toast.error('Kunne ikke oppdatere steget')
    }
  }

  const handleMarkAsWon = (activityId: number) => {
    // Find the activity from the board
    const activity = board?.consultants
      .flatMap((c) => c.activities)
      .find((a) => a.id === activityId)
    if (activity) {
      setMarkAsWonActivity(activity)
    }
  }

  const handleCloseActivity = async (
    activityId: number,
    reason: ClosedReason,
  ) => {
    const reasonLabels: Record<ClosedReason, string> = {
      REJECTED_BY_SUPPLIER: 'avvist av leverandør',
      REJECTED_BY_CUSTOMER: 'avvist av kunde',
      MISSING_REQUIREMENTS: 'manglende krav',
      OTHER_CANDIDATE_CHOSEN: 'tapt',
      ASSIGNMENT_CANCELLED: 'kansellert',
      CONSULTANT_UNAVAILABLE: 'konsulent utilgjengelig',
      CONSULTANT_WON_OTHER: 'konsulent vant annet',
      OTHER: 'annet',
    }
    const label = reasonLabels[reason] || 'lukket'
    if (!confirm(`Er du sikker på at du vil markere denne som ${label}?`)) {
      return
    }
    try {
      await salesPipelineService.closeActivity(activityId, { reason })
      toast.success(`Aktivitet markert som ${label}`)
      loadBoard()
    } catch (error) {
      console.error('Failed to close activity:', error)
      toast.error('Kunne ikke lukke aktiviteten')
    }
  }

  const handleRemoveConsultant = async (consultantId: number) => {
    if (
      !confirm(
        'Er du sikker på at du vil fjerne denne konsulenten fra salgstavlen? Alle salgsaktiviteter og tilgjengelighetsinfo vil bli slettet.',
      )
    ) {
      return
    }
    try {
      await salesPipelineService.removeConsultantFromPipeline(consultantId)
      toast.success('Konsulent fjernet fra salgstavlen')
      loadBoard()
    } catch (error) {
      console.error('Failed to remove consultant:', error)
      toast.error('Kunne ikke fjerne konsulenten')
    }
  }

  const handleActivityCreated = () => {
    setShowCreateModal(false)
    loadBoard()
  }

  const handleConsultantAdded = () => {
    setShowAddConsultantModal(false)
    loadBoard()
  }

  const handleEditActivity = (activity: SalesActivity) => {
    setEditingActivity(activity)
  }

  const handleActivityUpdated = () => {
    setEditingActivity(null)
    loadBoard()
  }

  const handleEditAvailability = (consultant: ConsultantWithActivities) => {
    setEditingConsultant(consultant)
  }

  const handleAvailabilityUpdated = () => {
    setEditingConsultant(null)
    loadBoard()
  }

  // Find activity by ID across all consultants
  const findActivityById = (id: number): SalesActivity | null => {
    if (!board) return null
    for (const consultant of board.consultants) {
      const activity = consultant.activities.find((a) => a.id === id)
      if (activity) return activity
    }
    return null
  }

  // Check if the dragged item is a consultant row (prefixed with 'consultant-')
  const isConsultantDrag = (id: string | number): boolean => {
    return String(id).startsWith('consultant-')
  }

  const getConsultantIdFromDragId = (dragId: string | number): number => {
    return Number(String(dragId).replace('consultant-', ''))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id
    if (isConsultantDrag(id)) {
      setActiveConsultantId(getConsultantIdFromDragId(id))
      setActiveActivity(null)
    } else {
      const activityId = Number(id)
      const activity = findActivityById(activityId)
      setActiveActivity(activity)
      setActiveConsultantId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveActivity(null)
    setActiveConsultantId(null)

    const { active, over } = event
    if (!over || !isAdmin) return

    // Handle consultant row reordering
    if (isConsultantDrag(active.id) && isConsultantDrag(over.id)) {
      const activeConsultantId = getConsultantIdFromDragId(active.id)
      const overConsultantId = getConsultantIdFromDragId(over.id)

      if (activeConsultantId === overConsultantId || !board) return

      const oldIndex = board.consultants.findIndex(
        (c) => c.consultant.id === activeConsultantId,
      )
      const newIndex = board.consultants.findIndex(
        (c) => c.consultant.id === overConsultantId,
      )

      if (oldIndex === -1 || newIndex === -1) return

      // Optimistic update
      const newConsultants = arrayMove(board.consultants, oldIndex, newIndex)
      setBoard({ ...board, consultants: newConsultants })

      // API call
      try {
        const consultantIds = newConsultants
          .map((c) => c.consultant.id)
          .filter((id): id is number => id !== undefined)
        await salesPipelineService.reorderConsultants(consultantIds)
        toast.success('Rekkefølge oppdatert')
      } catch (error) {
        console.error('Failed to reorder consultants:', error)
        toast.error('Kunne ikke oppdatere rekkefølgen')
        loadBoard() // Revert on error
      }
      return
    }

    // Handle activity stage change
    const activityId = Number(active.id)

    // Parse stage from droppable ID (format: "consultantId-STAGE")
    const overId = String(over.id)
    const newStage = STAGE_ORDER.find((stage) => overId.endsWith(`-${stage}`))

    // Check if dropped on a valid stage
    if (!newStage) return

    const activity = findActivityById(activityId)
    if (!activity || activity.currentStage === newStage) return

    // Optimistic update
    if (board) {
      const updatedBoard = {
        ...board,
        consultants: board.consultants.map((c) => ({
          ...c,
          activities: c.activities.map((a) =>
            a.id === activityId ? { ...a, currentStage: newStage } : a,
          ),
        })),
      }
      setBoard(updatedBoard)
    }

    // API call
    try {
      await salesPipelineService.updateStage(activityId, { stage: newStage })
      toast.success(`Flyttet til ${STAGE_LABELS[newStage]}`)
    } catch (error) {
      console.error('Failed to update stage:', error)
      toast.error('Kunne ikke oppdatere steget')
      loadBoard() // Revert on error
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Ingen data tilgjengelig</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salgstavle</h1>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <span className="text-sm text-gray-500">
              Dra kort for å flytte mellom steg
            </span>
          )}
          {isAdmin && (
            <Link
              href="/salgstavle-analytics"
              className="btn btn-outline btn-sm"
            >
              📊 Analytics
            </Link>
          )}
          {isAdmin && (
            <button
              className="btn btn-outline"
              onClick={() => setShowAddConsultantModal(true)}
            >
              + Konsulent
            </button>
          )}
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Ny aktivitet
            </button>
          )}
        </div>
      </div>

      {/* Pipeline board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table w-full border-collapse">
            <thead>
              <tr className="bg-base-200">
                <th className="sticky left-0 z-10 min-w-[200px] bg-base-200 border-r-2 border-base-300">
                  Konsulent
                </th>
                {STAGE_ORDER.map((stage, index) => (
                  <th
                    key={stage}
                    className={`min-w-[200px] text-center bg-base-200 ${
                      index < STAGE_ORDER.length - 1
                        ? 'border-r-2 border-base-300'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{STAGE_LABELS[stage]}</span>
                      <span className="text-xs font-normal opacity-60">
                        Steg {index + 1}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <SortableContext
              items={board.consultants.map(
                (c) => `consultant-${c.consultant.id}`,
              )}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {board.consultants && board.consultants.length > 0 ? (
                  board.consultants.map((consultant, index) => (
                    <SalesPipelineConsultantRow
                      key={consultant.consultant.id}
                      consultant={consultant}
                      stages={STAGE_ORDER}
                      stageLabels={STAGE_LABELS}
                      isAdmin={isAdmin}
                      onStageChange={handleStageChange}
                      onMarkAsWon={handleMarkAsWon}
                      onCloseActivity={handleCloseActivity}
                      onEditActivity={handleEditActivity}
                      onEditAvailability={handleEditAvailability}
                      onRemoveConsultant={handleRemoveConsultant}
                      isEvenRow={index % 2 === 0}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={STAGE_ORDER.length + 1}
                      className="text-center py-8 text-gray-500"
                    >
                      Ingen aktive salgsaktiviteter
                    </td>
                  </tr>
                )}
              </tbody>
            </SortableContext>
          </table>
        </div>

        {/* Drag overlay - shows the card or row being dragged */}
        <DragOverlay>
          {activeActivity ? (
            <div className="opacity-80">
              <SalesPipelineCard
                activity={activeActivity}
                stages={STAGE_ORDER}
                stageLabels={STAGE_LABELS}
                isAdmin={isAdmin}
                onStageChange={() => {}}
                onMarkAsWon={() => {}}
                isDragging
              />
            </div>
          ) : activeConsultantId ? (
            <div className="bg-base-100 p-3 rounded shadow-lg opacity-80 border">
              <span className="font-semibold">
                {board.consultants.find(
                  (c) => c.consultant.id === activeConsultantId,
                )?.consultant.name || 'Konsulent'}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create activity modal */}
      {showCreateModal && (
        <CreateActivityModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleActivityCreated}
        />
      )}

      {/* Add consultant modal */}
      {showAddConsultantModal && (
        <AddConsultantModal
          onClose={() => setShowAddConsultantModal(false)}
          onAdded={handleConsultantAdded}
        />
      )}

      {/* Edit activity modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onUpdated={handleActivityUpdated}
        />
      )}

      {/* Edit availability modal */}
      {editingConsultant && (
        <EditAvailabilityModal
          consultant={editingConsultant}
          onClose={() => setEditingConsultant(null)}
          onUpdated={handleAvailabilityUpdated}
        />
      )}

      {/* Mark as won modal */}
      {markAsWonActivity && (
        <MarkAsWonModal
          activity={markAsWonActivity}
          onClose={() => setMarkAsWonActivity(null)}
          onSuccess={() => {
            setMarkAsWonActivity(null)
            loadBoard()
          }}
        />
      )}
    </div>
  )
}
