import {Booking, User} from "@/types";
import React from "react";
import {CalendarDay} from "react-day-picker";
import classes from "./CalendarCell.module.css";
import BookingBar from "./booking-bar/BookingBar";

type Props = {
    bookings?: Booking[];
    day: CalendarDay;
    user: User;
}

const CalendarCell = ({ bookings, day, user }: Props)  => {
    const style = classes;
    const isPast = day.date < new Date();

    return (
        <div className={`
                ${style.calendarCell}
                ${!isPast && style.calendarCellUpcoming}
                ${isPast && style.calendarCellPast}
            `}>
            {bookings?.map(booking =>  (
                <BookingBar day={day} user={user} booking={booking} />
            ))}
        </div>
    );
}

export default CalendarCell;
