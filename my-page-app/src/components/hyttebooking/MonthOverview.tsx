import React, {useState} from 'react';
import Modal from 'react-modal';
import {MonthCalendar} from '@/components/ui/monthCalendar';
import {PickDate} from '@/components/ui/pickDate';
import ApiService from '@/services/api.service';
import {Booking} from '@/types'

export default function MonthOverview() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [showModal, setShowModal] = useState(false)
    const [bookingItems, setBookingItems] = useState<Booking[]>([])
    const handleDateClick = (date: Date) => {
        setShowModal(true)
        setDate(date)
        fetchBookingItems(date)
    }

    const closeModal = () => {
        setShowModal(false)
    }

    const fetchBookingItems = async (selectedDate: Date) => {
        try {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const bookings = await ApiService.getBookingsForDay(formattedDate)
            setBookingItems(bookings)
        } catch (error) {
            console.error('Error:', error)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <MonthCalendar
                onDayClick={handleDateClick}
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
            />
            <Modal
                className=""
                isOpen={showModal}
                onRequestClose={closeModal}
                contentLabel="Selected Date"
            >
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 prose">

                    {bookingItems.length > 0 ? (
                        <div>
                            <h2>Bookinger for denne datoen:</h2>
                            {bookingItems.map((booking, index) => (
                                <div key={booking.id} className="mb-7">
                                    <p>Ansatt: {booking.employeeName}</p>
                                    <p>Hytte: {booking.apartment.cabin_name}</p>
                                    <p>Startdato: {booking.startDate}</p>
                                    <p>Sluttdato: {booking.endDate}</p>
                                    {index !== bookingItems.length - 1 && <hr />}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                        <h2>Bookinger for denne datoen:</h2>
                        <p className="mt-10">Det er ingen bookinger på denne dagen</p>
                        </div>
                    )}

                    <h2>Lag en booking: OBS Denne er under konstruksjon</h2>
                    <h3>Valgt dato:</h3>
                    <p>{date?.toDateString()}</p>
                    <div>{PickDate()}</div>

                    <button
                        onClick={closeModal}
                        className="mt-4 mr-4 bg-orange-500 text-white px-4 py-2 rounded-md"
                    >
                        Lukk
                    </button>
                </div>
            </Modal>
        </div>
    )
}

