'use client'

import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  type ConsultantWithActivities,
  type SalesActivity,
  type SalesStage,
  type AvailabilityStatus,
  type ClosedReason,
} from '@/services/salesPipeline.service'
import SalesPipelineCard from './SalesPipelineCard'

// Droppable cell component for each stage
function DroppableStageCell({
  stage,
  activities,
  stages,
  stageLabels,
  isAdmin,
  isLastColumn,
  onStageChange,
  onMarkAsWon,
  onCloseActivity,
  onEditActivity,
  rowBgClass,
}: {
  stage: SalesStage
  activities: SalesActivity[]
  stages: SalesStage[]
  stageLabels: Record<SalesStage, string>
  isAdmin: boolean
  isLastColumn: boolean
  onStageChange: (activityId: number, newStage: SalesStage) => void
  onMarkAsWon: (activityId: number) => void
  onCloseActivity: (activityId: number, reason: ClosedReason) => void
  onEditActivity: (activity: SalesActivity) => void
  rowBgClass: string
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
  })

  return (
    <td
      ref={setNodeRef}
      className={`align-top p-3 min-h-[100px] transition-colors ${
        !isLastColumn ? 'border-r-2 border-base-300' : ''
      } ${isOver ? 'bg-primary/10' : rowBgClass}`}
    >
      <div className="flex flex-col gap-2 min-h-[80px]">
        {activities.map((activity) => (
          <SalesPipelineCard
            key={activity.id}
            activity={activity}
            stages={stages}
            stageLabels={stageLabels}
            isAdmin={isAdmin}
            onStageChange={onStageChange}
            onMarkAsWon={onMarkAsWon}
            onClose={onCloseActivity}
            onEdit={onEditActivity}
          />
        ))}
      </div>
    </td>
  )
}

interface Props {
  consultant: ConsultantWithActivities
  stages: SalesStage[]
  stageLabels: Record<SalesStage, string>
  isAdmin: boolean
  onStageChange: (activityId: number, newStage: SalesStage) => void
  onMarkAsWon: (activityId: number) => void
  onCloseActivity: (activityId: number, reason: ClosedReason) => void
  onEditActivity: (activity: SalesActivity) => void
  onEditAvailability: (consultant: ConsultantWithActivities) => void
  onRemoveConsultant: (consultantId: number) => void
  isEvenRow?: boolean
}

const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Ledig nå',
  AVAILABLE_SOON: 'Blir ledig',
  OCCUPIED: 'Opptatt',
}

const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'badge-success',
  AVAILABLE_SOON: 'badge-warning',
  OCCUPIED: 'badge-error',
}

export default function SalesPipelineConsultantRow({
  consultant,
  stages,
  stageLabels,
  isAdmin,
  onStageChange,
  onMarkAsWon,
  onCloseActivity,
  onEditActivity,
  onEditAvailability,
  onRemoveConsultant,
  isEvenRow = false,
}: Props) {
  const { consultant: user, activities, availability } = consultant

  // Sortable hook for row reordering
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `consultant-${user.id}`,
    disabled: !isAdmin,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Group activities by stage
  const activitiesByStage = stages.reduce((acc, stage) => {
    acc[stage] = activities.filter((a) => a.currentStage === stage)
    return acc
  }, {} as Record<SalesStage, SalesActivity[]>)

  const formatAvailableFrom = (date: string | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
    })
  }

  const rowBgClass = isEvenRow ? 'bg-base-100' : 'bg-base-200/30'

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b-2 border-base-300 ${rowBgClass}`}
    >
      {/* Consultant info column (sticky) */}
      <td className={`sticky left-0 z-10 border-r-2 border-base-300 p-3 ${rowBgClass}`}>
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          {isAdmin && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-base-300 rounded mt-1"
              title="Dra for å endre rekkefølge"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <circle cx="9" cy="5" r="1" fill="currentColor" />
                <circle cx="9" cy="12" r="1" fill="currentColor" />
                <circle cx="9" cy="19" r="1" fill="currentColor" />
                <circle cx="15" cy="5" r="1" fill="currentColor" />
                <circle cx="15" cy="12" r="1" fill="currentColor" />
                <circle cx="15" cy="19" r="1" fill="currentColor" />
              </svg>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{user.name || user.email}</span>
            {availability ? (
              <div className="flex items-center gap-2">
                <span className={`badge badge-sm ${AVAILABILITY_COLORS[availability.status]}`}>
                  {AVAILABILITY_LABELS[availability.status]}
                </span>
                {availability.status === 'AVAILABLE_SOON' && availability.availableFrom && (
                  <span className="text-xs text-gray-500">
                    {formatAvailableFrom(availability.availableFrom)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">Ingen status satt</span>
            )}
            {availability?.currentCustomer && (
              <span className="text-xs text-gray-500">
                @ {availability.currentCustomer.name}
              </span>
            )}
            {isAdmin && (
              <div className="flex gap-1 mt-1">
                <button
                  className="btn btn-xs btn-ghost text-primary"
                  onClick={() => onEditAvailability(consultant)}
                >
                  Rediger
                </button>
                <button
                  className="btn btn-xs btn-ghost text-error"
                  onClick={() => user.id && onRemoveConsultant(user.id)}
                  title="Fjern konsulent fra salgstavlen"
                >
                  Fjern
                </button>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Stage columns */}
      {stages.map((stage, index) => (
        <DroppableStageCell
          key={stage}
          stage={stage}
          activities={activitiesByStage[stage]}
          stages={stages}
          stageLabels={stageLabels}
          isAdmin={isAdmin}
          isLastColumn={index === stages.length - 1}
          onStageChange={onStageChange}
          onMarkAsWon={onMarkAsWon}
          onCloseActivity={onCloseActivity}
          onEditActivity={onEditActivity}
          rowBgClass={rowBgClass}
        />
      ))}
    </tr>
  )
}
