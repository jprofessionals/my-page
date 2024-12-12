import React, { useMemo } from 'react'
import { MonthCalendar } from './components/month-calendar/MonthCalendar'
import ApiService from '@/services/api.service'
import { Apartment, Booking, InfoBooking, PendingBookingTrain } from '@/types'
import { useAuthContext } from '@/providers/AuthProvider'
import { add, format, sub } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import getSetting from '@/utils/getSetting'
import { byIdDesc, dateFormat } from './monthOverviewUtils'

export default function MonthOverview() {
  const { user, settings } = useAuthContext()

  const startDateBookings = format(
    sub(new Date(), { months: 6, days: 7 }),
    dateFormat,
  )
  const endDateBookings = format(
    add(new Date(), { months: 12, days: 7 }),
    dateFormat,
  )

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['bookings'],
    initialData: [],
    queryFn: async () => {
      const fetchedBookings: Booking[] = await ApiService.getBookings(
        startDateBookings,
        endDateBookings,
      )
      return fetchedBookings
    },
  })

  const { data: infoNotices } = useQuery<InfoBooking[]>({
    queryKey: ['allInfoNotices'],
    initialData: [],
    queryFn: async () => {
      const infoNotices: InfoBooking[] = await ApiService.getInfoNotices(
        startDateBookings,
        endDateBookings,
      )
      return infoNotices
    },
  })

  const { data: allPendingBookingTrains } = useQuery<PendingBookingTrain[]>({
    queryKey: ['allPendingBookingTrains'],
    initialData: [],
    queryFn: async () => {
      return ApiService.getAllPendingBookingTrainsForAllApartments()
    },
  })

  const { data: allApartments } = useQuery<Apartment[]>({
    queryKey: ['allApartments'],
    initialData: [],
    queryFn: async () => {
      return ApiService.getAllApartments()
    },
  })

  const cutOffDateVacancies = useMemo(() => {
    return getSetting(settings, 'CUTOFF_DATE_VACANCIES')
  }, [settings])

  return (
    <div className="flex flex-col overflow-scroll gap-4 p-4">
      {cutOffDateVacancies == null ? (
        'Fant ikke innstilling for siste reserverbare dato'
      ) : (
        <div>
          <MonthCalendar
            apartments={allApartments.toSorted(byIdDesc)}
            bookings={bookings}
            cutoffDate={cutOffDateVacancies}
            pendingBookingTrains={allPendingBookingTrains}
            infoNotices={infoNotices}
            user={user}
          />
        </div>
      )}
    </div>
  )
}
