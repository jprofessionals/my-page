import { useState } from 'react'
import { MonthCalendar } from '@/components/ui/monthCalendar'



export default function MonthOverview(){
    const [date, setDate] = useState<Date | undefined>(new Date())


    return(
        <div className="flex flex-col gap-4 p-4">
        <MonthCalendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
        />
    </div>
    );
}


