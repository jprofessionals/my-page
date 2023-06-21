import React from 'react'
import { Calendar } from '@/components/ui/calendar'



export default function monthOverview(){
    const [date, setDate] = React.useState<Date | undefined>(new Date())


    return(
        <div className="flex flex-col gap-4 p-4">
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
        />
    </div>
    );
}


