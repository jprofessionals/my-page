// components/hyttetrekning/UserResults.tsx
'use client'

import { useEffect, useState } from 'react'
import cabinLotteryService from '@/services/cabinLottery.service'
import type { Allocation, Period } from '@/types/cabinLottery.types'

interface UserResultsProps {
  drawingId: string
  season: string
  periods: Period[]
}

export default function UserResults({ drawingId, season, periods }: UserResultsProps) {
  const [myAllocations, setMyAllocations] = useState<Allocation[]>([])
  const [allAllocations, setAllAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingId])

  const loadResults = async () => {
    try {
      const [myRes, allRes] = await Promise.all([
        cabinLotteryService.getMyAllocations(drawingId),
        cabinLotteryService.getAllAllocations(drawingId),
      ])
      setMyAllocations(myRes.data ?? [])
      setAllAllocations(allRes.data ?? [])
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laster...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{season}</h1>
          <p className="mt-2 text-purple-600 font-medium">Resultater publisert</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mine tildelinger</h2>
          
          {myAllocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Du fikk dessverre ingen tildelinger denne gangen.
            </div>
          ) : (
            <div className="space-y-4">
              {myAllocations.map((allocation) => (
                <div key={allocation.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{allocation.apartmentName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {allocation.periodDescription}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(allocation.startDate).toLocaleDateString('nb-NO')} -{' '}
                        {new Date(allocation.endDate).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                    <span className="text-xs text-green-700 font-medium">✓ Tildelt</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
              Vis alle tildelinger
            </summary>
            <div className="mt-4 space-y-4">
              {periods.map((period) => {
                const periodAllocs = allAllocations.filter((a) => a.periodId === period.id)
                return (
                  <div key={period.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">{period.description}</h4>
                    {periodAllocs.length === 0 ? (
                      <p className="text-sm text-gray-500">Ingen tildelinger</p>
                    ) : (
                      <div className="space-y-1 text-sm">
                        {periodAllocs.map((alloc) => (
                          <div key={alloc.id} className="flex justify-between">
                            <span className="font-medium">{alloc.apartmentName}</span>
                            <span className="text-gray-600">{alloc.userName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
