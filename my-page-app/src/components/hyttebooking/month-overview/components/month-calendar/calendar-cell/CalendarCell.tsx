import {Booking, User} from "@/types";
import React from "react";
import {CalendarDay} from "react-day-picker";
import classes from "./CalendarCell.module.css";
import BookingBar from "./booking-bar/BookingBar";
import {
    getIsDayOfWeek
} from "@/components/hyttebooking/month-overview/components/month-calendar/calendar-date/calendarDateUtil";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import { format } from 'date-fns';

type Props = {
    bookings?: Booking[];
    day: CalendarDay;
    user: User;
}

const CalendarCell = ({ bookings = [], day, user }: Props)  => {
    const style = classes;
    const currentDate = new Date();
    currentDate.setTime(currentDate.getTime() - ((24*60*60*1000) * 1));
    const isPast =   day.date < currentDate;
    const isWednesday = getIsDayOfWeek(day) === 3;
    const dayString = format(day.date, dateFormat);
    const hasPeriodEnd = (bookings || []).find(booking => booking?.endDate === dayString);
    const hasPeriodStart = (bookings || []).find(booking => booking?.startDate === dayString);
    const showAddButton = !isPast && isWednesday && !hasPeriodStart;
    const showAddButtonPlaceholder = !isPast && isWednesday && !hasPeriodEnd && !showAddButton;

     return (
        <div className={`
            ${style.calendarCell}
            ${isWednesday && style.calendarCellWedDay}
            ${!isPast && style.calendarCellUpcoming}
            ${isPast && style.calendarCellPast}
        `}>

            {showAddButtonPlaceholder && (
                <div className={style.addButtonContainer}/>
            )}

            {bookings?.map(booking => (
                <BookingBar
                    day={day}
                    user={user}
                    booking={booking}
                />
            ))}

            {showAddButton && (
                <div className={style.addButtonContainer}>
                    <button className={style.addButton}>+</button>
                </div>
            )}
        </div>
    );
}

export default CalendarCell;
