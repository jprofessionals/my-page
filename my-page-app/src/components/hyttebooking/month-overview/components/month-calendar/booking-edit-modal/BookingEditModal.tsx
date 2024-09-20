import React, {useEffect, useState} from "react";
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
    const [asAdmin, setAsAdmin] = useState<boolean>(false); //user.admin
//    const selectedApartment = allApartments.find(apartment => apartment.id === bookingPost?.apartmentID);
    const bookingOwnerName = ""; //todo useState
    const bookingWithoutDrawing = false; //todo useState


    useEffect(() => {
        const fetchAllApartments = async () => {
            const response = await ApiService.getAllApartments();
            setAllApartments(response);
        };
        fetchAllApartments();
    }, []);


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


    const handleDelete = async() => {
        if (booking) {
            await deleteBookingByBookingId(booking.id);
            onBookingSaved();
        }
    };

    const handleChange = () => {
        if (booking) {

        }
    };

    const handleConfirm = async () => {
        if (booking) {
          //  await createBooking({bookingPost});
            onBookingSaved();
        }
    };

    const handleCancel = () => {
        onCancel();
    };


    return (
        <SimpleModal
            open={!!booking}
            onRequestClose={onCancel}
            header={"Endre booking"}
            content={
             <>
                 Hei {user?.name}! <br/>
                 Endre periode  du " " i perioden
             </>
            }
            optionalButton={<Button onClick={handleDelete} variant="error" color={"red"}>Slett</Button>}
            confirmButton={<Button onClick={handleConfirm} variant="primary">Bekreft</Button>}
            cancelButton={<Button onClick={handleCancel}>Avbryt</Button>}
        />
    );
}

export default BookingEditModal;


