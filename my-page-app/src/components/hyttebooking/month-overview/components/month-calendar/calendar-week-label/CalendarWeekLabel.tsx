import React from "react";
import classes from "./CalendarWeekLabel.module.css";

type Props = {
    cabinName: string;
    label: string;
}

const CalendarWeekLabel = ({ cabinName, label }: Props) => {
    const style = classes;

    return (
        <div className={style.weekLabel}>
            {label}
        </div>
    )
}

export default CalendarWeekLabel;
