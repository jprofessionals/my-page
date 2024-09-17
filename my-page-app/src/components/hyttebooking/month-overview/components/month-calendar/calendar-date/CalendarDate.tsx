import React from "react";
import {CalendarDay} from "react-day-picker";
import {
    getIsDayOfWeek,
    getIsToday
} from "./calendarDateUtil";
import classes from "./CalendarDate.module.css";


type Props = {
    day: CalendarDay;
}

const CalendarDate = ({ day }: Props) => {
    const style = classes;
    const isToday = getIsToday(day);
    const isWednesday = getIsDayOfWeek(day) === 3;

    return (
        <div className={style.container}>
            <div className={`
                ${style.date}
                ${isToday && style.today}
                ${isWednesday && style.wednesday}  
            `}>
                {day.date.getDate()}.
            </div>
        </div>
    );
}

export default CalendarDate;
