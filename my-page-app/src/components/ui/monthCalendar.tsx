import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import cn from '@/utils/cn'
import { format } from 'date-fns'
import { Booking } from '@/types'

import ApiService from '@/services/api.service'

import { buttonVariants } from '@/components/ui/button'
import { ComponentProps, useEffect, useState } from 'react'

export type CalendarProps = ComponentProps<typeof DayPicker>

const startDate = '2023-06-01' // Replace with the desired start date
const endDate = '2023-12-30' // Replace with the desired end date

const cabinColors = {
  1: 'bg-orange-brand',
  2: 'bg-blue-small-appartment',
  3: 'bg-teal-annex',
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
      return '' // Return an empty string or handle the case when name is null
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
        ),
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
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
          console.log('Hello')

          console.log(bookingList)
          return (
            <div>
              <span>{dateCalendar}</span>
              {bookingList.length > 0 && (
                <div className="flex gap-3 p-5">
                  {bookingList.map((booking) => (
                    <span
                      key={booking.id} // Add key prop with a unique identifier
                      className={`p-2 rounded-full ${
                        cabinColors[
                          (booking.apartment?.id ||
                            '') as keyof typeof cabinColors
                        ]
                      } text-white`}
                    >
                      {getInitials(booking.employeeName)}
                    </span>
                  ))}
                </div>
              )}
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
