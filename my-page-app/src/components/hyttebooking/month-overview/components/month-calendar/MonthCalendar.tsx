import { DayPicker, WeekNumber} from 'react-day-picker'
import {add, sub, format} from 'date-fns';
import {Booking, BookingPost, CabinType, InfoBooking, User} from '@/types';
import { no } from "date-fns/locale";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import CalendarWeekLabel from "./calendar-week-label/CalendarWeekLabel";
import CalendarWeekNumber from "./calendar-week-number/CalendarWeekNumber";
import CalendarInfoNotices from "./calendar-info-notices/CalendarInfoNotices";
import CalendarCell from "./calendar-cell/CalendarCell";
import CalendarDate from "./calendar-date/CalendarDate";
import AddBookingModal from "./add-booking-modal/AddBookingModal";
import {useState} from "react";
import classes from "./MonthCalendar.module.css";
import {
    getBookingsOnDayAndCabin,
    getInfoNoticesOnDay
} from "./monthCalendarUtil";


type props = {
    bookings: Booking[];
    infoNotices: InfoBooking[];
    user: User;
}

function MonthCalendar({bookings, infoNotices, user}: props) {
    const style = classes;
    const [startMonth, setStartMonth] = useState<Date>(format(sub(new Date(), { months: 6 }), dateFormat));
    const [endMonth, setEndMonth] = useState<Date>(format(add(new Date(), { months: 12 }), dateFormat));
    const [addBookingPost, setAddBookingPost] = useState<BookingPost | undefined>(undefined);


    const handleMonthChange = (month: Date) => {
        console.log("handleMonthChange: ", month);
        // todo setStartDate, setEndDate
        // todo refetch
    }


    return (
        <>

        <DayPicker
            classNames={{
                month_grid: 'w-full border-collapse',
                week: 'flex justify-between',
                weekday: 'text-muted-foreground rounded-md',
                weekdays: "flex justify-between"
            }}
            locale={no}
            startMonth={startMonth}
            endMonth={endMonth}
            onMonthChange={handleMonthChange}
            showOutsideDays={true}
            fixedWeeks={true}
            showWeekNumber={true}
            weekStartsOn={1}
            components={{
                Day:({day}) => (
                    <div className={style.dayContainer}>
                        <CalendarDate day={day} />
                        <CalendarCell
                            bookings={
                                getBookingsOnDayAndCabin(day, CabinType.stor_leilighet, bookings)
                            }
                            day={day}
                            user={user}
                        />
                        <CalendarCell
                            bookings={
                                getBookingsOnDayAndCabin(day, CabinType.liten_leilighet, bookings)
                            }
                            day={day}
                            user={user}
                        />
                        <CalendarCell
                            bookings={
                                getBookingsOnDayAndCabin(day, CabinType.annekset, bookings)
                            }
                            day={day}
                            user={user}
                        />
                        <CalendarInfoNotices
                            infoNotices={getInfoNoticesOnDay(day, infoNotices)}
                        />
                    </div>
                ),
                WeekNumber: ({week}) => (
                    <WeekNumber week={week}>
                        <CalendarWeekNumber week={week} />
                        <CalendarWeekLabel
                            cabinName={CabinType.stor_leilighet}
                            label={"Stor"}
                        />
                        <CalendarWeekLabel
                            cabinName={CabinType.liten_leilighet}
                            label={"Liten"}
                        />
                        <CalendarWeekLabel
                            cabinName={CabinType.annekset}
                            label={"Anneks"}
                        />
                    </WeekNumber>
                ),
            }}
        />


        </>
    );
}

MonthCalendar.displayName = 'MonthCalendar'

export { MonthCalendar }
