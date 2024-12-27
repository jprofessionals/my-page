import {
  Apartment,
  Booking,
  BookingPost,
  PendingBookingTrain,
  User,
} from '@/types'
import React, { useMemo } from 'react'
import { CalendarDay } from 'react-day-picker'
import classes from './CalendarCell.module.css'
import BookingBar, { BarType } from './booking-bar/BookingBar'
import { dateFormat } from '@/components/hyttebooking/month-overview/monthOverviewUtils'
import {
  format,
  isBefore,
  startOfDay,
  nextWednesday,
  isToday as isTodayFn,
  isWednesday as isWednesdayFn,
} from 'date-fns'
import { Button } from '@/components/ui/button'

type Props = {
  bookings: Booking[]
  day: CalendarDay
  user: User | null
  cutoffDate: string
  apartment: Apartment
  onNewBookingClick: (newBooking: BookingPost) => void
  onBookingClick: (booking: Booking) => void
  bookingTrains: PendingBookingTrain[]
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
  return booking.startDate === today
}

function isEnd(today: string, booking: Booking | PendingBookingTrain) {
  return booking.endDate === today
}

function getLabel(booking: Booking) {
  return booking.employeeName
    .split(/\s/)
    .map((name) => name.slice(0, 1))
    .join('')
}

function getBarType(booking: Booking, user: User) {
  if (booking.employeeName === user.name) {
    return BarType.mine
  } else {
    return BarType.theirs
  }
}

const CalendarCell = ({
  bookings,
  day,
  user,
  cutoffDate,
  apartment,
  onNewBookingClick,
  onBookingClick,
  bookingTrains,
  onBookingTrainClick,
}: Props) => {
  const style = classes
  const isWednesday = isWednesdayFn(day.date)
  const dayString = format(day.date, dateFormat)
  const isBeforeCutoffDate = dayString < cutoffDate
  const hasPeriodStart = bookings.find(
    (booking) => booking?.startDate === dayString,
  )
  const hasBooking = bookings.find(
    (booking) => booking?.startDate < dayString && booking?.endDate > dayString,
  )

  const today = startOfDay(new Date())
  const isToday = isTodayFn(day.date)
  const isPast = isBefore(day.date, today)
  const showAddButton =
    !isPast && isBeforeCutoffDate && !hasPeriodStart && !hasBooking && (isWednesday || isToday)

  const handleNewBooking = () => {
    const startDate = format(day.date, dateFormat)
    const endDate = format(nextWednesday(day.date), dateFormat)

    onNewBookingClick({
      apartmentID: apartment.id,
      startDate: startDate,
      endDate: endDate,
    })
  }

  const bars = useMemo(() => {
    const bars: Bar[] = []
    if (bookings && user) {
      bars.push(
        ...bookings.map((booking) => ({
          key: `booking-${booking.id}`,
          isStart: isStart(dayString, booking),
          isEnd: isEnd(dayString, booking),
          label: getLabel(booking),
          barType: getBarType(booking, user),
          onClick: () => onBookingClick(booking),
        })),
      )
    }
    if (bookingTrains && user) {
      bars.push(
        ...bookingTrains.map((bookingTrain) => ({
          key: `bookingTrain-${bookingTrain.id}`,
          isStart: isStart(dayString, bookingTrain),
          isEnd: isEnd(dayString, bookingTrain),
          barType: BarType.train,
          onClick: () => onBookingTrainClick(bookingTrain),
        })),
      )
      bars.push()
    }
    return bars.sort((a: Bar, b: Bar) => (a.isEnd ? -1 : b.isEnd ? 1 : 0))
  }, [
    user,
    bookings,
    bookingTrains,
    onBookingClick,
    onBookingTrainClick,
    dayString,
  ])

  return (
    <div
      className={`
            ${style.calendarCell}
            ${!isPast && style.calendarCellUpcoming}
            ${isPast && style.calendarCellPast}
        `}
    >
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
