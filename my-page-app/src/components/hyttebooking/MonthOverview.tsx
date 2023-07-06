import React, {useState} from 'react';
import Modal from 'react-modal';
import {MonthCalendar} from '@/components/ui/monthCalendar';
import ApiService from '@/services/api.service';
import {Booking} from '@/types'

export default function MonthOverview() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [showModal, setShowModal] = useState(false)
    const [bookingItems, setBookingItems] = useState<Booking[]>([])
    const [expandedApartments, setExpandedApartments] = useState<number[]>([])
    const handleDateClick = (date: Date) => {
        setShowModal(true)
        setDate(date)
        fetchBookingItems(date)
        checkAvailability(date)
    }

    const customModalStyles = {
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
        }
    }
    const closeModal = () => {
        setShowModal(false)
    }

    const handleApartmentClick = (apartmentId: number) => {
        setExpandedApartments((prevExpandedApartments) => {
            const isExpanded = prevExpandedApartments.includes(apartmentId)
            if (isExpanded) {
                return prevExpandedApartments.filter((id) => id !== apartmentId)
            } else {
                return [...prevExpandedApartments, apartmentId]
            }
        })
    }

    const fetchBookingItems = async (selectedDate: Date) => {
        try {
            const year = selectedDate.getFullYear()
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
            const day = String(selectedDate.getDate()).padStart(2, '0')
            const formattedDate = `${year}-${month}-${day}`
            const bookings = await ApiService.getBookingsForDay(formattedDate)
            setBookingItems(bookings)
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const [apartmentOneAvailable, setapartmentOneAvailable] = useState<String>("")
    const [apartmentTwoAvailable, setapartmentTwoAvailable] = useState<String>("")
    const [apartmentThreeAvailable, setapartmentThreeAvailable] = useState<String>("")
    const checkAvailability = async (selectedDate: Date) => {
        try {
            const year = selectedDate.getFullYear()
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
            const day = String(selectedDate.getDate()).padStart(2, '0')
            const formattedDate = `${year}-${month}-${day}`
            const availableOne = await ApiService.getAvailableBookingsForDay(formattedDate, 1)
            const availableTwo = await ApiService.getAvailableBookingsForDay(formattedDate, 2)
            const availableThree = await ApiService.getAvailableBookingsForDay(formattedDate, 3)
            setapartmentOneAvailable(availableOne)
            setapartmentTwoAvailable(availableTwo)
            setapartmentThreeAvailable(availableThree)
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
                style={customModalStyles}
            >
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 prose">
                    {bookingItems.length > 0 ? (
                        <div>
                            <h2>Bookinger for denne datoen:</h2>
                            {bookingItems.map((booking, index) => {
                                const startDate = new Date(booking.startDate)
                                const endDate = new Date(booking.endDate)
                                const formattedStartDate = `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()}`
                                const formattedEndDate = `${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()}`

                                return (
                                    <div key={booking.id}>
                                        <p>
                                            {booking.employeeName} har booket hytten {booking.apartment.cabin_name} i
                                            perioden {formattedStartDate} til {formattedEndDate}.
                                        </p>
                                        {index !== bookingItems.length - 1 && <hr/>}
                                    </div>
                                )
                            })}
                            <h2>Ledige hytter:</h2>
                            <p>
                                <span className="apartment-text">{apartmentOneAvailable}</span>
                                <button
                                    onClick={() => handleApartmentClick(1)}
                                    className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
                                >
                                    Book
                                </button>
                            </p>
                            {expandedApartments.includes(1) && (
                                <div className="expanded-content">
                                    Her vil det komme mulighet for å gjøre en booking
                                </div>
                            )}

                            <p>
                                <span className="apartment-text">{apartmentTwoAvailable}</span>
                                <button
                                    onClick={() => handleApartmentClick(2)}
                                    className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
                                >
                                    Book
                                </button>
                            </p>
                            {expandedApartments.includes(2) && (
                                <div className="expanded-content">
                                    Her vil det komme mulighet for å gjøre en booking
                                </div>
                            )}

                            <p>
                                <span className="apartment-text">{apartmentThreeAvailable}</span>
                                <button
                                    onClick={() => handleApartmentClick(3)}
                                    className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
                                >
                                    Book
                                </button>
                            </p>
                            {expandedApartments.includes(3) && (
                                <div className="expanded-content">
                                    Her vil det komme mulighet for å gjøre en booking
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h2>Bookinger for denne datoen:</h2>
                            <p>Ingen bookinger for denne dagen</p>
                            <h3 className="mt-10">Ledige hytter: </h3>
                            <p>
                                <span className="apartment-text">{apartmentOneAvailable}</span>
                                <button
                                    onClick={() => handleApartmentClick(1)}
                                    className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
                                >
                                    Book
                                </button>
                            </p>
                            {expandedApartments.includes(1) && (
                                <div className="expanded-content">
                                    Her vil det komme mulighet for å gjøre en booking
                                </div>
                            )}

                            <p>
                                <span className="apartment-text">{apartmentTwoAvailable}</span>
                                <button
                                    onClick={() => handleApartmentClick(2)}
                                    className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
                                >
                                    Book
                                </button>
                            </p>
                            {expandedApartments.includes(2) && (
                                <div className="expanded-content">
                                    Her vil det komme mulighet for å gjøre en booking
                                </div>
                            )}

                            <p>
                                <span className="apartment-text">{apartmentThreeAvailable}</span>
                                <button
                                    onClick={() => handleApartmentClick(3)}
                                    className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
                                >
                                    Book
                                </button>
                            </p>
                            {expandedApartments.includes(3) && (
                                <div className="expanded-content">
                                    Her vil det komme mulighet for å gjøre en booking
                                </div>
                            )}
                        </div>
                    )}

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