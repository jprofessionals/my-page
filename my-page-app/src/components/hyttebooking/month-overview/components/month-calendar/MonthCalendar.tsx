import {CalendarDay, DayPicker, WeekNumber} from 'react-day-picker'
import {add, sub, format, isBefore, isAfter} from 'date-fns';
import {Booking, InfoBooking, User} from '@/types';
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import CalendarBooking from "@/components/hyttebooking/month-overview/components/month-calendar/CalendarBooking";
import CalendarWeekLabel from "@/components/hyttebooking/month-overview/components/month-calendar/CalendarWeekLabel";
import { no } from "date-fns/locale";
import CalendarDate from "@/components/hyttebooking/month-overview/components/month-calendar/CalendarDate";
import CalendarWeekNumber from "@/components/hyttebooking/month-overview/components/month-calendar/CalendarWeekNumber";
import CalendarInfoNotices
    from "@/components/hyttebooking/month-overview/components/month-calendar/CalendarInfoNotices";


type props = {
    bookings: Booking[];
    infoNotices: InfoBooking[];
    user: User;
}

function MonthCalendar({bookings, infoNotices, user}: props) {
    const startDateCalendar = format(sub(new Date(), { months: 6 }), dateFormat);
    const endDateCalendar = format(add(new Date(), { months: 12 }), dateFormat);

    const getBooking = (day: CalendarDay, cabinName: string): Booking | undefined => {
        const dateString = format(day.date, dateFormat);
        return bookings.find((booking: Booking) => (
            dateString >= booking?.startDate &&
            dateString <= booking?.endDate &&
            cabinName === booking?.apartment.cabin_name
        ));
    }

    const getInfoNoticesOnDay = (day: CalendarDay) => infoNotices.filter(
        (infoNotice) => day.date >= infoNotice.startDate && day.date <= infoNotice.endDate) || [];

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
                    <div style={{width: "100%", height: "10rem"}}>
                        <CalendarDate day={day} />
                        <CalendarBooking
                            booking={getBooking(day, "Stor leilighet")}
                            day={day}
                            user={user}
                        />
                        <CalendarBooking
                            booking={getBooking(day, "Liten leilighet")}
                            day={day}
                            user={user}
                        />
                        <CalendarBooking
                            booking={getBooking(day, "Annekset")}
                            day={day}
                            user={user}
                        />
                        <CalendarInfoNotices
                            infoNotices={getInfoNoticesOnDay(day)}
                        />
                    </div>
                ),
                WeekNumber: ({week}) => (
                    <WeekNumber week={week}>
                        <CalendarWeekNumber week={week} />
                        <CalendarWeekLabel
                            cabinName={"Stor leilighe"}
                            label={"Stor"}
                        />
                        <CalendarWeekLabel
                            cabinName={"Liten leilighe"}
                            label={"Liten"}
                        />
                        <CalendarWeekLabel
                            cabinName={"Annekset"}
                            label={"Anneks"}
                        />
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
