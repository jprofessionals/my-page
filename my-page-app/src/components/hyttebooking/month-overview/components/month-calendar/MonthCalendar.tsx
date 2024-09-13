import {Button, CalendarDay, Chevron, DayPicker, getDefaultClassNames, WeekNumber} from 'react-day-picker'
 import {
    add,
    sub,
    format
} from 'date-fns'
import {Booking, CalendarProps, User} from '@/types'
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import CalendarBooking from "@/components/hyttebooking/month-overview/components/month-calendar/CalendarBooking";
import CalendarWeekLabel from "@/components/hyttebooking/month-overview/components/month-calendar/CalendarWeekLabel";
import { no } from "date-fns/locale";


type Props = {
    bookings: Booking[];
    user: User;
}

function MonthCalendar({
    bookings, user
}: CalendarProps) {
    const startDateCalendar = format(sub(new Date(), { months: 6 }), dateFormat);
    const endDateCalendar = format(add(new Date(), { months: 12 }), dateFormat);

    const getIsToday = (day: CalendarDay): boolean => {
        function sameDay(d1, d2) {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        }

        return sameDay(day.date, new Date());
     }

    const getBooking = (day: CalendarDay, cabinName: string): Booking | undefined => {
        const all = bookings as Booking[] || [];
        const dateString = format(day.date, dateFormat);

        return all.find((booking: Booking) => (
            dateString >= booking?.startDate &&
            dateString <= booking?.endDate &&
            cabinName === booking?.apartment.cabin_name
        ));
    }


    return (
            <DayPicker
                locale={no}
                startMonth={startDateCalendar}
                endMonth={endDateCalendar}
                showOutsideDays={true}
                fixedWeeks={true}
                showWeekNumber={true}
                weekStartsOn={1}
                components={{
                    Day:({day}) => (
                        <div style={{width: "100%", height: "9rem"}}>
                            <div style={{ padding: "0.2rem 0.8rem"}}>
                                {getIsToday(day) ?
                                    <div style={{ backgroundColor: "#dc2323",  color: "#ffffff", borderRadius: "1rem", width: "1.5rem", paddingLeft: "0.2rem"}}>
                                        {day.date.getDate()}
                                    </div>
                                    :
                                    <>
                                        {day.date.getDate()}
                                    </>
                                }
                            </div>
                            <CalendarBooking booking={ getBooking(day, "Stor leilighet")} day={day} user={user}/>
                            <CalendarBooking booking={ getBooking(day, "Liten leilighet")} day={day} user={user}/>
                            <CalendarBooking booking={ getBooking(day, "Annekset")} day={day} user={user}/>
                        </div>
                    ),
                    WeekNumber: ({week}) => (
                        <WeekNumber week={week}>
                            <div style={{padding: "0.2rem 0.8rem", width: "5rem", color: "silver", marginTop: "-1px"}}>
                                {week.weekNumber}
                            </div>
                            <CalendarWeekLabel cabinName={"Stor leilighe"} label={"Stor"} />
                            <CalendarWeekLabel cabinName={"Liten leilighe"} label={"Liten"} />
                            <CalendarWeekLabel cabinName={"Annekset"} label={"Anneks"}/>
                        </WeekNumber>
                    )
                }}
                classNames={{
                    month_grid: 'w-full border-collapse',
                    week: 'flex justify-between',
                    weekday: 'text-muted-foreground rounded-md',
                    weekdays: "flex justify-between"
                }}
            />
    );
}






MonthCalendar.displayName = 'MonthCalendar'

export { MonthCalendar }
