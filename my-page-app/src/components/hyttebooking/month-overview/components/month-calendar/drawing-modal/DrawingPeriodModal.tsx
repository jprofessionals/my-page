import React from "react";
import {DrawingPeriod, PendingBookingTrain, User} from "@/types";
import {Button} from "@/components/ui/button";
import SimpleModal from "@/components/ui/SimpleModal";

type Props = {
    user?: User;
    bookingTrain?: PendingBookingTrain;
    onCancel: () => void;
    onPerformDrawing: (bookingTrain: PendingBookingTrain) => void;
}

const DrawingPeriodModal = ({bookingTrain, user, onCancel, onPerformDrawing}: Props) => {
    function handlePerformDrawing() {
        if (bookingTrain) {
            onPerformDrawing(bookingTrain);
        }
    }

    return (
        <SimpleModal
            header={"Trekningsperiode"}
            open={!!bookingTrain}
            onRequestClose={onCancel}
            content={
                <>
                    {bookingTrain?.drawingPeriodList
                        .flatMap(drawingPeriod => drawingPeriod.pendingBookings)
                        .map(pendingBooking => {
                                return <div key={pendingBooking.id}>
                                    <span>{pendingBooking.employeeName} ønsker {pendingBooking.apartment.cabin_name} fra {pendingBooking.startDate} til {pendingBooking.endDate}</span><br />
                                </div>
                        })
                    }
                </>
            }
            confirmButton={(!!user?.admin || undefined) &&
                <Button className='primary' onClick={handlePerformDrawing}>Trekk</Button>}
            cancelButton={<Button onClick={onCancel}>Lukk</Button>}
        />
    );
}

export default DrawingPeriodModal;


