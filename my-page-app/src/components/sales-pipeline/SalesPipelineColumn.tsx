'use client'

import {
  type SalesActivity,
  type SalesStage,
} from '@/services/salesPipeline.service'
import SalesPipelineCard from './SalesPipelineCard'

interface Props {
  label: string
  activities: SalesActivity[]
  stages: SalesStage[]
  stageLabels: Record<SalesStage, string>
  isAdmin: boolean
  onStageChange: (activityId: number, newStage: SalesStage) => void
  onMarkAsWon: (activityId: number) => void
}

export default function SalesPipelineColumn({
  label,
  activities,
  stages,
  stageLabels,
  isAdmin,
  onStageChange,
  onMarkAsWon,
}: Props) {
  return (
    <div className="flex flex-col min-w-[250px] bg-base-200 rounded-lg">
      {/* Column header */}
      <div className="p-3 border-b border-base-300">
        <h3 className="font-semibold text-center">{label}</h3>
        <div className="text-xs text-gray-500 text-center">
          {activities.length} {activities.length === 1 ? 'aktivitet' : 'aktiviteter'}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        {activities.map((activity) => (
          <SalesPipelineCard
            key={activity.id}
            activity={activity}
            stages={stages}
            stageLabels={stageLabels}
            isAdmin={isAdmin}
            onStageChange={onStageChange}
            onMarkAsWon={onMarkAsWon}
          />
        ))}
        {activities.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-4">
            Ingen aktiviteter
          </div>
        )}
      </div>
    </div>
  )
}
