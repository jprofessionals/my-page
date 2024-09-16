import React from "react";
import {InfoBooking} from "@/types";
import classes from "./CalendarInfoNotices.module.css";


type Props = {
    infoNotices: InfoBooking[];
}

const CalendarInfoNotices = ({ infoNotices }: Props) => {
    const style = classes;

    return (
        <div
            title={`${infoNotices.map(infoBooking => `${infoBooking.description} `)}`}
            className={style.container}>
            { infoNotices.map(InfoBooking => (
                <div className={style.notice} />
            ))}
        </div>
    );
}
export default CalendarInfoNotices;
