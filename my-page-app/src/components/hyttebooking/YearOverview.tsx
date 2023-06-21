import {YearCalendar} from "@/components/ui/yearCalendar";
import {useState} from "react";

export default function YearOverview(){
    const [date, setDate] = useState<Date | undefined>(new Date())
    return(
        <div className="flex flex-col gap-4 p-4">
            <YearCalendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                numberOfMonths={12}
            />
        </div>
    );
}