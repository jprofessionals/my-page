import React from "react";
import {Booking, User} from "@/types";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import { format } from 'date-fns';
import {Button} from "@/components/ui/button";
import SimpleModal from "@/components/ui/SimpleModal";

type Props = {
    user: User;
    booking?: Booking;
    onCancel: () => void;
}

const BookingReadOnlyInfoModal = ({ booking, user, onCancel }: Props) => {
    return (
        <SimpleModal
            header={"Booking-info"}
            open={!!booking}
            onRequestClose={onCancel}
            content={
                <>
                    {user?.name} Har booket "{booking?.apartment.cabin_name}" for perioden
                    {booking?.startDate && format(booking?.startDate, dateFormat)} til {booking?.endDate && format(booking?.endDate, dateFormat)} ?
                </>
            }
            cancelButton={
                <Button onClick={onCancel}>Avbryt</Button>
            }
        />
    );
}

export default BookingReadOnlyInfoModal;


