'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  type SalesActivity,
  type SalesStage,
  type ClosedReason,
} from '@/services/salesPipeline.service'

interface Props {
  activity: SalesActivity
  stages: SalesStage[]
  stageLabels: Record<SalesStage, string>
  isAdmin: boolean
  onStageChange: (activityId: number, newStage: SalesStage) => void
  onMarkAsWon: (activityId: number) => void
  onClose?: (activityId: number, reason: ClosedReason) => void
  onEdit?: (activity: SalesActivity) => void
  isDragging?: boolean
}

export default function SalesPipelineCard({
  activity,
  stages,
  stageLabels,
  isAdmin,
  onStageChange,
  onMarkAsWon,
  onClose,
  onEdit,
  isDragging: isDraggingProp = false,
}: Props) {
  const [showActions, setShowActions] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingHook,
  } = useDraggable({
    id: activity.id,
    disabled: !isAdmin,
  })

  const isDragging = isDraggingProp || isDraggingHook

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined

  const daysInStage = () => {
    const updatedAt = new Date(activity.updatedAt)
    const now = new Date()
    const diff = Math.floor(
      (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24),
    )
    return diff
  }

  const getTimeColor = () => {
    const days = daysInStage()
    if (days <= 7) return 'border-l-green-500'
    if (days <= 14) return 'border-l-yellow-500'
    return 'border-l-red-500'
  }

  const currentStageIndex = stages.indexOf(activity.currentStage)
  const canMoveForward = currentStageIndex < stages.length - 1
  const canMoveBackward = currentStageIndex > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card bg-base-100 shadow-sm border-l-4 ${getTimeColor()} hover:shadow-md transition-shadow ${
        isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : ''}`}
      onClick={() => !isDragging && setShowActions(!showActions)}
    >
      <div className="card-body p-3">
        {/* Customer/Supplier name */}
        <div className="font-semibold text-sm">
          {activity.customerName || activity.customer?.name || 'Ukjent kunde'}
        </div>

        {/* Supplier if present */}
        {activity.supplierName && (
          <div className="text-xs text-blue-600">
            via {activity.supplierName}
          </div>
        )}

        {/* Title */}
        <div className="text-xs text-gray-600 truncate">{activity.title}</div>

        {/* Price info if available */}
        {(activity.offeredPrice || activity.maxPrice) && (
          <div className="text-xs text-gray-500">
            {activity.offeredPrice && `${activity.offeredPrice} kr/t`}
            {activity.offeredPrice && activity.maxPrice && ' / '}
            {activity.maxPrice && `maks ${activity.maxPrice} kr/t`}
          </div>
        )}

        {/* Days in stage */}
        <div className="text-xs text-gray-400 mt-1">
          {daysInStage()} dager i steget
        </div>

        {/* Offer deadline if set */}
        {activity.offerDeadlineAsap && (
          <div className="text-xs text-orange-600 font-semibold">
            Frist: ASAP
          </div>
        )}
        {!activity.offerDeadlineAsap && activity.offerDeadline && (
          <div className="text-xs text-orange-600">
            Frist:{' '}
            {new Date(activity.offerDeadline).toLocaleDateString('nb-NO', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}

        {/* Expected start date */}
        {activity.expectedStartDate && (
          <div className="text-xs text-gray-500">
            Start:{' '}
            {new Date(activity.expectedStartDate).toLocaleDateString('nb-NO')}
          </div>
        )}

        {/* Interview rounds */}
        {activity.interviewRounds && activity.interviewRounds.length > 0 && (
          <div className="text-xs text-purple-600 font-medium">
            {activity.interviewRounds.length === 1 ? (
              activity.interviewRounds[0].interviewDate ? (
                <>
                  Intervju:{' '}
                  {new Date(
                    activity.interviewRounds[0].interviewDate,
                  ).toLocaleDateString('nb-NO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              ) : (
                <>Intervju planlagt</>
              )
            ) : (
              <>
                Intervju #{activity.interviewRounds.length}
                {(() => {
                  const lastRound =
                    activity.interviewRounds[
                      activity.interviewRounds.length - 1
                    ]
                  return lastRound.interviewDate ? (
                    <>
                      {' '}
                      -{' '}
                      {new Date(lastRound.interviewDate).toLocaleDateString(
                        'nb-NO',
                        {
                          day: 'numeric',
                          month: 'short',
                        },
                      )}
                    </>
                  ) : null
                })()}
              </>
            )}
          </div>
        )}
        {/* Legacy interview date (fallback if no rounds) */}
        {(!activity.interviewRounds || activity.interviewRounds.length === 0) &&
          activity.interviewDate && (
            <div className="text-xs text-purple-600 font-medium">
              Intervju:{' '}
              {new Date(activity.interviewDate).toLocaleDateString('nb-NO', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}

        {/* Admin actions */}
        {isAdmin && showActions && (
          <div className="mt-2 flex flex-wrap gap-1">
            {onEdit && (
              <button
                className="btn btn-xs btn-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(activity)
                }}
                title="Rediger aktivitet"
              >
                Rediger
              </button>
            )}
            {canMoveBackward && (
              <button
                className="btn btn-xs btn-ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onStageChange(activity.id, stages[currentStageIndex - 1])
                }}
                title={`Flytt til ${stageLabels[stages[currentStageIndex - 1]]}`}
              >
                ← Tilbake
              </button>
            )}
            {canMoveForward && (
              <button
                className="btn btn-xs btn-ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onStageChange(activity.id, stages[currentStageIndex + 1])
                }}
                title={`Flytt til ${stageLabels[stages[currentStageIndex + 1]]}`}
              >
                Frem →
              </button>
            )}
            <select
              className="select select-xs select-bordered"
              defaultValue=""
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                const value = e.target.value
                if (value === 'won') {
                  onMarkAsWon(activity.id)
                } else if (value === 'lost' && onClose) {
                  onClose(activity.id, 'OTHER_CANDIDATE_CHOSEN')
                } else if (value === 'cancelled' && onClose) {
                  onClose(activity.id, 'ASSIGNMENT_CANCELLED')
                }
                e.target.value = '' // Reset dropdown
              }}
            >
              <option value="" disabled>
                Avslutt...
              </option>
              <option value="won">Vunnet</option>
              <option value="lost">Tapt</option>
              <option value="cancelled">Kansellert</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
