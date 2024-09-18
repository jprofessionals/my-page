import Modal from "react-modal";
import React from "react";
import {BookingPost, User} from "@/types";
import axios from "axios";
import {API_URL} from "@/services/api.service";
import authHeader from "@/services/auth-header";


type Props = {
    bookingPost?: BookingPost;
    user: User;
    onSave: () => void;
    onCancel: () => void;
}

const AddBookingModal = ({ bookingPost, user, onAbort, onConfirm }: Props) => {

    const bookingOwnerName = ""; //todo useState
    const bookingWithoutDrawing = false; //todo useState

    const createBooking = async ({ bookingPost}: {
        bookingPost: BookingPost
    }) => {
        const url = user.admin ?
            bookingWithoutDrawing ?
                `${API_URL}booking/admin/post?bookingOwnerName=${bookingOwnerName}` :
                `${API_URL}pendingBooking/pendingPostForUser?bookingOwnerName=${bookingOwnerName}`
            : `${API_URL}pendingBooking/pendingPost`;

        return axios
            .post(url, bookingPost, { headers: authHeader()})
            .then((response) => response.data)
            .catch((error) => { throw error?.response?.data || 'En feil oppstod ved lagring'});
    }


    return (
        <Modal
            isOpen={!!bookingPost}
            onRequestClose={onAbort}
            contentLabel={"Book"}

            style={{
                content: {
                    width: 'auto',
                    minWidth: '300px',
                    margin: 'auto',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    transform: 'translate(-50%, -50%)',
                },
            }}
        >
            dds
        </Modal>
    );
}

export default AddBookingModal;


