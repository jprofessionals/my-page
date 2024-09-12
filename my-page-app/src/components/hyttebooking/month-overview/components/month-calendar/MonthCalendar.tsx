import {Button, Chevron, DayPicker, getDefaultClassNames, WeekNumber} from 'react-day-picker'
 import {
    add,
    sub,
    format,
    isMonday,
    isSameDay,
    isSunday,
    isWithinInterval
} from 'date-fns'
import {Booking, PendingBookingTrain, InfoBooking, CalendarProps} from '@/types'
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";

function MonthCalendar({
    bookings
}: CalendarProps) {
    const startDateCalendar = format(sub(new Date(), { months: 6 }), dateFormat);
    const endDateCalendar = format(add(new Date(), { months: 12 }), dateFormat);

    console.log("bookings:", bookings);

    const getBooking = (date: Date, cabinName: string): Booking | undefined => {
        const all = bookings as Booking[] || [];
        const dateString = format(date, dateFormat);
        return all.find((booking: Booking) => (
            dateString >= booking.startDate &&
            dateString <= booking.endDate &&
            cabinName === booking.apartment.cabin_name
        ));
    }


    return (
            <DayPicker
                startMonth={startDateCalendar}
                endMonth={endDateCalendar}
                showOutsideDays={true}
                fixedWeeks={true}
                showWeekNumber={true}
                weekStartsOn={1}
                components={{
                    Day:({day}) => (
                        <div style={{border: "1px solid pink", width: "100%", height: "9rem"}}>
                            {day.date.getDate()}
                            <div>
                                Stor: {getBooking(day.date, "Stor leilighet")?.id}
                            </div>
                            <div>
                                Liten: {getBooking(day.date, "Liten leilighet")?.id}
                            </div>
                            <div>
                                Anneks: {getBooking(day.date, "Anneks")?.id}
                            </div>
                        </div>
                    ),
                    WeekNumber: ({week}) => (
                        <WeekNumber week={week}>
                        <div style={{width: "5rem", color: "silver"}}>Uke {week.weekNumber}</div>
                            <br/>
                            <div style={{width: "5rem", color: "silver"}}>Stor</div>
                            <div style={{width: "5rem", color: "silver"}}>Liten</div>
                            <div style={{width: "5rem", color: "silver"}}>Anneks</div>
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
