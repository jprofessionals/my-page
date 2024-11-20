import React, {ChangeEvent, useEffect, useState} from "react";
import {Apartment, Booking, User} from "@/types";
import ApiService, {API_URL} from "@/services/api.service";
import {Button} from "@/components/ui/button";
import SimpleModal from "@/components/ui/SimpleModal";
import {toast} from "react-toastify";

type Props = {
    booking?: Booking;
    user: User;
    onBookingSaved: () => void;
    onCancel: () => void;
}

const BookingEditModal = ({ booking, user, onAbort, onBookingSaved, onCancel }: Props) => {
    const [allApartments, setAllApartments] = useState<Apartment[]>([]);
    const [asAdmin, setAsAdmin] = useState<boolean>(!!user?.admin || false);
//    const selectedApartment = allApartments.find(apartment => apartment.id === bookingPost?.apartmentID);
    const bookingOwnerName = ""; //todo useState
    const bookingWithoutDrawing = false; //todo useState
    const [startDate, setStartDate] = useState<string | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();


    useEffect(() => {
        const fetchAllApartments = async () => {
            const response = await ApiService.getAllApartments();
            setAllApartments(response);
        };
        fetchAllApartments();
    }, []);

    useEffect(() => {
        setStartDate(booking?.startDate)
        setEndDate(booking?.endDate)
    }, [booking]);


    const deleteBookingByBookingId = async (bookingId: number | null) => {
        try {
            await booking?.isPending ?
                ApiService.deletePendingBooking(bookingId) :
                ApiService.deleteBooking(bookingId);
            toast.success('Reservasjonen din er slettet')
        } catch (error) {
            toast.error(`Det oppstod en feil ved sletting: ${error}`,
            )
        }
    };

    const patchBookingByBookingId = async (bookingId: number | null, updatedBooking: Booking) => {
        try {
            await booking?.isPending ?
                ApiService.patchPendingBooking(bookingId, updatedBooking) :
                ApiService.patchBooking(bookingId, updatedBooking);
            toast.success('Reservasjonen din er oppdatert')
        } catch (error) {
            toast.error(`Det oppstod en feil ved oppdatering: ${error}`,
            )
        }
    };


    const handleDelete = async() => {
        if (booking) {
            await deleteBookingByBookingId(booking.id);
            onBookingSaved();
        }
    };

    const handleConfirm = async () => {
        if (booking && startDate && endDate) {
            const updatedBooking: Booking = {...booking, startDate, endDate}
            await patchBookingByBookingId(booking.id, updatedBooking);
            onBookingSaved();
        }
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value)
    }
    const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value)
    }

    return (
        <SimpleModal
            open={!!booking}
            onRequestClose={onCancel}
            header={"Endre booking"}
            content={
             <>
                 Hei {user?.name}! <br/>
                 Endre periode for &quot;{booking?.apartment?.cabin_name}&quot; i perioden
                 <br/>
                 <strong>Startdato:</strong>
                 <input
                     type="date"
                     name="startDate"
                     onChange={handleStartDateChange}
                     value={startDate}
                     placeholder={startDate}
                 />
                 <br/>
                 <strong>Sluttdato:</strong>
                 <input
                     type="date"
                     name="endDate"
                     onChange={handleEndDateChange}
                     value={endDate}
                     placeholder={endDate}
                 />
             </>
            }
            optionalButton={<Button onClick={handleDelete} variant="error" color={"red"}>Slett</Button>}
            confirmButton={<Button onClick={handleConfirm} variant="primary">Bekreft</Button>}
            cancelButton={<Button onClick={handleCancel}>Avbryt</Button>}
        />
    );
}

export default BookingEditModal;


