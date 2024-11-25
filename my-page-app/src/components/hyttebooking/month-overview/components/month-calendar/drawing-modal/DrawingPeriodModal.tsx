import React from "react";
import {DrawingPeriod, User} from "@/types";
import {Button} from "@/components/ui/button";
import SimpleModal from "@/components/ui/SimpleModal";

type Props = {
    user?: User;
    drawingPeriod?: DrawingPeriod;
    onCancel: () => void;
    onPerformDrawing: (drawingPeriod: DrawingPeriod) => void;
}

const DrawingPeriodModal = ({drawingPeriod, user, onCancel, onPerformDrawing}: Props) => {
    function handlePerformDrawing() {
        if (drawingPeriod) {
            onPerformDrawing(drawingPeriod);
        }
    }

    return (
        <SimpleModal
            header={"Trekningsperiode"}
            open={!!drawingPeriod}
            onRequestClose={onCancel}
            content={
                <>
                    {drawingPeriod?.pendingBookings.map(
                        pendingBooking => {
                            return <>
                                <span>{pendingBooking.employeeName} ønsker {pendingBooking.apartment.cabin_name} fra {pendingBooking.startDate} til {pendingBooking.endDate}</span><br />
                            </>
                        }
                    )}
                </>
            }
            confirmButton={(!!user?.admin || undefined) &&
                <Button className='primary' onClick={handlePerformDrawing}>Trekk</Button>}
            cancelButton={<Button onClick={onCancel}>Lukk</Button>}
        />
    );
}

export default DrawingPeriodModal;


