import {Booking, User} from "@/types";
import React from "react";
import {CalendarDay} from "react-day-picker";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import { format } from 'date-fns'
import classes from "./CalendarBooking.module.css";

type Props = {
    booking?: Booking;
    day: CalendarDay;
    user: User;
}

const CalendarBooking = ({ booking, day, user }: Props)  => {
    const style = classes;
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

    const getEmployeeName = () => {
        const dateString = format(day.date, dateFormat);
        switch (dateString) {
            case booking?.startDate : return booking?.employeeName.split(/\s/).reduce((response,word)=> response+=word.slice(0,1),'');
            //case booking?.startDate : return booking?.employeeName;
            default: return "";
        }
    }

    return (
        <div className={`
            ${style.calendarCell} 
            ${isPast && style.calendarCellPast}
            ${showPeriodStart && style.calendarCellPeriodStart}  
            ${showPeriodEnd && style.calendarCellPeriodEnd}
            ${isMine && style.calendarCellMine}
            ${showMinePending && style.calendarCellMinePending} 
            ${isTheirs && style.calendarCellTheirs} 
            ${showTheirsPending && style.calendarCellTheirsPending} 
        `}>
            <div className={style.calendarCellNameLabel}>
                {getEmployeeName()}
            </div>
        </div>
    );
}

export default CalendarBooking;
