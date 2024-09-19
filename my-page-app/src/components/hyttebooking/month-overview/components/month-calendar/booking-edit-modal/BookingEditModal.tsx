import Modal from "react-modal";
import React, {useEffect, useState} from "react";
import {Apartment, Booking, BookingPost, User} from "@/types";
import axios from "axios";
import ApiService, {API_URL} from "@/services/api.service";
import authHeader from "@/services/auth-header";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import { format } from 'date-fns';
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import NewEmployeeForm from "@/components/newemployee/NewEmployeeForm";
import SimpleModal from "@/components/ui/SimpleModal";

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


    const createBooking = async ({ bookingPost }: {
        bookingPost: BookingPost
    }) => {
        const url = asAdmin ?
            bookingWithoutDrawing ?
                `${API_URL}booking/admin/post?bookingOwnerName=${bookingOwnerName}` :
                `${API_URL}pendingBooking/pendingPostForUser?bookingOwnerName=${bookingOwnerName}`
            : `${API_URL}pendingBooking/pendingPost`;
        return axios
            .post(url, bookingPost, { headers: authHeader()})
            .then((response) => response.data)
            .catch((error) => { throw error?.response?.data || 'En feil oppstod ved lagring'});
    };


    const handleConfirm = async () => {
        if (booking) {
          //  await createBooking({bookingPost});
            onBookingSaved();
        }
    }


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
            optionalButton={<Button onClick={onCancel} variant="error" color={"red"}>Slett</Button>}
            confirmButton={<Button onClick={handleConfirm} variant="primary">Bekreft</Button>}
            cancelButton={<Button onClick={onCancel}>Avbryt</Button>}
        />
    );
}

export default BookingEditModal;


