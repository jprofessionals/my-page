import { YearCalendar } from '@/components/ui/yearCalendar'
import { useState } from 'react'

export default function YearOverview() {
  const currentDate = new Date()
  const startOfYear = new Date(currentDate.getFullYear(), 0)
  const [date, setDate] = useState<Date | undefined>(new Date())
  return (
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
  )
}
