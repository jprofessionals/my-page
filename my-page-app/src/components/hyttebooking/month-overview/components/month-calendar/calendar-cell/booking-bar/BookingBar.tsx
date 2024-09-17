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
    const isMine = isBooking  && user?.name === booking?.employeeName;
    const isTheirs = isBooking && user?.name !== booking?.employeeName;
    const isPeriodStart = booking?.startDate === format(day.date, dateFormat);
    const isPeriodEnd = booking?.endDate === format(day.date, dateFormat);
    const showPeriodStart = booking && isPeriodStart;
    const showPeriodEnd = booking && isPeriodEnd;
    const showMinePending = isMine && isPending;
    const showTheirsPending = isTheirs && isPending;

    return (
        <div className={`
                ${style.bookingBar} 
                ${showPeriodStart && style.bookingBarPeriodStart}  
                ${showPeriodEnd && style.bookingBarPeriodEnd}
                ${isMine && style.bookingBarMine}
                ${showMinePending && style.bookingBarMinePending} 
                ${isTheirs && style.bookingBarTheirs} 
                ${showTheirsPending && style.bookingBarTheirsPending} 
            `}>
            {showPeriodStart && (
                <div className={`
                    ${style.bookingBarNameLabel}
                    ${!isPast && style.bookingBarNameLabelUpcoming}
                `}>
                    {getEmployeeName()}
                </div>
            )}
        </div>
    );
}

export default BookingBar;
