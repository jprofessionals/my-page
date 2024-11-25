import Modal from "react-modal";
import React, {ChangeEvent, useEffect, useState} from "react";
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
    user?: User;
    onBookingCreated: () => void;
    onCancel: () => void;
}

const BookingAddModal = ({ bookingPost, user, onBookingCreated, onCancel }: Props) => {
    const [allApartments, setAllApartments] = useState<Apartment[]>([]);
    const [asAdmin, setAsAdmin] = useState<boolean>(!!user?.admin || false);
    const selectedApartment = allApartments.find(apartment => apartment.id === bookingPost?.apartmentID);
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
        setStartDate(bookingPost?.startDate)
        setEndDate(bookingPost?.endDate)
    }, [bookingPost])


    const createBooking = async ({ bookingPost }: {
        bookingPost: BookingPost
    }) => {
        const data = { ...bookingPost, startDate, endDate}
        const url = asAdmin ?
            bookingWithoutDrawing ?
                `${API_URL}booking/admin/post?bookingOwnerName=${bookingOwnerName}` :
                `${API_URL}pendingBooking/pendingPostForUser?bookingOwnerName=${bookingOwnerName}`
            : `${API_URL}pendingBooking/pendingPost`;
        return axios
            .post(url, data, { headers: authHeader()})
            .then((response) => response.data)
            .catch((error) => { throw error?.response?.data || 'En feil oppstod ved lagring'});
    };


    const handleConfirm = async () => {
        if (bookingPost) {
            await createBooking({bookingPost});
            onBookingCreated();
        }
    }

    const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value)
    }

    const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value)
    }

    return (
        <SimpleModal
            header={"Ny booking"}
            open={!!bookingPost}
            onRequestClose={onCancel}
            content={
            <>
                {user?.name}, ønsker du &quot;{selectedApartment?.cabin_name}&quot; i perioden
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
            cancelButton={<Button onClick={onCancel}>Avbryt</Button>}
            confirmButton={<Button onClick={handleConfirm} variant="primary">Bekreft</Button>}
          />
    );
}

export default BookingAddModal;


