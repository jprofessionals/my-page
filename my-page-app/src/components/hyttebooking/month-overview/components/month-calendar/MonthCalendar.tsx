import { CalendarDay, DayPicker } from 'react-day-picker'
import { add, format, sub } from 'date-fns'
import {
  Apartment,
  Booking,
  BookingPost,
  CabinType,
  DrawingPeriod,
  InfoBooking,
  PendingBookingTrain,
  Settings,
  User,
} from '@/types'
import { nb } from 'date-fns/locale'
import CalendarWeekLabel from './calendar-week-label/CalendarWeekLabel'
import CalendarWeekNumber from './calendar-week-number/CalendarWeekNumber'
import CalendarCell from './calendar-cell/CalendarCell'
import CalendarDate from './calendar-date/CalendarDate'
import BookingAddModal from './booking-add-modal/BookingAddModal'
import { useEffect, useState } from 'react'
import classes from './MonthCalendar.module.css'
import {
  getBookingsOnDayAndCabin,
  getBookingTrainsOnDayAndCabin,
  getInfoNoticesOnDay,
} from './monthCalendarUtil'
import ApiService from '@/services/api.service'
import BookingEditModal from '@/components/hyttebooking/month-overview/components/month-calendar/booking-edit-modal/BookingEditModal'
import BookingReadOnlyInfoModal from '@/components/hyttebooking/month-overview/components/month-calendar/booking-read-only-info-Modal/BookingReadOnlyInfoModal'
import DrawingPeriodModal from './drawing-modal/DrawingPeriodModal'
import { toast } from 'react-toastify'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dateFormat } from '../../monthOverviewUtils'

type props = {
  apartments: Apartment[]
  bookings: Booking[]
  cutoffDate: string
  infoNotices: InfoBooking[]
  pendingBookingTrains: PendingBookingTrain[]
  user: User | null
}

function MonthCalendar({
  apartments,
  bookings,
  cutoffDate,
  infoNotices,
  pendingBookingTrains,
  user,
}: props) {
  const queryClient = useQueryClient()

  console.log('apartments=' + apartments)
  console.log('bookings=' + bookings)
  console.log('cutoffDate=' + cutoffDate)
  console.log('infoNotices=' + infoNotices)
  console.log('pendingBookingTrains=' + pendingBookingTrains)
  console.log('user=' + user)

  const style = classes
  const [startMonth, setStartMonth] = useState<Date>(
    sub(new Date(), { months: 6 }),
  )
  const [endMonth, setEndMonth] = useState<Date>(
    add(new Date(), { months: 12 }),
  )
  const [newBookingPost, setNewBookingPost] = useState<BookingPost | undefined>(
    undefined,
  )
  const [editBooking, setEditBooking] = useState<Booking | undefined>(undefined)
  const [infoBooking, setInfoBooking] = useState<Booking | undefined>(undefined)
  const [bookingTrain, setBookingTrain] = useState<
    PendingBookingTrain | undefined
  >(undefined)

  function isCutoffDate(day: CalendarDay) {
    const dateString = format(day.date, dateFormat)
    return dateString === cutoffDate
  }

  const handleMonthChange = (month: Date) => {
    // todo setStartDate, setEndDate
    // todo refetch
  }

  const handleNewBookingCreated = async () => {
    setNewBookingPost(undefined)
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    await queryClient.invalidateQueries({
      queryKey: ['allPendingBookingTrains'],
    })
  }

  const handleEditBookingSaved = async () => {
    setEditBooking(undefined)
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    await queryClient.invalidateQueries({
      queryKey: ['allPendingBookingTrains'],
    })
  }

  const handleInfoBookingClose = () => {
    setInfoBooking(undefined)
  }

  const handleDrawingPeriodClose = async () => {
    setBookingTrain(undefined)
  }

  const handlePerformDrawing = async (drawingPeriod: DrawingPeriod) => {
    try {
      await ApiService.pickWinnerPendingBooking(drawingPeriod.pendingBookings)
      toast.success('Trekning fullført')
    } catch {
      toast.error('Trekning feilet')
    }
    setBookingTrain(undefined)
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    await queryClient.invalidateQueries({
      queryKey: ['allPendingBookingTrains'],
    })
  }

  const handleNewBookingCancelled = () => setNewBookingPost(undefined)
  const handleInitNewBooking = (newBooking: BookingPost) =>
    setNewBookingPost(newBooking)
  const handleEditBookingCancelled = () => setEditBooking(undefined)
  const handleInitEditBooking = (booking: Booking) => {
    const isUserBookingOwner = user?.name === booking?.employeeName
    const isUserAdmin = user?.admin || false
    const oneDayMS = 86400000
    const currentDate = new Date()
    currentDate.setTime(currentDate.getTime() - oneDayMS)
    const isPast = false
    const canEdit = (isUserBookingOwner || isUserAdmin) && !isPast

    if (canEdit) {
      setEditBooking(booking)
    } else {
      setInfoBooking(booking)
    }
  }

  const handleShowBookingTrain = (bookingTrain: PendingBookingTrain) => {
    setBookingTrain(bookingTrain)
  }

  return (
    <>
      <DayPicker
        classNames={{
          month_grid: 'w-full border-collapse',
          week: 'pt-4',
          weekday: 'text-right pr-3',
        }}
        locale={nb}
        startMonth={startMonth}
        endMonth={endMonth}
        onMonthChange={handleMonthChange}
        showOutsideDays={true}
        fixedWeeks={true}
        showWeekNumber={true}
        weekStartsOn={1}
        components={{
          Day: ({ day }) => (
            <td
              className={`${style.dayContainer} ${isCutoffDate(day) && style.cutoffDate}`}
            >
              <CalendarDate
                day={day}
                infoNotices={getInfoNoticesOnDay(day, infoNotices)}
              />
              {apartments.map((apartment) => (
                <CalendarCell
                  key={apartment.id}
                  day={day}
                  user={user}
                  cutoffDate={cutoffDate}
                  apartment={apartment}
                  onNewBookingClick={handleInitNewBooking}
                  onBookingClick={handleInitEditBooking}
                  bookings={getBookingsOnDayAndCabin(
                    day,
                    apartment.cabin_name as CabinType,
                    bookings,
                  )}
                  bookingTrains={getBookingTrainsOnDayAndCabin(
                    day,
                    apartment.cabin_name as CabinType,
                    pendingBookingTrains,
                  )}
                  onBookingTrainClick={handleShowBookingTrain}
                />
              ))}
            </td>
          ),
          WeekNumber: ({ week }) => (
            <td className={`${style.dayContainer}`}>
              <CalendarWeekNumber week={week} />
              {apartments.map((apartment) => (
                <CalendarWeekLabel
                  key={apartment.id}
                  cabinName={apartment.cabin_name}
                  label={apartment.cabin_name.split(' ')[0]}
                />
              ))}
            </td>
          ),
        }}
      />

      <BookingAddModal
        user={user}
        bookingPost={newBookingPost}
        onCancel={handleNewBookingCancelled}
        onBookingCreated={handleNewBookingCreated}
      />

      <BookingEditModal
        user={user}
        booking={editBooking}
        onCancel={handleEditBookingCancelled}
        onBookingSaved={handleEditBookingSaved}
      />

      <BookingReadOnlyInfoModal
        booking={infoBooking}
        onCancel={handleInfoBookingClose}
      />

      <DrawingPeriodModal
        user={user}
        bookingTrain={bookingTrain}
        onCancel={handleDrawingPeriodClose}
        onPerformDrawing={handlePerformDrawing}
      />
    </>
  )
}

MonthCalendar.displayName = 'MonthCalendar'

export { MonthCalendar }
