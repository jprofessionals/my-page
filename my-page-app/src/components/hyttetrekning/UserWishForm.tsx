// components/hyttetrekning/UserWishForm.tsx
'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import cabinLotteryService from '@/services/cabinLottery.service'
import UserResults from './UserResults'
import type {
  Drawing,
  Period,
  Wish,
  Apartment,
  WishFormState
} from '@/types/cabinLottery.types'

export default function UserWishForm() {
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const [myWishes, setMyWishes] = useState<Wish[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  const [wishForm, setWishForm] = useState<WishFormState[]>([])

  // Test user selection (for local dev)
  const testUsers = [
    { id: '', name: 'Standard bruker' },
    { id: '1', name: 'Steinar Hansen' },
    { id: '2', name: 'Test User' },
    { id: '3', name: 'Ola Nordmann' },
    { id: '4', name: 'Kari Hansen' },
    { id: '5', name: 'Per Jensen' },
    { id: '6', name: 'Anne Olsen' },
  ]
  const [selectedTestUser, setSelectedTestUser] = useState<string>(() => {
    return localStorage.getItem('testUserId') || ''
  })

  // Update localStorage when test user changes
  const handleTestUserChange = (userId: string): void => {
    setSelectedTestUser(userId)
    if (userId) {
      localStorage.setItem('testUserId', userId)
    } else {
      localStorage.removeItem('testUserId')
    }
    // Reload data with new user
    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [drawingRes, apartmentsRes] = await Promise.all([
        cabinLotteryService.getCurrentDrawing(),
        cabinLotteryService.getApartments()
      ])

      if (!drawingRes.data) {
        setDrawing(null)
        setLoading(false)
        return
      }

      setDrawing(drawingRes.data)
      setApartments(apartmentsRes.data || [])

      const [periodsRes, wishesRes] = await Promise.all([
        cabinLotteryService.getPeriods(drawingRes.data.id),
        cabinLotteryService.getMyWishes(drawingRes.data.id),
      ])

      setPeriods(periodsRes.data)
      setMyWishes(wishesRes.data)

      if (wishesRes.data.length > 0) {
        const formData = wishesRes.data.map((w: Wish) => ({
          periodId: w.periodId,
          priority: w.priority,
          apartmentIds: w.desiredApartmentIds,
          comment: w.comment || '',
        }))

        // Check for duplicate periods in existing wishes
        const periodIds = formData.map(w => w.periodId)
        const hasDuplicates = periodIds.length !== new Set(periodIds).size

        if (hasDuplicates) {
          toast.warning(
            'Du har registrert flere ønsker på samme periode. ' +
            'Dette kan gi uventet resultat i trekningen. ' +
            'Vi anbefaler at du samler alle enheter for én periode i ett ønske.',
            { autoClose: 10000 }
          )
        }

        setWishForm(formData)
      } else {
        // Clear form if no wishes
        setWishForm([])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addWish = (): void => {
    // Find first available period that's not already used
    const usedPeriodIds = new Set(wishForm.map(w => w.periodId))
    const availablePeriod = periods.find(p => !usedPeriodIds.has(p.id))

    setWishForm([
      ...wishForm,
      {
        periodId: availablePeriod?.id || '',
        priority: wishForm.length + 1,
        apartmentIds: [],
        comment: '',
      },
    ])
  }

  // Helper to check if all periods are used
  const allPeriodsUsed = (): boolean => {
    const usedPeriodIds = new Set(wishForm.map(w => w.periodId))
    return periods.length > 0 && usedPeriodIds.size >= periods.length
  }

  const updateWish = (index: number, field: keyof WishFormState, value: unknown): void => {
    const updated = [...wishForm]
    updated[index] = { ...updated[index], [field]: value }
    setWishForm(updated)
  }

  const removeWish = (index: number): void => {
    setWishForm(wishForm.filter((_, i) => i !== index))
  }

  const toggleApartment = (wishIndex: number, apartmentId: number): void => {
    const wish = wishForm[wishIndex]
    const apartmentIds = wish.apartmentIds.includes(apartmentId)
      ? wish.apartmentIds.filter((id) => id !== apartmentId)
      : [...wish.apartmentIds, apartmentId]
    updateWish(wishIndex, 'apartmentIds', apartmentIds)
  }

  const moveApartmentUp = (wishIndex: number, apartmentIndex: number): void => {
    if (apartmentIndex === 0) return
    const wish = wishForm[wishIndex]
    const apartmentIds = [...wish.apartmentIds]
    const temp = apartmentIds[apartmentIndex]
    apartmentIds[apartmentIndex] = apartmentIds[apartmentIndex - 1]
    apartmentIds[apartmentIndex - 1] = temp
    updateWish(wishIndex, 'apartmentIds', apartmentIds)
  }

  const moveApartmentDown = (wishIndex: number, apartmentIndex: number): void => {
    const wish = wishForm[wishIndex]
    if (apartmentIndex === wish.apartmentIds.length - 1) return
    const apartmentIds = [...wish.apartmentIds]
    const temp = apartmentIds[apartmentIndex]
    apartmentIds[apartmentIndex] = apartmentIds[apartmentIndex + 1]
    apartmentIds[apartmentIndex + 1] = temp
    updateWish(wishIndex, 'apartmentIds', apartmentIds)
  }

  const handleSubmit = async (): Promise<void> => {
    if (!drawing) return

    for (const wish of wishForm) {
      if (!wish.periodId || wish.apartmentIds.length === 0) {
        toast.warning('Alle ønsker må ha en periode og minst én enhet valgt')
        return
      }
    }

    setSaving(true)
    try {
      const wishes = wishForm.map((w) => ({
        periodId: w.periodId,
        priority: w.priority,
        desiredApartmentIds: w.apartmentIds,
        comment: w.comment,
      }))

      await cabinLotteryService.submitWishes(drawing.id, wishes)
      await loadData()
      toast.success('Ønsker lagret!')
    } catch (error: any) {
      console.error('Failed to save wishes:', error)

      // Show specific error message from backend if available
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Feil ved lagring av ønsker'

      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laster...</div>
      </div>
    )
  }

  if (!drawing) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Hyttetrekning</h1>
          <p className="text-gray-600">Ingen aktiv hyttetrekning for øyeblikket.</p>
        </div>
      </div>
    )
  }

  // Show results if published
  if (drawing.status === 'PUBLISHED') {
    return <UserResults drawingId={drawing.id} season={drawing.season} periods={periods} />
  }

  // Only show test user selector in development
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Test user selector - Only visible in development */}
        {isDevelopment && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <span className="text-sm font-medium text-yellow-800">🧪 DEV MODE</span>
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test som bruker:
                </label>
                <select
                  value={selectedTestUser}
                  onChange={(e) => handleTestUserChange(e.target.value)}
                  className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {testUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Velg en bruker for å teste ønskeregistrering som forskjellige personer. Fungerer kun i lokal utviklingsmodus.
            </p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{drawing.season}</h1>
          <p className="mt-2 text-gray-600">
            Status:{' '}
            <span
              className={`font-medium ${
                drawing.status === 'OPEN'
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }`}
            >
              {drawing.status === 'OPEN' && 'Åpen for registrering'}
              {drawing.status === 'LOCKED' && 'Låst - venter på trekning'}
              {drawing.status === 'DRAWN' && 'Trukket - venter på publisering'}
            </span>
          </p>
        </div>

        {/* Show wishes if locked/drawn */}
        {['LOCKED', 'DRAWN'].includes(drawing.status) && myWishes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Dine registrerte ønsker</h2>
            <p className="text-yellow-600 mb-4">
              Trekningen er låst. Resultater vil bli publisert snart.
            </p>
            <div className="space-y-3">
              {myWishes.map((wish) => (
                <div key={wish.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm text-gray-500">Prioritet {wish.priority}</span>
                      <h3 className="font-medium">{wish.periodDescription}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {wish.desiredApartmentNames.join(', ')}
                      </p>
                      {wish.comment && (
                        <p className="text-sm text-gray-500 mt-1 italic">{wish.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wish form (only if OPEN) */}
        {drawing.status === 'OPEN' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Registrer dine ønsker</h2>
            <p className="text-gray-600 mb-6">
              Velg perioder og enheter du ønsker, og ranger dem etter prioritet (1 = høyest).
              Du kan få maksimalt 2 tildelinger.
            </p>

            <div className="space-y-6">
              {wishForm.map((wish, index) => {
                const hasNoApartments = wish.apartmentIds.length === 0
                return (
                  <div
                    key={index}
                    className={`rounded-lg p-4 ${
                      hasNoApartments
                        ? 'border-2 border-red-300 bg-red-50'
                        : 'border border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Ønske {index + 1}</h3>
                        {hasNoApartments && (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            ⚠ Må velge minst én enhet
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeWish(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Fjern
                      </button>
                    </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Periode</label>
                      <select
                        value={wish.periodId}
                        onChange={(e) => updateWish(index, 'periodId', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        {periods
                          .filter((period) => {
                            // Show period if it's the currently selected one OR if it's not used in other wishes
                            const isCurrentlySelected = period.id === wish.periodId
                            const isUsedInOtherWish = wishForm.some(
                              (w, i) => i !== index && w.periodId === period.id
                            )
                            return isCurrentlySelected || !isUsedInOtherWish
                          })
                          .map((period) => (
                            <option key={period.id} value={period.id}>
                              {period.description}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Prioritet</label>
                      <input
                        type="number"
                        value={wish.priority}
                        onChange={(e) => updateWish(index, 'priority', parseInt(e.target.value))}
                        min="1"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Ønskede enheter</label>
                    <div className="space-y-2 mb-3">
                      {apartments.map((apt) => (
                        <label key={apt.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={wish.apartmentIds.includes(apt.id)}
                            onChange={() => toggleApartment(index, apt.id)}
                            className="mr-2"
                          />
                          {apt.cabin_name}
                        </label>
                      ))}
                    </div>

                    {wish.apartmentIds.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          Valgte enheter i prioritert rekkefølge:
                        </p>
                        <div className="space-y-2">
                          {wish.apartmentIds.map((aptId, aptIndex) => {
                            const apartment = apartments.find((a) => a.id === aptId)
                            return (
                              <div
                                key={aptId}
                                className="flex items-center justify-between bg-white rounded px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-600 bg-blue-100 rounded px-2 py-1">
                                    {aptIndex + 1}
                                  </span>
                                  <span className="text-sm">{apartment?.cabin_name}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => moveApartmentUp(index, aptIndex)}
                                    disabled={aptIndex === 0}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Flytt opp"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => moveApartmentDown(index, aptIndex)}
                                    disabled={aptIndex === wish.apartmentIds.length - 1}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Flytt ned"
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          <strong>Rekkefølgen bestemmer prioritet:</strong> Nr. 1 = mest foretrukket.
                          Bruk ↑/↓ for å endre rekkefølgen. Hvis alle enheter er like greie, la dem stå som de er.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Kommentar</label>
                    <textarea
                      value={wish.comment}
                      onChange={(e) => updateWish(index, 'comment', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={2}
                      placeholder="Valgfri kommentar..."
                    />
                  </div>
                </div>
                )
              })}
            </div>

            <div className="mt-6">
              <div className="flex gap-4">
                <button
                  onClick={addWish}
                  disabled={allPeriodsUsed()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={allPeriodsUsed() ? 'Alle perioder er allerede i bruk' : ''}
                >
                  Legg til ønske
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={saving || wishForm.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {saving ? 'Lagrer...' : 'Lagre ønsker'}
                </button>
              </div>

              {allPeriodsUsed() && (
                <p className="text-sm text-gray-600 mt-2">
                  Du har allerede lagt til ønsker for alle tilgjengelige perioder.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
