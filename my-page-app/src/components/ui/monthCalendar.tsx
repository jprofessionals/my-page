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
import { Booking, PendingBookingTrain } from '@/types'
import { ComponentProps, useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import ApiService from '@/services/api.service'
import { get } from 'radash'
import { useQuery } from 'react-query'
export type CalendarProps = ComponentProps<typeof DayPicker> & {
  fetchedPendingBookingTrainsAllApartments: any
  getPendingBookingTrainsOnDay: any
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

const pendingBookingCabinColors: { [key: string]: string } = {
  Annekset: 'bg-green-200',
  'Liten leilighet': 'bg-purple-200',
  'Stor leilighet': 'bg-yellow-200',
}

function MonthCalendar({
  className,
  classNames,
  showOutsideDays = true,
  fetchedPendingBookingTrainsAllApartments,
  getPendingBookingTrainsOnDay,
  ...props
}: CalendarProps) {
  const { data: yourBookings } = useQuery<Booking[]>(
    'yourBookingsOutline',
    async () => {
      const yourBookings = await ApiService.getBookingsForUser()
      return yourBookings
    },
  )

  const startDateBookings = format(
    sub(new Date(), { months: 6, days: 7 }),
    'yyyy-MM-dd',
  )
  const endDateBookings = format(
    add(new Date(), { months: 12, days: 7 }),
    'yyyy-MM-dd',
  )
  const startDateCalendar = format(sub(new Date(), { months: 6 }), 'yyyy-MM-dd')
  const endDateCalendar = format(add(new Date(), { months: 12 }), 'yyyy-MM-dd')
  //Todo: implement something to prevent people from booking anything on the last day and forward.

  const { data: bookings } = useQuery<Booking[]>('bookings', async () => {
    const fetchedBookings = await ApiService.getBookings(
      startDateBookings,
      endDateBookings,
    )
    return fetchedBookings
  })

  const getBookings = (date: string) => {
    return (
      bookings?.filter(
        (booking) => date >= booking.startDate && date <= booking.endDate,
      ) || []
    )
  }

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
          'h-full w-full xl:h-40 xl:w-40 p-0 font-normal aria-selected:opacity-100',
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
          const dateCalendar = format(props.date, 'dd')
          const bookingList = getBookings(format(props.date, 'yyyy-MM-dd'))
          const pendingBookingsTrains =
              getPendingBookingTrainsOnDay(
              format(props.date, 'yyyy-MM-dd'),
            )

          const cabinOrder = ['Stor leilighet', 'Liten leilighet', 'Annekset']

          const bookingsByCabin: { [key: string]: Booking[] } =
            cabinOrder.reduce((result: { [key: string]: Booking[] }, cabin) => {
              result[cabin] = bookingList.filter(
                (booking) => booking.apartment?.cabin_name === cabin,
              )
              return result
            }, {})

          const pendingBookingsByCabin: {
            [key: string]: PendingBookingTrain[]
          } = cabinOrder.reduce(
            (result: { [key: string]: PendingBookingTrain[] }, cabin) => {
              result[cabin] = pendingBookingsTrains.filter(
                (pendingBookingTrain: PendingBookingTrain) =>
                  pendingBookingTrain.apartment.cabin_name === cabin,
              )
              return result
            },
            {},
          )

          const renderBookingsAndPendingBookings = (cabin: string) => {
            const cabinBookings = bookingsByCabin[cabin] || []
            const cabinPendingBookingTrains =
              pendingBookingsByCabin[cabin] || []
            const combinedEntries: (Booking | PendingBookingTrain)[] = [
              ...cabinBookings,
              ...cabinPendingBookingTrains,
            ]

            if (combinedEntries.length === 0) {
              return (
                <div
                  key={cabin}
                  className="grid grid-cols-2 gap-3 w-full h-4 md:h-8"
                >
                  {cabinPendingBookingTrains.map((pendingBookingTrain) => (
                    <span
                      key={pendingBookingTrain.id}
                      className={cn(
                        getPendingBookingCabinStyle(
                          props.date,
                          pendingBookingTrain,
                        ),
                        isAfter(add(props.date, { days: 1 }), new Date())
                          ? get(
                              pendingBookingCabinColors,
                              pendingBookingTrain.apartment.cabin_name,
                            )
                          : null,
                        'normal-case',
                      )}
                    ></span>
                  ))}
                </div>
              )
            }

            return (
              <div
                key={cabin}
                className="grid grid-cols-2 gap-3 w-full h-4 md:h-8"
              >
                {combinedEntries.map((entry) => {
                  if ('employeeName' in entry) {
                    const booking = entry as Booking
                    const isYourBooking = yourBookings?.some(
                      (yourBooking) => yourBooking.id === booking.id,
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
                  } else {
                    const pendingBookingTrain = entry as PendingBookingTrain
                    return (
                      <span
                        key={pendingBookingTrain.id}
                        className={cn(
                          getPendingBookingCabinStyle(
                            props.date,
                            pendingBookingTrain,
                          ),
                          isAfter(add(props.date, { days: 1 }), new Date())
                            ? get(
                                pendingBookingCabinColors,
                                pendingBookingTrain.apartment.cabin_name,
                              )
                            : null,
                          'normal-case',
                        )}
                      ></span>
                    )
                  }
                })}
              </div>
            )
          }

          return (
            <>
              {dateCalendar}
              {renderBookingsAndPendingBookings('Stor leilighet')}
              {renderBookingsAndPendingBookings('Liten leilighet')}
              {renderBookingsAndPendingBookings('Annekset')}
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

const getPendingBookingDateInfo = (
  date: Date,
  pendingBookingTrain: PendingBookingTrain,
) => {
  const isFirstDay = isSameDay(
    new Date(date),
    new Date(pendingBookingTrain.startDate),
  )
  const isLastDay = isSameDay(
    new Date(date),
    new Date(pendingBookingTrain.endDate),
  )
  const isInInterval =
    isWithinInterval(new Date(date), {
      start: new Date(pendingBookingTrain.startDate),
      end: new Date(pendingBookingTrain.endDate),
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

const getPendingBookingCabinStyle = (
  date: Date,
  pendingBookingTrain: PendingBookingTrain,
) => {
  const { isFirstDay, isLastDay, isInInterval } = getPendingBookingDateInfo(
    date,
    pendingBookingTrain,
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
