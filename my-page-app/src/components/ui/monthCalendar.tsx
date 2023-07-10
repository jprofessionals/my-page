import {ChevronLeft, ChevronRight} from 'lucide-react'
import {DayPicker} from 'react-day-picker'
import cn from '@/utils/cn'
import {format} from 'date-fns'
import {Booking} from '@/types'
import {ComponentProps, useEffect, useState} from 'react'
import {buttonVariants} from '@/components/ui/button'
import ApiService from '@/services/api.service'

export type CalendarProps = ComponentProps<typeof DayPicker>

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
      const currentDate = new Date();
      const unformattedStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate())
      const unformattedEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate())
      const year = unformattedStartDate.getFullYear();
      const month = String(unformattedStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(unformattedStartDate.getDate()).padStart(2, '0');
      const startDate = `${year}-${month}-${day}`;
      const year_end = unformattedEndDate.getFullYear();
      const month_end = String(unformattedEndDate.getMonth() + 1).padStart(2, '0');
      const day_end = String(unformattedEndDate.getDate()).padStart(2, '0');
      const endDate = `${year_end}-${month_end}-${day_end}`;
      //Todo: change the start and enddates later once booking is in place so it is more than just a month but six months back and twelve months forward.

      const bookings = await ApiService.getBookings(startDate, endDate)
      setBookings(bookings)
    } catch (error) {
      console.error('Error:', error)
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
        cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent:has([aria-selected]) first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'avatar' }),
          'h-40 w-40 p-0 font-normal aria-selected:opacity-100',
          'flex flex-col items-center justify-start',
          'p-3',
          'tw-bg-opacity: 0',
        ),
        day_selected: 'tw-bg-opacity: 0',
        day_today: 'outline bg-calendar text-accent-foreground',
        day_outside: 'text-muted-foreground opacity-50',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
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
              <div
                key={cabin}
                className="flex gap-3 p-1"
                style={{ width: '140px' }}
              >
                {cabinBookings.map((booking) => {
                  const isYourBooking = yourBookings.some(
                    (yourBooking) => yourBooking.id === booking.id,
                  )
                  return (
                    <span
                      key={booking.id}
                      className={`p-2 w-full h-full rounded-full ${
                        cabinColors[booking.apartment?.cabin_name || '']
                      } text-white ${
                        isYourBooking ? 'border-2 border-black-nav' : ''
                      }`}
                    >
                      {getInitials(booking.employeeName)}
                    </span>
                  )
                })}
              </div>
            ) : (
              <div key={cabin} className="flex gap-3 p-1">
                <span
                  className="p-2 rounded-full height=30"
                  style={{ visibility: 'hidden', height: '30px' }}
                />
              </div>
            )
          })

          return (
            <div>
              <span style={{ fontSize: '20px' }}>{dateCalendar}</span>
              {cabinBookings}
            </div>
          )
        },
      }}
      {...props}
    />
  )
}

MonthCalendar.displayName = 'MonthCalendar'

export { MonthCalendar }
