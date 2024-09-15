import React from "react";
import {InfoBooking} from "@/types";

type Props = {
    infoNotices: InfoBooking[];
}

const CalendarInfoNotices = ({ infoNotices }: Props) => (
    <div
        title={`${infoNotices.map(infoBooking => `${infoBooking.description} `)}`}
        style={{
        height: "2rem",
        marginBottom: "0.2rem",
        width: "100%",
    }}>
        { infoNotices.map(InfoBooking => (
            <div style={{
                width: "100%",
                borderBottom: "3px solid",
                borderColor: "#ffcf38",
                marginBottom: "0.1rem"
            }}/>
        ))}
    </div>
);
export default CalendarInfoNotices;
