import {Apartment, Booking, BookingPost, PendingBookingTrain, User,} from '@/types'
import React, {useMemo} from 'react'
import {CalendarDay} from 'react-day-picker'
import classes from './CalendarCell.module.css'
import BookingBar, {BarType} from './booking-bar/BookingBar'
import {
  getIsDayOfWeek
} from '@/components/hyttebooking/month-overview/components/month-calendar/calendar-date/calendarDateUtil'
import {dateFormat} from '@/components/hyttebooking/month-overview/monthOverviewUtils'
import {format} from 'date-fns'
import {Button} from '@/components/ui/button'

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

type Bar = {
  key: string
  isStart: boolean
  isEnd: boolean
  label?: string
  barType: BarType
  onClick: () => void
}

function isStart(today: string, booking: Booking | PendingBookingTrain) {
  return booking.startDate === today;
}

function isEnd(today: string, booking: Booking | PendingBookingTrain) {
  return booking.endDate === today;
}

function getLabel(booking: Booking) {
  return booking.employeeName
    .split(/\s/)
    .map((name) => name.slice(0, 1))
    .join('');
}

function getBarType(booking: Booking, user: User) {
  if (booking.employeeName === user.name) {
    return BarType.mine;
  } else {
    return BarType.theirs;
  }
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
  const today = format(currentDate, dateFormat)
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

  const bars = useMemo(
    () => {
      const bars: Bar[] = [];
      if (bookings && user) {
        bars.push(...bookings.map((booking) => ({
          key: `booking-${booking.id}`,
          isStart: isStart(dayString, booking),
          isEnd: isEnd(dayString, booking),
          label: getLabel(booking),
          barType: getBarType(booking, user),
          onClick: () => onBookingClick(booking)
        })))
      }
      if (bookingTrains && user) {
        bars.push(...bookingTrains.map((bookingTrain) => ({
          key: `bookingTrain-${bookingTrain.id}`,
          isStart: isStart(dayString, bookingTrain),
          isEnd: isEnd(dayString, bookingTrain),
          barType: BarType.train,
          onClick: () => onBookingTrainClick(bookingTrain)
        })))
        bars.push()
      }
      return bars.sort((a: Bar, b: Bar) => a.isEnd ? -1 : b.isEnd ? 1 : 0);
    },
    [user, bookings, bookingTrains, onBookingClick, onBookingTrainClick, dayString]
  )

  return (
    <div
      className={`
            ${style.calendarCell}
            ${!isPast && style.calendarCellUpcoming}
            ${isPast && style.calendarCellPast}
        `}
    >
      {showAddButtonPlaceholder && <div className={style.addButtonContainer} />}

      {bars?.map((bar) => (
        <BookingBar
          key={bar.key}
          isStart={bar.isStart}
          isEnd={bar.isEnd}
          label={bar.label}
          barType={bar.barType}
          onClick={bar.onClick}
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
