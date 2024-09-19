import Modal from "react-modal";
import React, {useEffect, useState} from "react";
import {Apartment, BookingPost, User} from "@/types";
import axios from "axios";
import ApiService, {API_URL} from "@/services/api.service";
import authHeader from "@/services/auth-header";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import { format } from 'date-fns';
import {Button} from "@/components/ui/button";
import SimpleModal from "@/components/ui/SimpleModal";

type Props = {
    bookingPost?: BookingPost;
    user: User;
    onBookingCreated: () => void;
    onCancel: () => void;
}

const BookingAddModal = ({ bookingPost, user, onAbort, onBookingCreated, onCancel }: Props) => {
    const [allApartments, setAllApartments] = useState<Apartment[]>([]);
    const [asAdmin, setAsAdmin] = useState<boolean>(false); //user.admin
    const selectedApartment = allApartments.find(apartment => apartment.id === bookingPost?.apartmentID);
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
        if (bookingPost) {
            await createBooking({bookingPost});
            onBookingCreated();
        }
    }


    return (
        <SimpleModal
            header={"Ny booking"}
            open={!!bookingPost}
            onRequestClose={onAbort}
            content={
            <>
                {user?.name}, ønsker du "{selectedApartment?.cabin_name}" i perioden
                <br/>
                {bookingPost?.startDate && format(bookingPost.startDate, dateFormat)} til {bookingPost?.endDate && format(bookingPost.endDate, dateFormat)} ?
            </>
            }
            cancelButton={<Button onClick={onCancel}>Avbryt</Button>}
            confirmButton={<Button onClick={handleConfirm} variant="primary">Bekreft</Button>}
          />
    );
}

export default BookingAddModal;


