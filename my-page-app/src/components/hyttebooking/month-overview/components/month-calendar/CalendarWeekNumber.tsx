import React from "react";
import {CalendarWeek} from "react-day-picker";

type Props = {
    week: CalendarWeek;
}

const CalendarWeekNumber = ({ week }: Props) => (
    <div style={{
        padding: "0.2rem 0.8rem",
        width: "5rem",
        color: "silver",
        marginTop: "-1px"
    }}>
        {week.weekNumber}
    </div>
)

export default CalendarWeekNumber;
