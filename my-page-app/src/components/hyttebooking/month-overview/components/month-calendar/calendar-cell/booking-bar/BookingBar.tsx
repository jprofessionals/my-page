import {Booking, User} from "@/types";
import React from "react";
import {CalendarDay} from "react-day-picker";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import { format } from 'date-fns'
import classes from "./BookingBar.module.css";

type Props = {
    booking?: Booking;
    day: CalendarDay;
    user: User;
}
const BookingBar = ({ booking, day, user }: Props)  => {
    const style = classes;

    const getEmployeeName = () => {
        const dateString = format(day.date, dateFormat);
        switch (dateString) {
            case booking?.startDate : return booking?.employeeName.split(/\s/).reduce((response, word)=> response+=word.slice(0,1),'');
            default: return "";
        }
    }


    const isBooking = !!booking;
    const isPending = booking?.isPending;
    const todayString = format(new Date(), dateFormat);
    const isPast = booking?.endDate < todayString;
    const isMine = isBooking && !isPast && user?.name === booking?.employeeName;
    const isTheirs = isBooking && !isPast && user?.name !== booking?.employeeName;
    const isPeriodStart = booking?.startDate === format(day.date, dateFormat);
    const isPeriodEnd = booking?.endDate === format(day.date, dateFormat);
    const showPeriodStart = booking && isPeriodStart;
    const showPeriodEnd = booking && isPeriodEnd;
    const showMinePending = isMine && isPending;
    const showTheirsPending = isTheirs && isPending;

    return (
        <div className={`
                ${style.bookingBar} 
                ${isPast && style.calendarCellPast}
                ${showPeriodStart && style.calendarCellPeriodStart}  
                ${showPeriodEnd && style.calendarCellPeriodEnd}
                ${isMine && style.calendarCellMine}
                ${showMinePending && style.calendarCellMinePending} 
                ${isTheirs && style.calendarCellTheirs} 
                ${showTheirsPending && style.calendarCellTheirsPending} 
            `}>
            {showPeriodStart && (
                <div className={`
                    ${style.calendarCellNameLabel}
                    ${!isPast && style.calendarCellNameLabelUpcoming}
                    ${isPast && style.calendarCellNameLabelPast}
                `}>
                    {getEmployeeName()}
                </div>
            )}
        </div>
    );
}

export default BookingBar;
