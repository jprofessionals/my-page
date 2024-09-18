import { DayPicker, WeekNumber} from 'react-day-picker'
import {add, sub, format} from 'date-fns';
import {Apartment, Booking, BookingPost, CabinType, InfoBooking, User} from '@/types';
import { no } from "date-fns/locale";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import CalendarWeekLabel from "./calendar-week-label/CalendarWeekLabel";
import CalendarWeekNumber from "./calendar-week-number/CalendarWeekNumber";
import CalendarInfoNotices from "./calendar-info-notices/CalendarInfoNotices";
import CalendarCell from "./calendar-cell/CalendarCell";
import CalendarDate from "./calendar-date/CalendarDate";
import AddBookingModal from "./add-booking-modal/AddBookingModal";
import {useEffect, useState} from "react";
import classes from "./MonthCalendar.module.css";
import {
    getBookingsOnDayAndCabin,
    getInfoNoticesOnDay
} from "./monthCalendarUtil";
import ApiService from "@/services/api.service";


type props = {
    bookings: Booking[];
    infoNotices: InfoBooking[];
    user: User;
}

function MonthCalendar({bookings, infoNotices, user}: props) {
    const style = classes;
    const [startMonth, setStartMonth] = useState<Date>(format(sub(new Date(), { months: 6 }), dateFormat));
    const [endMonth, setEndMonth] = useState<Date>(format(add(new Date(), { months: 12 }), dateFormat));
    const [newBookingPost, setNewBookingPost] = useState<BookingPost | undefined>(undefined);
    const [allApartments, setAllApartments] = useState<Apartment[]>([]);

    useEffect(() => {
        const fetchAllApartments = async () => {
            const response = await ApiService.getAllApartments();
            setAllApartments(response);
        };
        fetchAllApartments();
    }, []);



    const handleMonthChange = (month: Date) => {
        console.log("handleMonthChange: ", month);
        // todo setStartDate, setEndDate
        // todo refetch
    }

    const handleNewBookingCreated = () => {
        setNewBookingPost(undefined);
        // todo refetch all.
    }

    const handleNewBookingCancelled = () => {
        setNewBookingPost(undefined);
    }

    const handleInitNewBooking = (newBooking: BookingPost) => {
        setNewBookingPost(newBooking);
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
                            {allApartments.map(apartment => (
                                <CalendarCell
                                    day={day}
                                    user={user}
                                    apartment={apartment}
                                    onNewBookingClick={handleInitNewBooking}
                                    bookings={
                                        getBookingsOnDayAndCabin(
                                            day,
                                            apartment.cabin_name as CabinType,
                                            bookings
                                        )
                                    }
                                />
                            ))}
                            <CalendarInfoNotices
                                infoNotices={getInfoNoticesOnDay(day, infoNotices)}
                            />
                        </div>
                    ),
                    WeekNumber: ({week}) => (
                        <WeekNumber week={week}>
                            <CalendarWeekNumber week={week} />
                            {allApartments.map(apartment => (
                                <CalendarWeekLabel
                                    cabinName={apartment.cabin_name}
                                    label={apartment.cabin_name.split(" ")[0]}
                                />
                            ))}
                        </WeekNumber>
                    ),
                }}
            />

            <AddBookingModal
                user={user}
                bookingPost={newBookingPost}
                onCancel={handleNewBookingCancelled}
                onBookingCreated={handleNewBookingCreated}
            />

        </>
    );
}

MonthCalendar.displayName = 'MonthCalendar'

export { MonthCalendar }
