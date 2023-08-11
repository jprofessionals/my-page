'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import cn from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { MonthCalendar } from '@/components/ui/monthCalendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover'

export function PickDate() {
  const [pickDate, setPickDate] = useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !pickDate && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {pickDate ? format(pickDate, 'PPP') : <span>Ledige datoer</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
      </PopoverContent>
    </Popover>
  )
}
