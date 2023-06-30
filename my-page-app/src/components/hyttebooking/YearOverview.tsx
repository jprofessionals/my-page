import { YearCalendar } from '@/components/ui/yearCalendar'
import React, { useState } from 'react'

export default function YearOverview() {
  const currentDate = new Date()
  const startOfYear = new Date(currentDate.getFullYear(), 0)
  const [date, setDate] = useState<Date | undefined>(new Date())
  return (
    <div>
      <div className="flex flex-col gap-4 p-4">
        <YearCalendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={startOfYear}
          className="rounded-md border"
          numberOfMonths={12}
          fixedWeeks={true}
          disableNavigation={true}
          pagedNavigation={true}
        />
      </div>
      <div className="flex flex-col gap-3 mt-7">
        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-orange-brand" />
          <span>Booking available</span>
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-blue-small-appartment" />
          Half booked
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-teal-annex" />
          <span>Full booked</span>
        </div>

        <div className="flex gap-2 p-0 mb-10 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-red-not-available" />
          Ikke tilgjengelig - arbeid på hytta
        </div>
      </div>
    </div>
  )
}
