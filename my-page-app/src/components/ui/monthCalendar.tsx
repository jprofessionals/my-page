import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import cn from '@/utils/cn'
import {
  add,
  sub,
  format,
  isMonday,
  isSameDay,
  isSunday,
  isWithinInterval,
  isAfter,
} from 'date-fns'
import { Booking, InfoBooking } from '@/types'
import React, { ComponentProps, useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { get } from 'radash'
import {faCircleInfo, faHotel, IconDefinition} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
export type CalendarProps = ComponentProps<typeof DayPicker> & {
  cutOffDateVacancies: string
  bookings: Booking[] | undefined
  yourBookings: Booking[] | undefined
  getBookings: Function
  getInfoNotices: Function
}

const cabinColors: { [key: string]: string } = {
  Annekset: 'bg-teal-annex',
  'Liten leilighet': 'bg-blue-small-appartment',
  'Stor leilighet': 'bg-orange-brand',
}

const cabinColorsOpacity: { [key: string]: string } = {
  Annekset: 'bg-teal-200',
  'Liten leilighet': 'bg-blue-200',
  'Stor leilighet': 'bg-orange-200',
}

function MonthCalendar({
  className,
  classNames,
  showOutsideDays = true,
  cutOffDateVacancies,
  bookings,
  yourBookings,
  getBookings,
  getInfoNotices,
  ...props
}: CalendarProps) {
  const startDateCalendar = format(sub(new Date(), { months: 6 }), 'yyyy-MM-dd')
  const endDateCalendar = format(add(new Date(), { months: 12 }), 'yyyy-MM-dd')

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const handleResize = () => {
    setWindowWidth(window.innerWidth)
  }

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const getInitials = (name: string): string => {
    if (!name) {
      return ''
    }
    const nameParts = name.split(' ')
    const initials = nameParts.map((part) => part[0].toUpperCase()).join('')
    if (windowWidth >= 800) {
      return initials
    } else {
      return ''
    }
  }

  const infoNoticeIcon = faCircleInfo

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 border-none', className)}
      weekStartsOn={1}
      fromDate={new Date(startDateCalendar)}
      toDate={new Date(endDateCalendar)}
      classNames={{
        months:
          'flex flex-col sm:flex-row space-y-10 sm:space-x-10 sm:space-y-0',
        month: 'space-y-4 w-full',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium font-size: xx-large',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex justify-between',
        head_cell: 'text-muted-foreground rounded-md font-normal text-[0.8rem]',
        row: 'flex justify-between mt-2',
        cell: 'text-center text-sm p-0 relative flex-1 [&:has([aria-selected])]:bg-accent:has([aria-selected]) first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'avatar' }),
          'h-full w-full xl:h-50 xl:w-50 p-0 font-normal aria-selected:opacity-100',
          'flex flex-col items-center justify-start',
          'py-3 border-none tw-bg-opacity: 0',
        ),
        day_selected: 'tw-bg-opacity: 0',
        day_today: cn('text-accent-foreground', 'bg-gray-400'),
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="w-4 h-4" />,
        IconRight: () => <ChevronRight className="w-4 h-4" />,
        DayContent: (props) => {
          const cutOffDate = new Date(cutOffDateVacancies)
          const dateCalendar = format(props.date, 'dd')
          const bookingList = getBookings(format(props.date, 'yyyy-MM-dd'))
          const informationNoticeList = getInfoNotices(
            format(props.date, 'yyyy-MM-dd'),
          )

          const cabinOrder = ['Stor leilighet', 'Liten leilighet', 'Annekset']

          const bookingsByCabin: { [key: string]: Booking[] } =
            cabinOrder.reduce((result: { [key: string]: Booking[] }, cabin) => {
              result[cabin] = bookingList.filter(
                (booking: Booking) => booking.apartment?.cabin_name === cabin,
              )
              return result
            }, {})

          const cabinBookings = cabinOrder.map((cabin) => {
            const cabinBookings = bookingsByCabin[cabin] || []
            return cabinBookings.length > 0 ? (
              <div
                key={cabin}
                className="grid grid-cols-2 gap-3 w-full h-4 md:h-8"
              >
                {cabinBookings.map((booking) => {
                  const isYourBooking = yourBookings?.some(
                    (yourBooking: Booking) => yourBooking.id === booking.id,
                  )
                  const { isFirstDay, isLastDay } = getBookingDateInfo(
                    props.date,
                    booking,
                  )
                  return (
                    <span
                      key={booking.id}
                      className={cn(
                        'p-2 text-white tooltip tooltip-top shadow-xl',
                        getCabinBookingStyle(props.date, booking),
                        isYourBooking && 'shadow-y-2',
                        isAfter(add(props.date, { days: 1 }), new Date())
                          ? get(cabinColors, booking.apartment?.cabin_name)
                          : get(
                              cabinColorsOpacity,
                              booking.apartment?.cabin_name,
                            ),
                        'normal-case',
                      )}
                      {...(windowWidth > 800 && {
                        'data-tip': `Reservert av: ${booking.employeeName}`,
                      })}
                    >
                      {(isFirstDay || isLastDay) &&
                        getInitials(booking.employeeName)}
                    </span>
                  )
                })}
              </div>
            ) : (
              <div key={cabin} className="invisible h-4 md:h-8">
                hey
              </div>
            )
          })

          const infoNoticeElements =
            informationNoticeList.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 w-full h-4 md:h-8">
                {informationNoticeList.map((infoNotice: InfoBooking) => {
                  const { isFirstDay } = getInfoNoticeDateInfo(
                    props.date,
                    infoNotice,
                  )
                  return (
                    <span
                      key={infoNotice.id}
                      className={cn(
                        'p-2 text-white tooltip tooltip-top shadow-xl',
                        getInfoNoticeStyle(props.date, infoNotice),
                        'bg-blue-500',
                        'normal-case',
                      )}
                      {...(windowWidth > 800 && {
                        'data-tip': `${infoNotice.description}`,
                      })}
                    >
                      {isFirstDay &&
                        windowWidth >= 800 &&
                        <FontAwesomeIcon
                          icon={infoNoticeIcon}
                          className="w-8"
                        />}
                    </span>
                  )
                })}
              </div>
            ) : (
              <div className="invisible h-4 md:h-8">hey</div>
            )

          return (
            <>
              {dateCalendar}
              {infoNoticeElements}
              {cabinBookings}
              <span
                className={cn(
                  'absolute top-0 left-0 w-full h-full',
                  getCutOffDateStyle(props.date, cutOffDate),
                )}
                aria-hidden="true"
              />
            </>
          )
        },
      }}
      {...props}
    />
  )
}

const getBookingDateInfo = (date: Date, booking: Booking) => {
  const isFirstDay = isSameDay(new Date(date), new Date(booking.startDate))
  const isLastDay = isSameDay(new Date(date), new Date(booking.endDate))
  const isInInterval =
    isWithinInterval(new Date(date), {
      start: new Date(booking.startDate),
      end: new Date(booking.endDate),
    }) &&
    !isFirstDay &&
    !isLastDay
  return { isFirstDay, isLastDay, isInInterval }
}

const getCabinBookingStyle = (date: Date, booking: Booking) => {
  const { isFirstDay, isLastDay, isInInterval } = getBookingDateInfo(
    date,
    booking,
  )
  return cn(
    isFirstDay && 'rounded-l-full col-start-2 border-black-nav',
    isFirstDay && !isSunday(date) && 'md:-mr-2',
    isLastDay && 'rounded-r-full col-start-1 row-start-1',
    isLastDay && !isMonday(date) && 'md:-ml-2',
    isInInterval && 'col-span-2 ',
    isInInterval && !isMonday(date) && 'md:-ml-1',
    isInInterval && !isSunday(date) && 'md:-mr-1',
  )
}
const getCutOffDateStyle = (date: Date, cutOffDate: Date) => {
  const isCutOffDay = isSameDay(date, cutOffDate)
  return isCutOffDay ? 'border-2 border-red-500 rounded-lg' : ''
}

const getInfoNoticeDateInfo = (date: Date, infoNotice: InfoBooking) => {
  const isFirstDay = isSameDay(new Date(date), new Date(infoNotice.startDate))
  const isLastDay = isSameDay(new Date(date), new Date(infoNotice.endDate))
  const isInInterval =
    isWithinInterval(new Date(date), {
      start: new Date(infoNotice.startDate),
      end: new Date(infoNotice.endDate),
    }) &&
    !isFirstDay &&
    !isLastDay
  return { isFirstDay, isLastDay, isInInterval }
}

const getInfoNoticeStyle = (date: Date, infoNotice: InfoBooking) => {
  const { isFirstDay, isLastDay, isInInterval } = getInfoNoticeDateInfo(
    date,
    infoNotice,
  )
  return cn(
    isFirstDay && 'rounded-l-full col-start-2 border-black-nav',
    isFirstDay && !isSunday(date) && 'md:-mr-2',
    isLastDay && 'rounded-r-full col-start-1 row-start-1',
    isLastDay && !isMonday(date) && 'md:-ml-2',
    isInInterval && 'col-span-2 ',
    isInInterval && !isMonday(date) && 'md:-ml-1',
    isInInterval && !isSunday(date) && 'md:-mr-1',
  )
}

MonthCalendar.displayName = 'MonthCalendar'

export { MonthCalendar }
