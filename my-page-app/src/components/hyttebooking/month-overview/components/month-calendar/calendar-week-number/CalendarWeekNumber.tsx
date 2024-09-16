import React from "react";
import {CalendarWeek} from "react-day-picker";
import classes from "./CalendarWeekNumber.module.css";

type Props = {
    week: CalendarWeek;
}

const CalendarWeekNumber = ({ week }: Props) => {
    const style = classes;

    return (
        <div className={style.container}>
            {week.weekNumber}
        </div>
    )
}

export default CalendarWeekNumber;
