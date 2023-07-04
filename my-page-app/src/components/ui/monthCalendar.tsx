import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import cn from '@/utils/cn'
import { format } from 'date-fns'
import { Booking } from '@/types'
import { ComponentProps, useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import ApiService from '@/services/api.service'

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

  const fetchBookings = async () => {
    try {
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
        caption_label: 'text-sm font-medium',
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
        cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'avatar' }),
          'h-40 w-40 p-0 font-normal aria-selected:opacity-100',
          'flex flex-col items-center justify-start',
          'p-3',
        ),
        day_selected:
          'bg-primary bg-opacity-75 text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
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

          const groupedBookings: { [apartmentId: string]: Booking[] } =
            bookingList.reduce((groups, booking) => {
              const apartmentId = String(booking.apartment?.id)
              if (apartmentId) {
                if (!groups[apartmentId]) {
                  groups[apartmentId] = []
                }
                groups[apartmentId].push(booking)
              }
              return groups
            }, {} as { [apartmentId: string]: Booking[] })

          return (
            <div>
              <span>{dateCalendar}</span>
              {Object.values(groupedBookings).map((group) => (
                <div key={group[0].id} className="flex gap-3 p-1">
                  {group.map((booking) => (
                    <span
                      key={booking.id}
                      className={`p-2 rounded-full ${
                        cabinColors[booking.apartment?.cabin_name || '']
                      } text-white`}
                    >
                      {getInitials(booking.employeeName)}
                    </span>
                  ))}
                </div>
              ))}
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
