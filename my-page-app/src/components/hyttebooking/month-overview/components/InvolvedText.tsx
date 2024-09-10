import {DrawingPeriod} from "@/types";
import React from "react";


type Props = {
    drawingPeriod: DrawingPeriod;
}

const InvolvedText = ({ drawingPeriod }: Props) => (
    <>
        Involverte er:{' '}
        {drawingPeriod.pendingBookings.map((pendingBooking, bookingIndex) => (
            <span key={bookingIndex}>
                {pendingBooking.employeeName}
                {bookingIndex !== drawingPeriod.pendingBookings.length - 1 && ', '}
            </span>
        ))}
    </>
);

export default InvolvedText;
