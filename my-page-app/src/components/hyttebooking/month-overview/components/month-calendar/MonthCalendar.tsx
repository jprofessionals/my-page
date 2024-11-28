import { DayPicker, WeekNumber } from 'react-day-picker'
import { add, sub, format } from 'date-fns'
import {
  Apartment,
  Booking,
  BookingPost,
  CabinType,
  DrawingPeriod,
  InfoBooking,
  PendingBookingTrain,
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
  getInfoNoticesOnDay,
  getBookingTrainsOnDayAndCabin,
} from './monthCalendarUtil'
import ApiService from '@/services/api.service'
import BookingEditModal from '@/components/hyttebooking/month-overview/components/month-calendar/booking-edit-modal/BookingEditModal'
import BookingReadOnlyInfoModal from '@/components/hyttebooking/month-overview/components/month-calendar/booking-read-only-info-Modal/BookingReadOnlyInfoModal'
import DrawingPeriodModal from './drawing-modal/DrawingPeriodModal'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'

type props = {
  bookings: Booking[]
  infoNotices: InfoBooking[]
  pendingBookingTrains: PendingBookingTrain[]
  user?: User
}

function MonthCalendar({
  bookings,
  infoNotices,
  pendingBookingTrains,
  user,
}: props) {
  const queryClient = useQueryClient()

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
  const [allApartments, setAllApartments] = useState<Apartment[]>([])

  useEffect(() => {
    const fetchAllApartments = async () => {
      const response = await ApiService.getAllApartments()
      setAllApartments(response)
    }
    fetchAllApartments()
  }, [])

  const handleMonthChange = (month: Date) => {
    console.log('handleMonthChange: ', month)
    // todo setStartDate, setEndDate
    // todo refetch
  }

  const handleNewBookingCreated = async () => {
    setNewBookingPost(undefined)
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    await queryClient.invalidateQueries({
      queryKey: ['allPendingBookingsAllApartments'],
    })
  }

  const handleEditBookingSaved = async () => {
    setEditBooking(undefined)
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    await queryClient.invalidateQueries({
      queryKey: ['allPendingBookingsAllApartments'],
    })
  }

  const handleInfoBookingClose = () => {
    setInfoBooking(undefined)
  }

  const handleDrawingPeriodClose = async () => {
    setBookingTrain(undefined)
  }

  const handlePerformDrawing = async (bookingTrain: PendingBookingTrain) => {
    try {
      const pendingBookings = bookingTrain.drawingPeriodList.flatMap(
        (drawingPeriod) => drawingPeriod.pendingBookings,
      )
      await ApiService.pickWinnerPendingBooking(pendingBookings)
      toast.success('Trekning fullført')
    } catch {
      toast.error('Trekning feilet')
    }
    setBookingTrain(undefined)
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    await queryClient.invalidateQueries({
      queryKey: ['allPendingBookingsAllApartments'],
    })
  }

  const handleNewBookingCancelled = () => setNewBookingPost(undefined)
  const handleInitNewBooking = (newBooking: BookingPost) =>
    setNewBookingPost(newBooking)
  const handleEditBookingCancelled = () => setEditBooking(undefined)
  const handleInitEditBooking = (booking: Booking) => {
    const isUserBookingOwner = user?.name === booking?.employeeName
    const isUserAdmin = false //user.admin;
    const oneDayMS = 86400000
    const currentDate = new Date()
    currentDate.setTime(currentDate.getTime() - oneDayMS)
    const isPast = false
    const canEdit = (isUserBookingOwner || isUserAdmin) && !isPast

    if (canEdit) {
      console.log('edit ')
      setEditBooking(booking)
    } else {
      console.log('info ')
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
          week: 'flex justify-between',
          weekday: 'text-muted-foreground rounded-md',
          weekdays: 'flex justify-between',
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
            <td className={style.dayContainer}>
              <CalendarDate
                day={day}
                infoNotices={getInfoNoticesOnDay(day, infoNotices)}
              />
              {allApartments.map((apartment) => (
                <CalendarCell
                  key={apartment.id}
                  day={day}
                  user={user}
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
            <WeekNumber week={week}>
              <CalendarWeekNumber week={week} />
              {allApartments.map((apartment) => (
                <CalendarWeekLabel
                  key={apartment.id}
                  cabinName={apartment.cabin_name}
                  label={apartment.cabin_name.split(' ')[0]}
                />
              ))}
            </WeekNumber>
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
