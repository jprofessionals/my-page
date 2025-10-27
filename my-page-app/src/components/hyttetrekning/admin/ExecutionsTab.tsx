import { useState } from 'react'
import type { Execution, DrawingStatus } from '@/types/cabinLottery.types'

interface ExecutionsTabProps {
  executions: Execution[]
  publishedExecutionId?: string | null
  publishedByName?: string | null
  drawingStatus: DrawingStatus
  onPublishExecution: (executionId: string) => Promise<void>
}

export default function ExecutionsTab({
  executions,
  publishedExecutionId,
  publishedByName,
  drawingStatus,
  onPublishExecution,
}: ExecutionsTabProps) {
  const [expandedExecutionId, setExpandedExecutionId] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  const sortedExecutions = [...executions].sort(
    (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
  )

  const handlePublish = async (executionId: string) => {
    if (
      !confirm(
        'Er du sikker på at du vil publisere denne trekningen? Dette vil gjøre resultatene synlige for brukerne.'
      )
    ) {
      return
    }

    setIsPublishing(true)
    try {
      await onPublishExecution(executionId)
    } finally {
      setIsPublishing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nb-NO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleExpanded = (executionId: string) => {
    setExpandedExecutionId(expandedExecutionId === executionId ? null : executionId)
  }

  if (executions.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Trekningskjøringer</h2>
        <div className="text-center py-12 text-gray-500">
          Ingen trekninger er kjørt ennå
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Trekningskjøringer</h2>

      <div className="space-y-4">
        {sortedExecutions.map((execution) => {
          const isPublished = execution.id === publishedExecutionId
          const isExpanded = execution.id === expandedExecutionId

          return (
            <div
              key={execution.id}
              className={`border rounded-lg p-4 ${
                isPublished
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-lg">
                      {formatDate(execution.executedAt)}
                    </h3>
                    {isPublished && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Publisert
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">Utført av:</span>{' '}
                      {execution.executedByName || `Bruker #${execution.executedBy}`}
                    </div>
                    <div>
                      <span className="font-medium">Tildelinger:</span>{' '}
                      {execution.allocationCount}
                    </div>
                    {execution.randomSeed !== null &&
                      execution.randomSeed !== undefined && (
                        <div>
                          <span className="font-medium">Seed:</span>{' '}
                          {execution.randomSeed}
                        </div>
                      )}
                    {isPublished && publishedByName && (
                      <div>
                        <span className="font-medium">Publisert av:</span>{' '}
                        {publishedByName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {execution.auditLog && execution.auditLog.length > 0 && (
                    <button
                      onClick={() => toggleExpanded(execution.id)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {isExpanded ? 'Skjul logg' : 'Vis logg'}
                    </button>
                  )}

                  {drawingStatus === 'DRAWN' && (
                    <button
                      onClick={() => handlePublish(execution.id)}
                      disabled={isPublishing || publishedExecutionId !== null}
                      className={`px-4 py-2 text-sm rounded-md ${
                        publishedExecutionId !== null
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50`}
                    >
                      {isPublishing ? 'Publiserer...' : isPublished ? 'Publisert' : 'Publiser'}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && execution.auditLog && execution.auditLog.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-sm mb-2">Trekkingslogg</h4>
                  <div className="bg-gray-900 text-green-400 rounded p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    {execution.auditLog.map((line, index) => (
                      <div key={index} className="whitespace-pre">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
