import React from "react";
import {CalendarDay} from "react-day-picker";
import {getIsToday} from "@/components/hyttebooking/month-overview/components/month-calendar/monthCalendarUtil";

type Props = {
    day: CalendarDay;
}

const CalendarDate = ({ day }: Props) => (
    <div style={{padding: "0.2rem 0.8rem"}}>
        <div style={getIsToday(day) ? {
            backgroundColor: "#dc2323",
            color: "#ffffff",
            borderRadius: "1rem",
            width: "1.5rem",
            paddingLeft: "0.2rem"
        } : undefined}>
            {day.date.getDate()}
        </div>
    </div>
);

export default CalendarDate;
