import {
  Apartment,
  Booking,
  BookingPost,
  DrawingPeriod,
  PendingBookingTrain,
  User,
} from '@/types'
import React from 'react'
import { CalendarDay } from 'react-day-picker'
import classes from './CalendarCell.module.css'
import BookingBar from './booking-bar/BookingBar'
import { getIsDayOfWeek } from '@/components/hyttebooking/month-overview/components/month-calendar/calendar-date/calendarDateUtil'
import { dateFormat } from '@/components/hyttebooking/month-overview/monthOverviewUtils'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

type Props = {
  bookings?: Booking[]
  day: CalendarDay
  user?: User
  apartment: Apartment
  onNewBookingClick: (newBooking: BookingPost) => void
  onBookingClick: (booking: Booking) => void
  bookingTrains?: PendingBookingTrain[]
  onBookingTrainClick: (bookingTrain: PendingBookingTrain) => void
}

const CalendarCell = ({
  bookings,
  day,
  user,
  apartment,
  onNewBookingClick,
  onBookingClick,
  bookingTrains,
  onBookingTrainClick,
}: Props) => {
  const style = classes
  const oneDayMS = 86400000
  const isWednesday = getIsDayOfWeek(day) === 3
  const dayString = format(day.date, dateFormat)
  const hasPeriodEnd = (bookings || []).find(
    (booking) => booking?.endDate === dayString,
  )
  const hasPeriodStart = (bookings || []).find(
    (booking) => booking?.startDate === dayString,
  )

  const currentDate = new Date()
  currentDate.setTime(currentDate.getTime() - oneDayMS)
  const isPast = day.date < currentDate
  const showAddButton = !isPast && isWednesday && !hasPeriodStart
  const showAddButtonPlaceholder =
    !isPast && isWednesday && !hasPeriodEnd && !showAddButton

  const handleNewBooking = () => {
    const date = day.date
    const startDate = format(date, dateFormat)
    date.setTime(date.getTime() + oneDayMS * 7)
    const endDate = format(date, dateFormat)

    onNewBookingClick({
      apartmentID: apartment.id,
      startDate: startDate,
      endDate: endDate,
    })
  }

  return (
    <div
      className={`
            ${style.calendarCell}
            ${!isPast && style.calendarCellUpcoming}
            ${isPast && style.calendarCellPast}
        `}
    >
      {showAddButtonPlaceholder && <div className={style.addButtonContainer} />}

      {bookings?.map((booking) => (
        <BookingBar
          key={booking.id}
          day={day}
          user={user}
          booking={booking}
          onBookingClick={onBookingClick}
        />
      ))}

      {bookingTrains?.map((bookingTrain) => (
        <BookingBar
          key={bookingTrain.id}
          day={day}
          user={user}
          booking={{
            id: -1,
            apartment,
            startDate: bookingTrain.startDate,
            endDate: bookingTrain.endDate,
            employeeName: '',
            isPending: true,
          }}
          onBookingClick={() => onBookingTrainClick(bookingTrain)}
        />
      ))}

      {showAddButton && (
        <div className={style.addButtonContainer}>
          <Button size="sm" onClick={handleNewBooking}>
            {' '}
            +{' '}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CalendarCell
