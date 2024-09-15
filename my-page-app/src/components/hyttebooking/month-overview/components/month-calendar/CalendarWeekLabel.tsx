import React from "react";

type Props = {
    cabinName: string;
    label: string;
}

const CalendarWeekLabel = ({ cabinName, label }: Props) => (
    <div style={{
        height: "2rem",
        width: "5rem",
        marginBottom: "0.2rem",
        padding: "0.2rem 0.8rem",
        backgroundColor: "#f5f7fa",
        color: "#6e6e6e",
    }}>
        {label}
    </div>
)

export default CalendarWeekLabel;
