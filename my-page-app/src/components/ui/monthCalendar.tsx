import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import cn from '@/utils/cn'
import {
  format,
  isMonday,
  isSameDay,
  isSunday,
  isWithinInterval,
} from 'date-fns'
import { Booking } from '@/types'
import { ComponentProps, useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import ApiService from '@/services/api.service'
import { get } from 'radash'

export type CalendarProps = ComponentProps<typeof DayPicker>

const startDate = '2023-06-01'
const endDate = '2023-12-30'

const cabinColors: { [key: string]: string } = {
  Annekset: 'bg-teal-annex',
  'Liten leilighet': 'bg-blue-small-appartment',
  'Stor leilighet': 'bg-orange-brand',
}

function MonthCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [yourBookings, setYourBookings] = useState<Booking[]>([])

  const getYourBookings = async () => {
    try {
      const yourBookings = await ApiService.getBookingsForUser()
      setYourBookings(yourBookings)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    getYourBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const bookings = await ApiService.getBookings(startDate, endDate)
      setBookings(bookings)
    } catch (error) {
      console.error('Error:', error)
      setBookings(dummyBookings)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const getBookings = (date: string) => {
    return bookings.filter(
      (booking) => date >= booking.startDate && date <= booking.endDate,
    )
  }

  const getInitials = (name: string): string => {
    if (!name) {
      return ''
    }
    const nameParts = name.split(' ')
    const initials = nameParts.map((part) => part[0].toUpperCase()).join('')
    return initials
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      weekStartsOn={1}
      classNames={{
        months:
          'flex flex-col sm:flex-row space-y-10 sm:space-x-10 sm:space-y-0',
        month: 'space-y-4 w-screen',
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
        day_today: 'bg-calendar text-accent-foreground',
        day_outside: 'text-muted-foreground opacity-50',
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

          const cabinOrder = ['Stor leilighet', 'Liten leilighet', 'Annekset']

          const bookingsByCabin: { [key: string]: Booking[] } =
            cabinOrder.reduce((result: { [key: string]: Booking[] }, cabin) => {
              result[cabin] = bookingList.filter(
                (booking) => booking.apartment?.cabin_name === cabin,
              )
              return result
            }, {})

          const cabinBookings = cabinOrder.map((cabin) => {
            const cabinBookings = bookingsByCabin[cabin] || []
            return cabinBookings.length > 0 ? (
              <div key={cabin} className="grid grid-cols-2 gap-3 w-full h-8">
                {cabinBookings.map((booking) => {
                  const isYourBooking = yourBookings.some(
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
                        'p-2 text-white tooltip tooltip-top',
                        getCabinBookingStyle(props.date, booking),
                        isYourBooking && 'border-2 border-black-nav',
                        get(cabinColors, booking.apartment?.cabin_name),
                      )}
                      data-tip={`Booket av: ${booking.employeeName}`}
                    >
                      {(isFirstDay || isLastDay) &&
                        getInitials(booking.employeeName)}
                    </span>
                  )
                })}
              </div>
            ) : (
              <div key={cabin} className="h-8" />
            )
          })

          if (bookingList.length > 0) console.log(props, bookingList)

          return (
            <>
              {dateCalendar}
              {cabinBookings}
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
    isFirstDay && 'rounded-l-full col-start-2',
    isFirstDay && !isSunday(date) && '-mr-2',
    isLastDay && 'rounded-r-full col-start-1 row-start-1',
    isLastDay && !isMonday(date) && '-ml-2',
    isInInterval && 'col-span-2',
    isInInterval && !isMonday(date) && '-ml-1',
    isInInterval && !isSunday(date) && '-mr-1',
  )
}

const dummyBookings = [
  {
    startDate: '2023-07-10',
    endDate: '2023-07-13',
    apartment: {
      id: 1,
      cabin_name: 'Annekset',
    },
    employeeName: 'Nils Rars',
  },
  {
    startDate: '2023-07-04',
    endDate: '2023-07-10',
    apartment: {
      id: 1,
      cabin_name: 'Annekset',
    },
    employeeName: 'Eirik Gur',
  },
  {
    startDate: '2023-07-05',
    endDate: '2023-07-11',
    apartment: {
      id: 2,
      cabin_name: 'Liten leilighet',
    },
    employeeName: 'Marius Kluften',
  },
  {
    startDate: '2023-07-08',
    endDate: '2023-07-10',
    apartment: {
      id: 3,
      cabin_name: 'Stor leilighet',
    },
    employeeName: 'Steinar Roger',
  },
  {
    startDate: '2023-07-18',
    endDate: '2023-07-22',
    apartment: {
      id: 1,
      cabin_name: 'Annekset',
    },
    employeeName: 'Anne Hare',
  },
]

MonthCalendar.displayName = 'MonthCalendar'

export { MonthCalendar }
