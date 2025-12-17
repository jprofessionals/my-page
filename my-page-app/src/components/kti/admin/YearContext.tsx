'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import ktiService, { KtiRound } from '@/services/kti.service'

interface YearContextType {
  selectedYear: number | null
  setSelectedYear: (year: number | null) => void
  availableYears: number[]
  rounds: KtiRound[]
  currentRound: KtiRound | null
  loading: boolean
}

const YearContext = createContext<YearContextType | undefined>(undefined)

export function YearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [rounds, setRounds] = useState<KtiRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRounds()
  }, [])

  const loadRounds = async () => {
    try {
      const response = await ktiService.getRounds()
      const allRounds = response.data || []
      const sortedRounds = allRounds.sort((a, b) => b.year - a.year)
      setRounds(sortedRounds)

      // Auto-select the most recent year
      if (sortedRounds.length > 0 && !selectedYear) {
        setSelectedYear(sortedRounds[0].year)
      }
    } catch (error) {
      console.error('Failed to load rounds:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableYears = [...new Set(rounds.map(r => r.year))].sort((a, b) => b - a)
  const currentRound = selectedYear
    ? rounds.find(r => r.year === selectedYear) || null
    : null

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        rounds,
        currentRound,
        loading,
      }}
    >
      {children}
    </YearContext.Provider>
  )
}

export function useYear() {
  const context = useContext(YearContext)
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider')
  }
  return context
}
